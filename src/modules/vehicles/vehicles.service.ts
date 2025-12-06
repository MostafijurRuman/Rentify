import { pool } from '../../DB/db';

type VehicleType = 'car' | 'bike' | 'van' | 'SUV';
type VehicleAvailability = 'available' | 'booked';

const allowedTypes: VehicleType[] = ['car', 'bike', 'van', 'SUV'];
const allowedStatuses: VehicleAvailability[] = ['available', 'booked'];

const createVehicles = async (
  vehicle_name: string,
  type: VehicleType,
  registration_number: string,
  daily_rent_price: number,
  availability_status: VehicleAvailability
) => {
  const trimmedName = vehicle_name?.trim();
  if (!trimmedName) {
    throw new Error('vehicle_name is required');
  }

  if (!allowedTypes.includes(type)) {
    throw new Error("type must be one of: 'car', 'bike', 'van', 'SUV'");
  }

  const normalizedRegistration = registration_number?.trim();
  if (!normalizedRegistration) {
    throw new Error('registration_number is required');
  }

  if (typeof daily_rent_price !== 'number' || Number.isNaN(daily_rent_price) || daily_rent_price <= 0) {
    throw new Error('daily_rent_price must be a positive number');
  }

  if (!allowedStatuses.includes(availability_status)) {
    throw new Error("availability_status must be either 'available' or 'booked'");
  }

  const existingVehicle = await pool.query(
    'SELECT 1 FROM vehicles WHERE registration_number = $1 LIMIT 1',
    [normalizedRegistration]
  );
  if (existingVehicle.rows.length > 0) {
    throw new Error('registration_number must be unique');
  }

  const insertQuery = `
    INSERT INTO vehicles (
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const insertedVehicle = await pool.query(insertQuery, [
    trimmedName,
    type,
    normalizedRegistration,
    daily_rent_price,
    availability_status,
  ]);

  return insertedVehicle.rows[0];
};

const getAllVehicles = async () => {
  const result = await pool.query('SELECT * FROM vehicles ORDER BY id ASC');
  return result.rows;
};

const getVehicleById = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid vehicle id');
  }

  const result = await pool.query('SELECT * FROM vehicles WHERE id = $1 LIMIT 1', [id]);
  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

export const vehicleServices = {
  createVehicles,
  getAllVehicles,
  getVehicleById,
};
