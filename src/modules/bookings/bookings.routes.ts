import { Router } from "express";
import { bookingsControllers } from "./bookings.controller";
import { requireAuth } from "../../middlewares/requireAuth";

const router = Router();

// Booking routes here
router.post("/", requireAuth, bookingsControllers.createBooking)
router.get("/", requireAuth, bookingsControllers.getBookings)
router.put("/:bookingId", requireAuth, bookingsControllers.updateBooking)


export const bookingsRoutes = router;
