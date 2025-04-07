-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('technology', 'healthCare', 'finance', 'education', 'retail', 'manufacturing', 'other');

-- CreateEnum
CREATE TYPE "Size" AS ENUM ('startup', 'small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('employee', 'manager', 'admin');

-- CreateEnum
CREATE TYPE "TeamMemberStatus" AS ENUM ('pending', 'active');

-- CreateEnum
CREATE TYPE "UserDeleteStatus" AS ENUM ('active', 'archive');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "userName" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "refreshToken" TEXT,
    "googleId" TEXT,
    "picture" TEXT,
    "role" TEXT DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "user" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "industry" "Industry",
    "size" "Size",
    "onboardingSkipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'employee',
    "status" "TeamMemberStatus" NOT NULL DEFAULT 'pending',
    "userDeleteStatus" "UserDeleteStatus" NOT NULL DEFAULT 'active',
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timers" (
    "id" SERIAL NOT NULL,
    "user" INTEGER NOT NULL,
    "task" TEXT NOT NULL,
    "project" TEXT,
    "client" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "otp" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
