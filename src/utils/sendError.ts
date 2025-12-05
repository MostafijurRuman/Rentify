import { Response } from "express";

export const sendError = (res: Response, err: any) => {
  const statusCode = err?.statusCode || err?.status || 500;
  const message = err?.message || "Internal Server Error";

  console.error("API Error:", err);

  res.status(statusCode).json({
    success: false,
    message,
  });
};
