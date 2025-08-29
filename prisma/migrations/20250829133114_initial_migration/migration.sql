-- CreateTable
CREATE TABLE "public"."agencies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."titles" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agencyId" INTEGER NOT NULL,

    CONSTRAINT "titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."versions" (
    "id" SERIAL NOT NULL,
    "titleId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "structureJson" JSONB NOT NULL,
    "contentXml" TEXT NOT NULL,

    CONSTRAINT "versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sections" (
    "id" SERIAL NOT NULL,
    "versionId" INTEGER NOT NULL,
    "identifier" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agencies_slug_key" ON "public"."agencies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "titles_code_key" ON "public"."titles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "versions_titleId_date_key" ON "public"."versions"("titleId", "date");

-- AddForeignKey
ALTER TABLE "public"."titles" ADD CONSTRAINT "titles_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "public"."agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."versions" ADD CONSTRAINT "versions_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "public"."titles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sections" ADD CONSTRAINT "sections_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "public"."versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
