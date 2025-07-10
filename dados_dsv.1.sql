-- Configurações iniciais do banco
SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET default_tablespace = '';
SET default_with_oids = false;

-- Garante que começamos do zero, apagando as tabelas na ordem correta para evitar erros de dependência.
DROP TABLE IF EXISTS realocacoes_produto;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS voluntarios;

-- Tabela de voluntários (Mantida para funcionalidades futuras de alerta via WhatsApp)
CREATE TABLE voluntarios (
    id_beneficiario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    receber_alertas BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabela de produtos (doações) cadastrados pelas ONGs - VERSÃO FINAL REVISADA
CREATE TABLE produtos (
    id_produto SERIAL PRIMARY KEY,
    nome_ong VARCHAR(100) NOT NULL,
    email_ong VARCHAR(255) NOT NULL,
    whatsapp_ong VARCHAR(20) NOT NULL,
    instagram_ong VARCHAR(50),          -- Opcional
    facebook_ong VARCHAR(50),           -- Opcional
    urgencia VARCHAR(20) NOT NULL CHECK (urgencia IN ('Baixa', 'Média', 'Alta', 'Urgente')),
    tipo_item VARCHAR(20) NOT NULL,
    prazo_necessidade DATE,             -- Opcional, para dar mais flexibilidade às ONGs
    descricao TEXT NOT NULL,
    url_imagem TEXT,                    -- Opcional, para o link da imagem do produto
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para registrar realocação de itens entre ONGs (Mantida)
CREATE TABLE realocacoes_produto (
    id_realocacao SERIAL PRIMARY KEY,
    id_produto INTEGER NOT NULL REFERENCES produtos(id_produto),
    nome_ong_origem VARCHAR(100) NOT NULL,
    email_ong_origem VARCHAR(255) NOT NULL,
    whatsapp_ong_origem VARCHAR(20) NOT NULL,
    instagram_ong_origem VARCHAR(50),
    data_post TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT
);

-- Inserção de dados de exemplo (com sintaxe corrigida)
INSERT INTO voluntarios (nome, whatsapp, receber_alertas) VALUES
('João Silva','+5581999999999', TRUE),
('Maria Souza', '+5581888888888', TRUE);

INSERT INTO produtos (
    nome_ong, email_ong, whatsapp_ong, instagram_ong, facebook_ong, tipo_item, urgencia, prazo_necessidade, descricao
) VALUES
('Mãos Solidárias', 'contato@maossolidarias.org', '+5581991111111', '@maossolidarias', 'maossolidariasong',
 'Alimento', 'Alta', '2025-06-30', 'Precisamos de enlatados para montar cestas básicas para 100 famílias'),

('Ajuda Comunidade', 'contato@ajudacomunidade.org', '+5581992222222', '@ajudacomunidade', 'ajudacomunidadeong',
 'Vestuário', 'Média', '2025-07-15', 'Roupas de frio para meninas em situação de rua');

INSERT INTO realocacoes_produto (
    id_produto, nome_ong_origem, email_ong_origem, whatsapp_ong_origem, instagram_ong_origem, observacoes
) VALUES
(1, 'Mãos Solidárias', 'contato@maossolidarias.org', '+5581991111111', '@maossolidarias', 'Realocados 50 enlatados para atender outra ONG'),
(2, 'Ajuda Comunidade', 'contato@maossolidarias.org', '+5581991111111', '@maossolidarias', 'Enviadas 20 jaquetas para famílias da ONG Mãos Solidárias');
