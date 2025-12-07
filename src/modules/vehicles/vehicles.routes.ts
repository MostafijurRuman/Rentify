import express from "express"
import { vehiclesController } from "./vehicles.controller";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireAdmin } from "../../middlewares/requireAdmin";

const router =express.Router();

// Vehicles CRUD Here..
router.post("/" , requireAuth,requireAdmin, vehiclesController.createVehicle);
router.get("/",vehiclesController.getAllVehicles)
router.get("/:vehicleId", vehiclesController.getVehicleById)
router.put("/:vehicleId", requireAuth, requireAdmin, vehiclesController.updateVehicle)
router.delete("/:vehicleId", requireAuth, requireAdmin, vehiclesController.deleteVehicle)

export const vehiclesRoutes = router;
