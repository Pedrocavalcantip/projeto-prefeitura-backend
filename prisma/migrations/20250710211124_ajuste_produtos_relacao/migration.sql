/*
  Warnings:

  - The primary key for the `produtos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_produto` on the `produtos` table. All the data in the column will be lost.
  - The primary key for the `realocacoes_produto` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `data_post` on the `realocacoes_produto` table. All the data in the column will be lost.
  - You are about to drop the column `email_ong_origem` on the `realocacoes_produto` table. All the data in the column will be lost.
  - You are about to drop the column `id_realocacao` on the `realocacoes_produto` table. All the data in the column will be lost.
  - You are about to drop the column `instagram_ong_origem` on the `realocacoes_produto` table. All the data in the column will be lost.
  - You are about to drop the column `nome_ong_origem` on the `realocacoes_produto` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp_ong_origem` on the `realocacoes_produto` table. All the data in the column will be lost.
  - Added the required column `facebook_ong` to the `produtos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url_imagem` to the `produtos` table without a default value. This is not possible if the table is not empty.
  - Made the column `instagram_ong` on table `produtos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `criado_em` on table `produtos` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "realocacoes_produto" DROP CONSTRAINT "realocacoes_produto_id_produto_fkey";

-- AlterTable
ALTER TABLE "produtos" DROP CONSTRAINT "produtos_pkey",
DROP COLUMN "id_produto",
ADD COLUMN     "facebook_ong" TEXT NOT NULL,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "url_imagem" TEXT NOT NULL,
ALTER COLUMN "nome_ong" SET DATA TYPE TEXT,
ALTER COLUMN "email_ong" SET DATA TYPE TEXT,
ALTER COLUMN "whatsapp_ong" SET DATA TYPE TEXT,
ALTER COLUMN "instagram_ong" SET NOT NULL,
ALTER COLUMN "instagram_ong" SET DATA TYPE TEXT,
ALTER COLUMN "urgencia" SET DATA TYPE TEXT,
ALTER COLUMN "tipo_item" SET DATA TYPE TEXT,
ALTER COLUMN "prazo_necessidade" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "criado_em" SET NOT NULL,
ALTER COLUMN "criado_em" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "produtos_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "realocacoes_produto" DROP CONSTRAINT "realocacoes_produto_pkey",
DROP COLUMN "data_post",
DROP COLUMN "email_ong_origem",
DROP COLUMN "id_realocacao",
DROP COLUMN "instagram_ong_origem",
DROP COLUMN "nome_ong_origem",
DROP COLUMN "whatsapp_ong_origem",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "realocacoes_produto_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "realocacoes_produto" ADD CONSTRAINT "realocacoes_produto_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
