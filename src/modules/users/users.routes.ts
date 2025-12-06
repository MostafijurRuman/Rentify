import { Router } from "express";
import { usersController } from "./users.controller";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireAdmin } from "../../middlewares/requireAdmin";

const router = Router();

// Users CRUD Here 

router.get("/",requireAuth,requireAdmin, usersController.getAllUsers)


export const usersRouter = router;