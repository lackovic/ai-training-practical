import { Request, Response, NextFunction } from 'express';
import * as ParkingService from '../services/parking.service';

export const handleGetAllZones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zones = await ParkingService.getAllZonesWithAvailability();
    res.json(zones);
  } catch (error) {
    next(error);
  }
};

export const handleGetBaysByZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zoneId = parseInt(req.params.zoneId as string, 10);
    const bays = await ParkingService.getBaysByZone(zoneId);
    if (bays === null) {
      return res.status(404).json({ message: 'Zone not found' });
    }
    res.json(bays);
  } catch (error) {
    next(error);
  }
};

export const handleBookBay = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bayId = parseInt(req.params.bayId as string, 10);
    const { driverName, vehicleRegistration } = req.body;
    const bay = await ParkingService.bookBay(bayId, driverName, vehicleRegistration);
    if (bay === null) {
      return res.status(404).json({ message: 'Bay not found' });
    }
    res.json(bay);
  } catch (error) {
    next(error);
  }
};

export const handleReleaseBay = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bayId = parseInt(req.params.bayId as string, 10);
    const bay = await ParkingService.releaseBay(bayId);
    if (bay === null) {
      return res.status(404).json({ message: 'Bay not found' });
    }
    res.json(bay);
  } catch (error) {
    next(error);
  }
};
