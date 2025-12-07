
import { PoolClient } from 'pg';
import { pool } from '../../DB/db';

const httpError = (message: string, status: number) => {
  const error = new Error(message);
  (error as any).status = status;
  return error;
};
type BookingStatus = 'active' | 'cancelled' | 'returned';
type CreateBookingPayload = {
  customer_id: number;
  vehicle_id: number;
  rent_start_date: string;
  rent_end_date: string;
};

const parsePositiveInt = (value: unknown, fieldName: string) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw httpError(`${fieldName} must be a positive integer`, 400);
  }
  return parsed;
};

const parseDate = (value: unknown, fieldName: string) => {
  if (!value) {
    throw httpError(`${fieldName} is required`, 400);
  }
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) {
    throw httpError(`${fieldName} must be a valid date`, 400);
  }
  return parsed;
};

const formatDate = (dateValue: Date | string) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return date.toISOString().split('T')[0];
};

const normalizeDate = (dateValue: Date) => {
  const clone = new Date(dateValue);
  clone.setHours(0, 0, 0, 0);
  return clone;
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
    throw httpError('rent_start_date cannot be in the past', 400);
  }

  if (rentEndDate <= rentStartDate) {
    throw httpError('rent_end_date must be later than rent_start_date', 400);
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
      throw httpError('Customer not found', 404);
    }

    const customerRole = customerResult.rows[0].role;
    if (customerRole !== 'customer' && customerRole !== 'admin') {
      throw httpError('Customer is not allowed to create bookings', 403);
    }

    const vehicleResult = await client.query(
      `SELECT id, vehicle_name, daily_rent_price, availability_status
       FROM vehicles
       WHERE id = $1
       FOR UPDATE`,
      [vehicleId]
    );

    if (vehicleResult.rowCount === 0) {
      throw httpError('Vehicle not found', 404);
    }

    const vehicle = vehicleResult.rows[0];
    if (vehicle.availability_status !== 'available') {
      throw httpError('Vehicle is not available for booking', 400);
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

const autoCompleteIfEnded = async (client: PoolClient, booking: any) => {
  const rentEnd = new Date(booking.rent_end_date);
  const now = new Date();
  if (booking.status === 'active' && rentEnd.getTime() < now.getTime()) {
    const updated = await client.query(
      `
      UPDATE bookings
      SET status = 'returned'
      WHERE id = $1
      RETURNING *
    `,
      [booking.id]
    );

    await client.query(`UPDATE vehicles SET availability_status = 'available' WHERE id = $1`, [
      booking.vehicle_id,
    ]);

    return updated.rows[0];
  }
  return booking;
};

const getBookingsByRole = async (userId: number, role: string) => {
  const parsedUserId = parsePositiveInt(userId, 'userId');
  if (role === 'admin') {
    const adminQuery = `
      SELECT
        b.id,
        b.customer_id,
        b.vehicle_id,
        b.rent_start_date,
        b.rent_end_date,
        b.total_price,
        b.status,
        u.name AS customer_name,
        u.email AS customer_email,
        v.vehicle_name,
        v.registration_number
      FROM bookings b
      INNER JOIN users u ON u.id = b.customer_id
      INNER JOIN vehicles v ON v.id = b.vehicle_id
      ORDER BY b.id DESC
    `;

    const result = await pool.query(adminQuery);
    return result.rows.map((row) => ({
      id: row.id,
      customer_id: row.customer_id,
      vehicle_id: row.vehicle_id,
      rent_start_date: formatDate(row.rent_start_date),
      rent_end_date: formatDate(row.rent_end_date),
      total_price: Number(row.total_price),
      status: row.status,
      customer: {
        name: row.customer_name,
        email: row.customer_email,
      },
      vehicle: {
        vehicle_name: row.vehicle_name,
        registration_number: row.registration_number,
      },
    }));
  }

  const customerQuery = `
    SELECT
      b.id,
      b.vehicle_id,
      b.rent_start_date,
      b.rent_end_date,
      b.total_price,
      b.status,
      v.vehicle_name,
      v.registration_number,
      v.type
    FROM bookings b
    INNER JOIN vehicles v ON v.id = b.vehicle_id
    WHERE b.customer_id = $1
    ORDER BY b.id DESC
  `;

  const result = await pool.query(customerQuery, [parsedUserId]);
  return result.rows.map((row) => ({
    id: row.id,
    vehicle_id: row.vehicle_id,
    rent_start_date: formatDate(row.rent_start_date),
    rent_end_date: formatDate(row.rent_end_date),
    total_price: Number(row.total_price),
    status: row.status,
    vehicle: {
      vehicle_name: row.vehicle_name,
      registration_number: row.registration_number,
      type: row.type,
    },
  }));
};


const updateBookingStatus = async (
  bookingId: number,
  requestedStatus: string,
  authUserId: number,
  authRole: string
) => {
  const id = parsePositiveInt(bookingId, 'bookingId');
  const userId = parsePositiveInt(authUserId, 'userId');
  const allowedStatuses: BookingStatus[] = ['cancelled', 'returned'];
  const normalizedStatus = requestedStatus.trim().toLowerCase() as BookingStatus;

  if (!allowedStatuses.includes(normalizedStatus)) {
    throw httpError("status must be either 'cancelled' or 'returned'", 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingResult = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (bookingResult.rowCount === 0) {
      throw httpError('Booking not found', 404);
    }

    let booking = bookingResult.rows[0];
    booking = await autoCompleteIfEnded(client, booking);

    if (authRole === 'customer') {
      if (booking.customer_id !== userId) {
        throw httpError('You can only update your own bookings', 403);
      }

      if (normalizedStatus !== 'cancelled') {
        throw httpError('Customers can only cancel bookings', 403);
      }

      if (booking.status !== 'active') {
        throw httpError('Only active bookings can be cancelled', 400);
      }

      const now = normalizeDate(new Date());
      const startDate = normalizeDate(new Date(booking.rent_start_date));
      if (now.getTime() >= startDate.getTime()) {
        throw httpError('You can only cancel before the booking start date', 400);
      }

      const cancellation = await client.query(
        `
        UPDATE bookings
        SET status = 'cancelled'
        WHERE id = $1
        RETURNING *
      `,
        [booking.id]
      );

      await client.query(`UPDATE vehicles SET availability_status = 'available' WHERE id = $1`, [
        booking.vehicle_id,
      ]);

      await client.query('COMMIT');

      const updated = cancellation.rows[0];
      return {
        booking: {
          id: updated.id,
          customer_id: updated.customer_id,
          vehicle_id: updated.vehicle_id,
          rent_start_date: formatDate(updated.rent_start_date),
          rent_end_date: formatDate(updated.rent_end_date),
          total_price: Number(updated.total_price),
          status: updated.status,
        },
        message: 'Booking cancelled successfully',
      };
    }

    if (authRole === 'admin') {
      if (normalizedStatus !== 'returned') {
        throw httpError("Admins can only mark bookings as 'returned'", 403);
      }

      if (booking.status === 'cancelled') {
        throw httpError('Cancelled bookings cannot be marked as returned', 400);
      }

      if (booking.status === 'returned') {
        await client.query('COMMIT');
        return {
          booking: {
            id: booking.id,
            customer_id: booking.customer_id,
            vehicle_id: booking.vehicle_id,
            rent_start_date: formatDate(booking.rent_start_date),
            rent_end_date: formatDate(booking.rent_end_date),
            total_price: Number(booking.total_price),
            status: booking.status,
            vehicle: {
              availability_status: 'available',
            },
          },
          message: 'Booking marked as returned. Vehicle is now available',
        };
      }

      const returned = await client.query(
        `
        UPDATE bookings
        SET status = 'returned'
        WHERE id = $1
        RETURNING *
      `,
        [booking.id]
      );

      await client.query(`UPDATE vehicles SET availability_status = 'available' WHERE id = $1`, [
        booking.vehicle_id,
      ]);

      await client.query('COMMIT');

      const updated = returned.rows[0];
      return {
        booking: {
          id: updated.id,
          customer_id: updated.customer_id,
          vehicle_id: updated.vehicle_id,
          rent_start_date: formatDate(updated.rent_start_date),
          rent_end_date: formatDate(updated.rent_end_date),
          total_price: Number(updated.total_price),
          status: updated.status,
          vehicle: {
            availability_status: 'available',
          },
        },
        message: 'Booking marked as returned. Vehicle is now available',
      };
    }

    throw httpError('Unauthorized role for updating bookings', 403);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const bookingServices = {
  createBooking,
  getBookingsByRole,
  updateBookingStatus,
};
