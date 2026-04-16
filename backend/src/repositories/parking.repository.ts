import { PrismaClient, BayStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const findAllZonesWithAvailability = async () => {
  return prisma.parkingZone.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          bays: true,
        },
      },
      bays: {
        select: { status: true },
      },
    },
  });
};

export const findZoneById = async (id: number) => {
  return prisma.parkingZone.findUnique({ where: { id } });
};

export const findBaysByZoneId = async (zoneId: number) => {
  return prisma.parkingBay.findMany({
    where: { zoneId },
    orderBy: { bayNumber: 'asc' },
  });
};

export const findBayById = async (id: number) => {
  return prisma.parkingBay.findUnique({ where: { id } });
};

export const searchOccupiedBays = async (query: string) => {
  return prisma.parkingBay.findMany({
    where: {
      status: BayStatus.OCCUPIED,
      OR: [
        { driverName: { contains: query } },
        { vehicleRegistration: { contains: query } },
      ],
    },
    include: { zone: { select: { id: true, name: true } } },
    orderBy: [{ zone: { name: 'asc' } }, { bayNumber: 'asc' }],
  });
};

export const updateBayStatus = async (
  id: number,
  status: BayStatus,
  details: { driverName: string | null; vehicleRegistration: string | null } = { driverName: null, vehicleRegistration: null }
) => {
  return prisma.parkingBay.update({ where: { id }, data: { status, ...details } });
};
