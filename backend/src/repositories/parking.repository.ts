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

export const updateBayStatus = async (id: number, status: BayStatus) => {
  return prisma.parkingBay.update({ where: { id }, data: { status } });
};
