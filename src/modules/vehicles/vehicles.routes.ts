import express from "express"
import { vehiclesController } from "./vehicles.controller";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireAdmin } from "../../middlewares/requireAdmin";

const router =express.Router();

// Vehicles CRUD Here..
router.post("/vehicles" , requireAuth,requireAdmin, vehiclesController.createVehicle);
router.get("/vehicles",vehiclesController.getAllVehicles)
router.get("/vehicles/:vehicleId", vehiclesController.getVehicleById)
router.put("/vehicles/:vehicleId", requireAuth, requireAdmin, vehiclesController.updateVehicle)


export const vehiclesRoutes = router;