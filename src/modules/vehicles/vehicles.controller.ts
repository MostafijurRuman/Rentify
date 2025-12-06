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

const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await vehicleServices.getAllVehicles();

    if (vehicles.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No vehicles found',
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: vehicles,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }

}

const getVehicleById = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.vehicleId;
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'vehicleId must be a positive integer',
      });
    }

    const vehicle = await vehicleServices.getVehicleById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        data:[]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle retrieved successfully',
      data: vehicle,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateVehicle = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.vehicleId;
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'vehicleId must be a positive integer',
      });
    }

    const updatedVehicle = await vehicleServices.updateVehicle(id, req.body);

    if (!updatedVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updatedVehicle,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const vehiclesController = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle
};
