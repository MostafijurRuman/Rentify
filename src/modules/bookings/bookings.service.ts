
import { pool } from '../../DB/db';
type CreateBookingPayload = {
  customer_id: number;
  vehicle_id: number;
  rent_start_date: string;
  rent_end_date: string;
};

const parsePositiveInt = (value: unknown, fieldName: string) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return parsed;
};

const parseDate = (value: unknown, fieldName: string) => {
  if (!value) {
    throw new Error(`${fieldName} is required`);
  }
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }
  return parsed;
};

const createBooking = async (payload: CreateBookingPayload) => {
  const customerId = parsePositiveInt(payload.customer_id, 'customer_id');
  const vehicleId = parsePositiveInt(payload.vehicle_id, 'vehicle_id');
  const rentStartDate = parseDate(payload.rent_start_date, 'rent_start_date');
  const rentEndDate = parseDate(payload.rent_end_date, 'rent_end_date');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalizedStart = new Date(rentStartDate);
  normalizedStart.setHours(0, 0, 0, 0);

  if (normalizedStart < today) {
    throw new Error('rent_start_date cannot be in the past');
  }

  if (rentEndDate <= rentStartDate) {
    throw new Error('rent_end_date must be later than rent_start_date');
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const rentalDurationInDays = Math.ceil(
    (rentEndDate.getTime() - rentStartDate.getTime()) / millisecondsPerDay
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const customerResult = await client.query(
      `SELECT id, role
       FROM users
       WHERE id = $1`,
      [customerId]
    );

    if (customerResult.rowCount === 0) {
      throw new Error('Customer not found');
    }

    const customerRole = customerResult.rows[0].role;
    if (customerRole !== 'customer' && customerRole !== 'admin') {
      throw new Error('Customer is not allowed to create bookings');
    }

    const vehicleResult = await client.query(
      `SELECT id, vehicle_name, daily_rent_price, availability_status
       FROM vehicles
       WHERE id = $1
       FOR UPDATE`,
      [vehicleId]
    );

    if (vehicleResult.rowCount === 0) {
      throw new Error('Vehicle not found');
    }

    const vehicle = vehicleResult.rows[0];
    if (vehicle.availability_status !== 'available') {
      throw new Error('Vehicle is not available for booking');
    }

    const dailyRate = Number(vehicle.daily_rent_price);
    const totalPrice = Number((dailyRate * rentalDurationInDays).toFixed(2));

    const bookingInsertQuery = `
      INSERT INTO bookings (
        customer_id,
        vehicle_id,
        rent_start_date,
        rent_end_date,
        total_price,
        status
      ) VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status
    `;

    const result = await client.query(bookingInsertQuery, [
      customerId,
      vehicleId,
      rentStartDate,
      rentEndDate,
      totalPrice,
    ]);

    await client.query(`UPDATE vehicles SET availability_status = 'booked' WHERE id = $1`, [
      vehicleId,
    ]);

    await client.query('COMMIT');

    const booking = result.rows[0];

    const formatDate = (dateValue: Date | string) => {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return date.toISOString().split('T')[0];
    };

    return {
      ...booking,
      rent_start_date: formatDate(booking.rent_start_date),
      rent_end_date: formatDate(booking.rent_end_date),
      total_price: Number(booking.total_price),
      vehicle: {
        vehicle_name: vehicle.vehicle_name,
        daily_rent_price: dailyRate,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const bookingServices = {
  createBooking,
};
