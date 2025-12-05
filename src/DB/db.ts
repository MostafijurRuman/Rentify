import{ Pool } from 'pg'
import config from '../config/config'
export const pool = new Pool({
    connectionString: config.db_connection_str
})

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE CHECK (email = LOWER(email)),
    password VARCHAR(225) NOT NULL CHECK (LENGTH(password)>= 6),
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin','customer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    )
    `);
};

export default initDB;