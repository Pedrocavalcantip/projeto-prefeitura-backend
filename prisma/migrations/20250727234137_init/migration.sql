-- CreateEnum
CREATE TYPE "NivelUrgencia" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "FinalidadeProduto" AS ENUM ('DOACAO', 'REALOCACAO');

-- CreateEnum
CREATE TYPE "StatusProduto" AS ENUM ('ATIVA', 'FINALIZADA');

-- CreateTable
CREATE TABLE "ongs" (
    "id_ong" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email_ong" VARCHAR(255) NOT NULL,
    "logo_url" VARCHAR(255) NOT NULL,

    CONSTRAINT "ongs_pkey" PRIMARY KEY ("id_ong")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id_produto" SERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo_item" VARCHAR(50) NOT NULL,
    "url_imagem" TEXT NOT NULL,
    "prazo_necessidade" DATE NOT NULL,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ong_id" INTEGER NOT NULL,
    "finalidade" "FinalidadeProduto" NOT NULL DEFAULT 'DOACAO',
    "quantidade" INTEGER DEFAULT 1,
    "urgencia" "NivelUrgencia" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusProduto" NOT NULL DEFAULT 'ATIVA',
    "email" VARCHAR(255) NOT NULL,
    "whatsapp" VARCHAR(20) NOT NULL,
    "finalizado_em" DATE,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id_produto")
);

-- CreateIndex
CREATE UNIQUE INDEX "ongs_email_ong_key" ON "ongs"("email_ong");

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_ong_id_fkey" FOREIGN KEY ("ong_id") REFERENCES "ongs"("id_ong") ON DELETE RESTRICT ON UPDATE CASCADE;
