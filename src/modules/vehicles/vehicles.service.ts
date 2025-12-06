import { error } from 'console';
import { pool } from '../../DB/db';

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

const updateVehicle = async (id: number, payload: UpdateVehiclePayload) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid vehicle id');
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
      throw new Error('vehicle_name cannot be empty');
    }
    updates.push(`vehicle_name = $${paramIndex++}`);
    values.push(trimmedName);
  }

  if (payload.type !== undefined) {
    if (!allowedTypes.includes(payload.type)) {
      throw new Error("type must be one of: 'car', 'bike', 'van', 'SUV'");
    }
    updates.push(`type = $${paramIndex++}`);
    values.push(payload.type);
  }

  if (payload.registration_number !== undefined) {
    const normalizedRegistration = payload.registration_number?.trim();
    if (!normalizedRegistration) {
      throw new Error('registration_number cannot be empty');
    }

    const registrationExists = await pool.query(
      'SELECT 1 FROM vehicles WHERE registration_number = $1 AND id <> $2 LIMIT 1',
      [normalizedRegistration, id]
    );
    if (registrationExists.rows.length > 0) {
      throw new Error('registration_number must be unique');
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
      throw new Error('daily_rent_price must be a positive number');
    }
    updates.push(`daily_rent_price = $${paramIndex++}`);
    values.push(payload.daily_rent_price);
  }

  if (payload.availability_status !== undefined) {
    if (!allowedStatuses.includes(payload.availability_status)) {
      throw new Error("availability_status must be either 'available' or 'booked'");
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
    throw new Error('Invalid vehicle id');
  }

  const existing = await getVehicleById(id);
  if (!existing) {
    throw new Error("This vehicle doesn't exits");
  }
  if(existing.availability_status === "booked"){
    throw new Error("You can't delete it , this is booked by customer")
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
