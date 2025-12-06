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

const updateUser = async (req: Request, res: Response) =>{
    try {
        const idParam = req.params.userId;
        const userId = Number(idParam);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "userId must be a positive integer",
            });
        }

        const authUser = req.user;
        if (!authUser) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const isAdmin = authUser.role === "admin";
        const isSelf = authUser.id === userId;

        if (!isAdmin && !isSelf) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: insufficient permissions",
            });
        }

        const { name, email, phone, role } = req.body;
        const updatePayload: any = {};

        if (name !== undefined) updatePayload.name = name;
        if (email !== undefined) updatePayload.email = email;
        if (phone !== undefined) updatePayload.phone = phone;
        if (isAdmin && role !== undefined) {
            updatePayload.role = role;
        }

        if (Object.keys(updatePayload).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update",
            });
        }

        const updatedUser = await usersService.updateUser(userId, updatePayload);

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        sendError(res,error)
    }
}

const deleteUser = async (req: Request, res: Response) =>{
    try {
        const idParam = req.params.userId;
        const userId = Number(idParam);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "userId must be a positive integer",
            });
        }

        const authUser = req.user;
        if (!authUser || authUser.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: admin access required",
            });
        }

        const deletedUser = await usersService.deleteUser(userId);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        sendError(res,error)
    }
}

export  const usersController ={
    getAllUsers,
    updateUser,
    deleteUser
}
