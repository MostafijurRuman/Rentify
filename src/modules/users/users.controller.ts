import { Request, Response } from "express";
import { sendError } from "../../utils/sendError";
import { usersService } from "./users.service";

const getAllUsers = async (req: Request, res: Response) =>{
    try {
        const result = await usersService.getAllUsers();
        return res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result
    })
   } catch (error) {
        sendError(res,error)
    }
}

export  const usersController ={
    getAllUsers,
}