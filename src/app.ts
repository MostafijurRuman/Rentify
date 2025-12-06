import express, { Request, Response } from 'express';
import { userRoutes } from './modules/auth/auth.route';
import { vehiclesRoutes } from './modules/vehicles/vehicles.routes';

const app = express();

// parser
app.use(express.json());


// Root Route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "This is the root route ",
    path: req.path,
  });
});

// Users Routes
app.use('/api/v1/auth', userRoutes);
// Vehicles Routes
app.use('/api/v1', vehiclesRoutes);

// 404 Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

export default app;
