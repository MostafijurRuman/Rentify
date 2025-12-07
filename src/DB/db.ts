import { Pool } from 'pg';
import config from '../config/config';
export const pool = new Pool({
  connectionString: config.db_connection_str,
});

const initDB = async () => {
  const userTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE CHECK (email = LOWER(email)),
      password VARCHAR(225) NOT NULL CHECK (LENGTH(password) >= 6),
      phone VARCHAR(20) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'customer')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const vehicleTableQuery = `
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      vehicle_name VARCHAR(255) NOT NULL,
      type VARCHAR(10) NOT NULL CHECK (type IN ('car', 'bike', 'van', 'SUV')),
      registration_number VARCHAR(100) NOT NULL UNIQUE,
      daily_rent_price NUMERIC(10, 2) NOT NULL CHECK (daily_rent_price > 0),
      availability_status VARCHAR(15) NOT NULL CHECK (availability_status IN ('available', 'booked'))
    );
  `;
    const bookingTableQuery = `
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,

      customer_id INT NOT NULL,
      vehicle_id INT NOT NULL,

      rent_start_date DATE NOT NULL,
      rent_end_date DATE NOT NULL,

      total_price NUMERIC(10, 2) NOT NULL CHECK (total_price > 0),

      status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'returned')),

      CONSTRAINT fk_customer
        FOREIGN KEY (customer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      CONSTRAINT fk_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles(id)
        ON DELETE CASCADE,

      CONSTRAINT valid_rent_dates
        CHECK (rent_end_date > rent_start_date)
    );
  `;

  await pool.query(userTableQuery);
  await pool.query(vehicleTableQuery);
  await pool.query(bookingTableQuery);
};

export default initDB;
