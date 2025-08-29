/*
  Warnings:

  - A unique constraint covering the columns `[versionId,identifier]` on the table `sections` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "sections_versionId_identifier_key" ON "public"."sections"("versionId", "identifier");
