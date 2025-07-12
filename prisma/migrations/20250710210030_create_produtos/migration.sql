-- CreateTable
CREATE TABLE "produtos" (
    "id_produto" SERIAL NOT NULL,
    "nome_ong" VARCHAR(100) NOT NULL,
    "email_ong" VARCHAR(255) NOT NULL,
    "whatsapp_ong" VARCHAR(20) NOT NULL,
    "instagram_ong" VARCHAR(50),
    "urgencia" VARCHAR(20) NOT NULL,
    "tipo_item" VARCHAR(20) NOT NULL,
    "prazo_necessidade" DATE NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id_produto")
);

-- CreateTable
CREATE TABLE "realocacoes_produto" (
    "id_realocacao" SERIAL NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "nome_ong_origem" VARCHAR(100) NOT NULL,
    "email_ong_origem" VARCHAR(255) NOT NULL,
    "whatsapp_ong_origem" VARCHAR(20) NOT NULL,
    "instagram_ong_origem" VARCHAR(50),
    "data_post" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,

    CONSTRAINT "realocacoes_produto_pkey" PRIMARY KEY ("id_realocacao")
);

-- CreateTable
CREATE TABLE "voluntarios" (
    "id_beneficiario" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "whatsapp" VARCHAR(20) NOT NULL,
    "receber_alertas" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "voluntarios_pkey" PRIMARY KEY ("id_beneficiario")
);

-- CreateIndex
CREATE UNIQUE INDEX "voluntarios_email_key" ON "voluntarios"("email");

-- AddForeignKey
ALTER TABLE "realocacoes_produto" ADD CONSTRAINT "realocacoes_produto_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos"("id_produto") ON DELETE NO ACTION ON UPDATE NO ACTION;
