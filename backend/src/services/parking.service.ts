import { BayStatus } from '@prisma/client';
import * as ParkingRepository from '../repositories/parking.repository';

export const getAllZonesWithAvailability = async () => {
  const zones = await ParkingRepository.findAllZonesWithAvailability();
  return zones.map((zone) => {
    const total = zone.bays.length;
    const available = zone.bays.filter((b) => b.status === BayStatus.AVAILABLE).length;
    return {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      totalBays: total,
      availableBays: available,
      occupiedBays: total - available,
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    };
  });
};

export const getBaysByZone = async (zoneId: number) => {
  const zone = await ParkingRepository.findZoneById(zoneId);
  if (!zone) return null;
  return ParkingRepository.findBaysByZoneId(zoneId);
};

export const bookBay = async (bayId: number) => {
  const bay = await ParkingRepository.findBayById(bayId);
  if (!bay) return null;
  if (bay.status === BayStatus.OCCUPIED) {
    const err: any = new Error('Bay is already occupied');
    err.statusCode = 409;
    throw err;
  }
  return ParkingRepository.updateBayStatus(bayId, BayStatus.OCCUPIED);
};

export const releaseBay = async (bayId: number) => {
  const bay = await ParkingRepository.findBayById(bayId);
  if (!bay) return null;
  if (bay.status === BayStatus.AVAILABLE) {
    const err: any = new Error('Bay is already available');
    err.statusCode = 409;
    throw err;
  }
  return ParkingRepository.updateBayStatus(bayId, BayStatus.AVAILABLE);
};
