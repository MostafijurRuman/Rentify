import { pool } from "../../DB/db";

type UserRole = 'admin' | 'customer';
type UpdateUserPayload = {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
};

const safeUserSelect = 'id, name, email, phone, role';

const getAllUsers = async () => {
  const result = await pool.query(`SELECT ${safeUserSelect} FROM users ORDER BY id ASC`);
  return result.rows;
};

const getUserById = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid user id');
  }

  const result = await pool.query(`SELECT ${safeUserSelect} FROM users WHERE id = $1 LIMIT 1`, [id]);
  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

const updateUser = async (id: number, payload: UpdateUserPayload) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid user id');
  }

  const existingUser = await getUserById(id);
  if (!existingUser) {
    return null;
  }

  const updates: string[] = [];
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (payload.name !== undefined) {
    const trimmedName = payload.name.trim();
    if (!trimmedName) {
      throw new Error('name cannot be empty');
    }
    updates.push(`name = $${paramIndex++}`);
    values.push(trimmedName);
  }

  if (payload.email !== undefined) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('email cannot be empty');
    }

    const emailExists = await pool.query(
      'SELECT 1 FROM users WHERE email = $1 AND id <> $2 LIMIT 1',
      [normalizedEmail, id]
    );
    if (emailExists.rows.length > 0) {
      throw new Error('Email already in use');
    }

    updates.push(`email = $${paramIndex++}`);
    values.push(normalizedEmail);
  }

  if (payload.phone !== undefined) {
    const trimmedPhone = payload.phone.trim();
    if (!trimmedPhone) {
      throw new Error('phone cannot be empty');
    }
    updates.push(`phone = $${paramIndex++}`);
    values.push(trimmedPhone);
  }

  if (payload.role !== undefined) {
    if (payload.role !== 'admin' && payload.role !== 'customer') {
      throw new Error("role must be either 'admin' or 'customer'");
    }
    updates.push(`role = $${paramIndex++}`);
    values.push(payload.role);
  }

  if (updates.length === 0) {
    return existingUser;
  }

  const updateQuery = `
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING ${safeUserSelect}
  `;

  values.push(id);

  const result = await pool.query(updateQuery, values);
  return result.rows[0];
};

const deleteUser = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid user id');
  }

  const existingUser = await getUserById(id);
  if (!existingUser) {
    return null;
  }

  const bookingExists = await pool.query(
    "SELECT 1 FROM bookings WHERE customer_id = $1 AND status = 'active' LIMIT 1",
    [id]
  );
  if (bookingExists.rows.length > 0) {
    throw new Error('Cannot delete user with existing bookings');
  }
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING ${safeUserSelect}`,
    [id]
  );

  return result.rows[0];
};

export const usersService = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
