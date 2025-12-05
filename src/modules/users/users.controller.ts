import { Request, Response } from "express";
import { sendError } from "../../utils/sendError";
import { userServices } from "./users.service";

const signupUser = async(req:Request,res:Response) =>{
    const {name,email,password,phone,role} = req.body;
    try {
        const result = await userServices.signupUser(name,email,password,phone,role);
         res.status(201).json({
            "success": true,
            "message": "User registered successfully",
            "data": result.rows[0]
    });
        
    } catch (err) {
       sendError(res,err)
    }
}


export const userControllers = {
    signupUser,
}