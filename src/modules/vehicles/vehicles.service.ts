import { error } from 'console';
import { pool } from '../../DB/db';

const httpError = (message: string, status: number) => {
  const err = new Error(message);
  (err as any).status = status;
  return err;
};

type VehicleType = 'car' | 'bike' | 'van' | 'SUV';
type VehicleAvailability = 'available' | 'booked';
type UpdateVehiclePayload = {
  vehicle_name?: string;
  type?: VehicleType;
  registration_number?: string;
  daily_rent_price?: number;
  availability_status?: VehicleAvailability;
};

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
    throw httpError('vehicle_name is required', 400);
  }

  if (!allowedTypes.includes(type)) {
    throw httpError("type must be one of: 'car', 'bike', 'van', 'SUV'", 400);
  }

  const normalizedRegistration = registration_number?.trim();
  if (!normalizedRegistration) {
    throw httpError('registration_number is required', 400);
  }

  if (typeof daily_rent_price !== 'number' || Number.isNaN(daily_rent_price) || daily_rent_price <= 0) {
    throw httpError('daily_rent_price must be a positive number', 400);
  }

  if (!allowedStatuses.includes(availability_status)) {
    throw httpError("availability_status must be either 'available' or 'booked'", 400);
  }

  const existingVehicle = await pool.query(
    'SELECT 1 FROM vehicles WHERE registration_number = $1 LIMIT 1',
    [normalizedRegistration]
  );
  if (existingVehicle.rows.length > 0) {
    throw httpError('registration_number must be unique', 400);
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
    throw httpError('Invalid vehicle id', 400);
  }
  const result = await pool.query('SELECT * FROM vehicles WHERE id = $1 LIMIT 1', [id]);
  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

const updateVehicle = async (id: number, payload: UpdateVehiclePayload) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError('Invalid vehicle id', 400);
  }

  const existing = await getVehicleById(id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (payload.vehicle_name !== undefined) {
    const trimmedName = payload.vehicle_name?.trim();
    if (!trimmedName) {
      throw httpError('vehicle_name cannot be empty', 400);
    }
    updates.push(`vehicle_name = $${paramIndex++}`);
    values.push(trimmedName);
  }

  if (payload.type !== undefined) {
    if (!allowedTypes.includes(payload.type)) {
      throw httpError("type must be one of: 'car', 'bike', 'van', 'SUV'", 400);
    }
    updates.push(`type = $${paramIndex++}`);
    values.push(payload.type);
  }

  if (payload.registration_number !== undefined) {
    const normalizedRegistration = payload.registration_number?.trim();
    if (!normalizedRegistration) {
      throw httpError('registration_number cannot be empty', 400);
    }

    const registrationExists = await pool.query(
      'SELECT 1 FROM vehicles WHERE registration_number = $1 AND id <> $2 LIMIT 1',
      [normalizedRegistration, id]
    );
    if (registrationExists.rows.length > 0) {
      throw httpError('registration_number must be unique', 400);
    }

    updates.push(`registration_number = $${paramIndex++}`);
    values.push(normalizedRegistration);
  }

  if (payload.daily_rent_price !== undefined) {
    if (
      typeof payload.daily_rent_price !== 'number' ||
      Number.isNaN(payload.daily_rent_price) ||
      payload.daily_rent_price <= 0
    ) {
      throw httpError('daily_rent_price must be a positive number', 400);
    }
    updates.push(`daily_rent_price = $${paramIndex++}`);
    values.push(payload.daily_rent_price);
  }

  if (payload.availability_status !== undefined) {
    if (!allowedStatuses.includes(payload.availability_status)) {
      throw httpError("availability_status must be either 'available' or 'booked'", 400);
    }
    updates.push(`availability_status = $${paramIndex++}`);
    values.push(payload.availability_status);
  }

  if (updates.length === 0) {
    return existing;
  }

  const updateQuery = `
    UPDATE vehicles
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  values.push(id);
  const updated = await pool.query(updateQuery, values);
  return updated.rows[0];
};

const deleteVehicle = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError('Invalid vehicle id', 400);
  }

  const existing = await getVehicleById(id);
  if (!existing) {
    return null;
  }
  if (existing.availability_status === 'booked') {
    throw httpError("You can't delete it , this is booked by customer", 400);
  }

  await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);
  return existing;
};

export const vehicleServices = {
  createVehicles,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
};
