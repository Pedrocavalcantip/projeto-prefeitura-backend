/*
  Warnings:

  - The primary key for the `produtos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email_ong` on the `produtos` table. All the data in the column will be lost.
  - You are about to drop the column `facebook_ong` on the `produtos` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `produtos` table. All the data in the column will be lost.
  - You are about to drop the column `instagram_ong` on the `produtos` table. All the data in the column will be lost.
  - You are about to drop the column `nome_ong` on the `produtos` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp_ong` on the `produtos` table. All the data in the column will be lost.
  - You are about to alter the column `urgencia` on the `produtos` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `tipo_item` on the `produtos` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - The primary key for the `realocacoes_produto` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `realocacoes_produto` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `voluntarios` table. All the data in the column will be lost.
  - Added the required column `ong_id` to the `produtos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titulo` to the `produtos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email_ong_origem` to the `realocacoes_produto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome_ong_origem` to the `realocacoes_produto` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "realocacoes_produto" DROP CONSTRAINT "realocacoes_produto_id_produto_fkey";

-- DropIndex
DROP INDEX "voluntarios_email_key";

-- AlterTable
ALTER TABLE "produtos" DROP CONSTRAINT "produtos_pkey",
DROP COLUMN "email_ong",
DROP COLUMN "facebook_ong",
DROP COLUMN "id",
DROP COLUMN "instagram_ong",
DROP COLUMN "nome_ong",
DROP COLUMN "whatsapp_ong",
ADD COLUMN     "id_produto" SERIAL NOT NULL,
ADD COLUMN     "ong_id" INTEGER NOT NULL,
ADD COLUMN     "titulo" VARCHAR(150) NOT NULL,
ALTER COLUMN "urgencia" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "tipo_item" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "prazo_necessidade" DROP NOT NULL,
ALTER COLUMN "prazo_necessidade" SET DATA TYPE DATE,
ALTER COLUMN "criado_em" DROP NOT NULL,
ALTER COLUMN "criado_em" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "url_imagem" DROP NOT NULL,
ADD CONSTRAINT "produtos_pkey" PRIMARY KEY ("id_produto");

-- AlterTable
ALTER TABLE "realocacoes_produto" DROP CONSTRAINT "realocacoes_produto_pkey",
DROP COLUMN "id",
ADD COLUMN     "data_post" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email_ong_origem" VARCHAR(255) NOT NULL,
ADD COLUMN     "id_realocacao" SERIAL NOT NULL,
ADD COLUMN     "instagram_ong_origem" VARCHAR(50),
ADD COLUMN     "nome_ong_origem" VARCHAR(100) NOT NULL,
ADD COLUMN     "whatsapp_ong_origem" VARCHAR(20),
ADD CONSTRAINT "realocacoes_produto_pkey" PRIMARY KEY ("id_realocacao");

-- AlterTable
ALTER TABLE "voluntarios" DROP COLUMN "email";

-- CreateTable
CREATE TABLE "ongs" (
    "id_ong" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "whatsapp" VARCHAR(20),
    "instagram" VARCHAR(50),
    "facebook" VARCHAR(50),
    "site" TEXT,
    "logo_url" TEXT,

    CONSTRAINT "ongs_pkey" PRIMARY KEY ("id_ong")
);

-- CreateIndex
CREATE UNIQUE INDEX "ongs_email_key" ON "ongs"("email");

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_ong_id_fkey" FOREIGN KEY ("ong_id") REFERENCES "ongs"("id_ong") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realocacoes_produto" ADD CONSTRAINT "realocacoes_produto_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos"("id_produto") ON DELETE NO ACTION ON UPDATE NO ACTION;
