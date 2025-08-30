-- AlterTable
ALTER TABLE "public"."agencies" ADD COLUMN     "parentId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."agencies" ADD CONSTRAINT "agencies_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
