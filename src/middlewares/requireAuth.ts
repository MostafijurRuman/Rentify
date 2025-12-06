import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config/config";


export const requireAuth = (req: Request , res:Response , next:NextFunction)=>{
    try {
        const authHeader = req.headers.authorization;
        // check if it valid or not
        if(!authHeader || !authHeader.startsWith("Bearer")){
            return res.status(401).json({
                success:false,
                message: "Unauthorized: Invalid or expired token"
            })
        }
        // Token extract
        const token = authHeader.split(" ")[1]
        // Verify Token
        const decoded = jwt.verify(token as string,config.access_secret as string) as JwtPayload
        // Token valid → user attach
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid or expired token",
        })
        
    }
}