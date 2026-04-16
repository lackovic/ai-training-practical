import { BayEventType, BayStatus } from '@prisma/client';
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

export const searchBays = async (query: string) => {
  return ParkingRepository.searchOccupiedBays(query);
};

export const bookBay = async (bayId: number, driverName: string, vehicleRegistration: string) => {
  const bay = await ParkingRepository.findBayById(bayId);
  if (!bay) return null;
  if (bay.status === BayStatus.OCCUPIED) {
    const err: any = new Error('Bay is already occupied');
    err.statusCode = 409;
    throw err;
  }
  const updatedBay = await ParkingRepository.updateBayStatus(bayId, BayStatus.OCCUPIED, { driverName, vehicleRegistration });
  await ParkingRepository.createBayEvent(bayId, bay.zoneId, BayEventType.BOOKED);
  return updatedBay;
};

export const releaseBay = async (bayId: number) => {
  const bay = await ParkingRepository.findBayById(bayId);
  if (!bay) return null;
  if (bay.status === BayStatus.AVAILABLE) {
    const err: any = new Error('Bay is already available');
    err.statusCode = 409;
    throw err;
  }
  const updatedBay = await ParkingRepository.updateBayStatus(bayId, BayStatus.AVAILABLE, { driverName: null, vehicleRegistration: null });
  await ParkingRepository.createBayEvent(bayId, bay.zoneId, BayEventType.RELEASED);
  return updatedBay;
};

export const getOccupancyHistory = async () => {
  const [events, zones] = await Promise.all([
    ParkingRepository.findAllBayEvents(),
    ParkingRepository.findAllZonesWithAvailability(),
  ]);

  const total = zones.reduce((sum, z) => sum + z.bays.length, 0);
  const currentOccupied = zones.reduce(
    (sum, z) => sum + z.bays.filter((b) => b.status === BayStatus.OCCUPIED).length,
    0
  );

  // Derive occupancy before the first recorded event so the chart starts correctly
  // even if bays were already occupied before event tracking began.
  const netFromEvents = events.reduce(
    (net, e) => net + (e.eventType === BayEventType.BOOKED ? 1 : -1),
    0
  );
  const baseline = currentOccupied - netFromEvents;

  let occupied = baseline;
  const points = events.map((event) => {
    occupied += event.eventType === BayEventType.BOOKED ? 1 : -1;
    return { time: event.createdAt.toISOString(), occupied };
  });

  return { points, total };
};
