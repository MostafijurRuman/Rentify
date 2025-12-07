import { Request, Response } from "express";
import { vehicleServices } from "./vehicles.service";

const handleVehicleError = (res: Response, error: any) => {
  const status = error?.status || 500;
  res.status(status).json({
    success: false,
    message: error?.message || 'Internal Server Error',
  });
};

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
    handleVehicleError(res, error);
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
    handleVehicleError(res, error);
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
    handleVehicleError(res, error);
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
    handleVehicleError(res, error);
  }
};

const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.vehicleId;
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'vehicleId must be a positive integer',
      });
    }

    const deletedVehicle = await vehicleServices.deleteVehicle(id);

    if (!deletedVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error: any) {
    handleVehicleError(res, error);
  }
};

export const vehiclesController = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
};
