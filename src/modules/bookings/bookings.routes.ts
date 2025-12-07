import { Router } from "express";
import { bookingsControllers } from "./bookings.controller";
import { requireAuth } from "../../middlewares/requireAuth";

const router = Router();

// Booking routes here
router.post("/", requireAuth, bookingsControllers.createBooking)


export const bookingsRoutes = router;
