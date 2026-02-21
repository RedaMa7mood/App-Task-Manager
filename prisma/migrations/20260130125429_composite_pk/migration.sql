/*
  Warnings:

  - The primary key for the `Project_Member` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Project_Member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project_Member" DROP CONSTRAINT "Project_Member_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Project_Member_pkey" PRIMARY KEY ("projectId", "userId");
