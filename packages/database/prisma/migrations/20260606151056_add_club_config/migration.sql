-- CreateTable
CREATE TABLE "ClubConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "clubName" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "accentColor" TEXT,
    "eventName" TEXT,
    "eventDate" TEXT,
    "contactEmail" TEXT,

    CONSTRAINT "ClubConfig_pkey" PRIMARY KEY ("id")
);
