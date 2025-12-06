import { NextFunction, Request, Response } from "express";

export const requireAdmin = (
  req:Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check User exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Role check
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin access only",
      });
    }

    //  Admin → allow
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin access only",
    });
  }
};
