import { Request, Response } from 'express';
import { sendError } from '../../utils/sendError';
import { bookingServices } from './bookings.service';

const createBooking = async (req: Request, res: Response) => {
  try {
    const authUser = req.user;

    if (!authUser || (authUser.role !== 'customer' && authUser.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: only customers or admins can create bookings',
      });
    }

    const authUserId = Number(authUser.id);
    const bodyCustomerId = Number(req.body.customer_id);
    if (authUser.role === 'customer') {
      if (!Number.isInteger(bodyCustomerId) || Number.isNaN(authUserId) || bodyCustomerId !== authUserId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: customers can only create bookings for themselves',
        });
      }
    }

    const result = await bookingServices.createBooking(req.body);

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: result,
    });
  } catch (error) {
    sendError(res, error);
  }
};

const getBookings = async (req: Request, res: Response) => {
  try {
    const authUser = req.user;

    if (!authUser || (authUser.role !== 'customer' && authUser.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: only customers or admins can view bookings',
      });
    }

    const bookings = await bookingServices.getBookingsByRole(Number(authUser.id), authUser.role);

    return res.status(200).json({
      success: true,
      message: authUser.role === 'admin' ? 'Bookings retrieved successfully' : 'Your bookings retrieved successfully',
      data: bookings,
    });
  } catch (error) {
    sendError(res, error);
  }
};

const updateBooking = async (req: Request, res: Response) => {
  try {
    const authUser = req.user;

    if (!authUser || (authUser.role !== 'customer' && authUser.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: only customers or admins can update bookings',
      });
    }

    const bookingIdParam = Number(req.params.bookingId);
    if (!Number.isInteger(bookingIdParam) || bookingIdParam <= 0) {
      return res.status(400).json({
        success: false,
        message: 'bookingId must be a positive integer',
      });
    }

    const requestedStatus = req.body?.status;
    if (typeof requestedStatus !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'status is required',
      });
    }

    const normalizedStatus = requestedStatus.trim().toLowerCase();

    const result = await bookingServices.updateBookingStatus(
      bookingIdParam,
      normalizedStatus as any,
      Number(authUser.id),
      authUser.role
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.booking,
    });
  } catch (error) {
    sendError(res, error);
  }
};

export const bookingsControllers = {
  createBooking,
  getBookings,
  updateBooking,
};
