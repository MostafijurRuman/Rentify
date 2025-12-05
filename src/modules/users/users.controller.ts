import { Request, Response } from "express";
import { sendError } from "../../utils/sendError";
import { userServices } from "./users.service";

// SignUp User Controller
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

// SignIn User Controller
const singinUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await userServices.signInUser(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data:result
    });
  } catch (error) {
    return sendError(res, error);
  }
};


export const userControllers = {
    signupUser,
    singinUser,
}
