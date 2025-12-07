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

export const bookingsControllers = {
  createBooking,
};
