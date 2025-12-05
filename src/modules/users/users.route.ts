import express from 'express'
import { userControllers } from './users.controller';
const router = express.Router();


// Users CRUD Here ...
router.post("/signup", userControllers.signupUser);

router.post("/signin", userControllers.singinUser)

export const userRoutes = router;
