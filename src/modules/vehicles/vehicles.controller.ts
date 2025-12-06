import { Request, Response } from "express";
import { vehicleServices } from "./vehicles.service";

const createVehicle = async(req: Request, res: Response) =>{
    try {
    const {
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status,
    } = req.body;


    const result = await vehicleServices.createVehicles(vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status,);

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }


}

export const vehiclesController ={
    createVehicle
}