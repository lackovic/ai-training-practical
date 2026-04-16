-- CreateTable
CREATE TABLE "ParkingZone" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ParkingBay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bayNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "zoneId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ParkingBay_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ParkingZone" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ParkingZone_name_key" ON "ParkingZone"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingBay_zoneId_bayNumber_key" ON "ParkingBay"("zoneId", "bayNumber");
