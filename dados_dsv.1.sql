-- Configurações iniciais do banco
SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET default_tablespace = '';
SET default_with_oids = false;

-- Remove tabelas se já existirem
DROP TABLE IF EXISTS realocacoes_produto;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS voluntarios;

-- Tabela de voluntários que recebem alertas de doação
CREATE TABLE voluntarios (
    id_beneficiario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    whatsapp VARCHAR(20) NOT NULL,
    receber_alertas BOOLEAN NOT NULL DEFAULT TRUE);

-- Tabela de produtos cadastrados pelas ONGs
CREATE TABLE produtos (
    id_produto SERIAL PRIMARY KEY,
    nome_ong VARCHAR(100) NOT NULL,
    email_ong VARCHAR(255) NOT NULL,
    whatsapp_ong VARCHAR(20) NOT NULL,
    instagram_ong VARCHAR(50),   
    urgencia VARCHAR(20) NOT NULL CHECK (urgencia IN ('Baixa', 'Média', 'Alta')),
	tipo_item VARCHAR(20) NOT NULL,
    prazo_necessidade DATE NOT NULL,
    descricao TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

-- Tabela para registrar realocação de itens entre ONGs
CREATE TABLE realocacoes_produto (
    id_realocacao SERIAL PRIMARY KEY,
    id_produto INTEGER NOT NULL REFERENCES produtos(id_produto),
    nome_ong_origem VARCHAR(100) NOT NULL,
	email_ong_origem VARCHAR(255) NOT NULL,
    whatsapp_ong_origem VARCHAR(20) NOT NULL,
    instagram_ong_origem VARCHAR(50),   
    data_post TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT);

-- Inserção de dados de exemplo
INSERT INTO voluntarios (nome, email, whatsapp, receber_alertas) VALUES
('João Silva', 'joao.silva@exemplo.com', '+5581999999999', TRUE),
('Maria Souza', 'maria.souza@exemplo.com', '+5581888888888', TRUE);

INSERT INTO produtos (
    nome_ong, email_ong, whatsapp_ong, instagram_ong, tipo_item,urgencia, prazo_necessidade, descricao
) VALUES
('Mãos Solidárias', 'contato@maossolidarias.org', '+5581991111111', '@maossolidarias',
 'Alimento','Alta', '2025-06-30', 'Precisamos de enlatados para montar cestas básicas para 100 famílias'),

('Ajuda Comunidade', 'contato@ajudacomunidade.org', '+5581992222222', '@ajudacomunidade',
 'Vestuário','Média', '2025-07-15', 'Roupas de frio para meninas em situação de rua');

INSERT INTO realocacoes_produto (
    id_produto, nome_ong_origem, email_ong_origem, whatsapp_ong_origem, instagram_ong_origem, observacoes
) VALUES
(1, 'Mãos Solidárias', 'contato@maossolidarias.org', '+5581991111111', '@maossolidarias', 'Realocados 50 enlatados para atender outra ONG'),
(2, 'Ajuda Comunidade', 'contato@maossolidarias.org', '+5581991111111', '@maossolidarias', 'Enviadas 20 jaquetas para famílias da ONG Mãos Solidárias');
