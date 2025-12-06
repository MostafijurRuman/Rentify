import express from 'express'
import { userControllers } from './auth.controller';
const router = express.Router();


// Users CRUD Here ...
router.post("/signup", userControllers.signupUser);

router.post("/signin", userControllers.singinUser)

export const authRoutes = router;
