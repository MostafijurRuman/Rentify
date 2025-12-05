import bcrypt from "bcryptjs";
import { pool } from "../../DB/db";

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

export const userServices = {
  signupUser,
};
