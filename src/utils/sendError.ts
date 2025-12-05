import { Response } from "express";

export const sendError = (res: Response, err: any) => {
  console.error("🔥 Error:", err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
