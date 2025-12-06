import { Router } from "express";
import { usersController } from "./users.controller";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireAdmin } from "../../middlewares/requireAdmin";

const router = Router();

// Users CRUD Here 

router.get("/",requireAuth,requireAdmin, usersController.getAllUsers)
router.put("/:userId", requireAuth, usersController.updateUser)
router.delete("/:userId", requireAuth, requireAdmin, usersController.deleteUser)


export const usersRouter = router;
