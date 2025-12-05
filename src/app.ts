import express, { Request, Response } from 'express'
import { userRoutes } from './modules/users/users.route';
import initDB from './DB/db';
const app = express();
// parser
app.use(express.json())

// initialize database
initDB();


// Root Route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "This is the root route",
    path: req.path,
  });
});

// Users Routes
app.use("/api/v1/auth", userRoutes)





// 404 Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

export default  app;
