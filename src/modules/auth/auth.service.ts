import bcrypt from "bcryptjs";
import { pool } from "../../DB/db";
import jwt from "jsonwebtoken";
import config from "../../config/config";

// SignUp User business logic
const signupUser = async (
  name: string,
  email: string,
  password: string,
  phone: string,
  role: string
) => {
  // Required field validation
  if (!name || !email || !password || !phone || !role) {
    throw new Error("All fields are required");
  }

  // Password minimum length validation
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  // Normalize email
  const lowercaseEmail = email.toLowerCase();

  // Hash password
  const hashedPass = await bcrypt.hash(password, 10);

  // Insert user and return safe fields only
  const result = await pool.query(
    `
    INSERT INTO users (name, email, password, phone, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, phone, role
    `,
    [name, lowercaseEmail, hashedPass, phone, role]
  );

  return result;
};




// SignIn User business logic
const signInUser = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const normalizedEmail = email.toLowerCase();

  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [normalizedEmail]
  );

  if (result.rowCount === 0) {
    throw new Error("Invalid email or password");
  }

  const user = result.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const { password: _password,created_at:khulesi, ...safeUser  } = user;

  const token = jwt.sign(safeUser,config.access_secret as string,{ expiresIn: "1d" } )
  
  const userWithToken = {
    "token":token,
    "user": safeUser
    
  }
  return userWithToken;
};


export const userServices = {
  signupUser,
  signInUser
};
