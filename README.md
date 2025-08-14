# Backend - Plataforma de Gestão para ONGs

[![Status da Build](https://github.com/Pedrocavalcantip/projeto-prefeitura-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/Pedrocavalcantip/projeto-prefeitura-backend/actions/workflows/ci.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

API RESTful para gerenciar doações, realocações e autenticação de ONGs, construída com Node.js, Express e Prisma para a plataforma de gestão da prefeitura.

## 📖 Sumário

- [Visão Geral](#-visão-geral)
- [✨ Funcionalidades](#-funcionalidades)
- [🛠️ Arquitetura e Tecnologias](#️-arquitetura-e-tecnologias)
- [🚀 Guia para Desenvolvedores (Ambiente Local)](#-guia-para-desenvolvedores-ambiente-local)
  - [Pré-requisitos](#pré-requisitos)
  - [Configuração do Ambiente](#configuração-do-ambiente)
  - [Executando a Aplicação](#executando-a-aplicação)
- [� Deployment (Ambiente de Produção)](#-deployment-ambiente-de-produção)
- [�📚 Documentação da API](#-documentação-da-api)
- [🧪 Testes](#-testes)
- [🏗️ CI/CD](#️-cicd)
- [⚖️ Decisões de Arquitetura (ADRs)](#️-decisões-de-arquitetura-adrs)
- [📄 Licença](#-licença)

## 🎯 Visão Geral

Este projeto é o backend para a plataforma de gestão de ONGs. A API fornece endpoints seguros e bem definidos para autenticação, gerenciamento de itens, upload de imagens e automação de tarefas.

A autenticação é federada: as ONGs se autenticam em um serviço externo (simulando uma API da prefeitura), e nossa API sincroniza os dados e emite um token **JWT** para controlar o acesso.

## ✨ Funcionalidades

- **Autenticação Federada**: Login seguro via API externa com geração de token JWT.
- **CRUD de Doações e Realocações**: Gerenciamento completo do ciclo de vida dos produtos.
- **Upload de Imagens**: Suporte para upload de imagens com armazenamento em nuvem (Cloudinary).
- **Busca e Filtragem Avançada**: Endpoints para listar itens com múltiplos filtros.
- **Tarefas Agendadas (Cron Jobs)**: Automação para manutenção de status de produtos.
- **Documentação Interativa**: API documentada com Swagger (OpenAPI).

## 🛠️ Arquitetura e Tecnologias

| Categoria             | Tecnologia                                                              |
| --------------------- | ----------------------------------------------------------------------- |
| **Plataforma**        | Node.js                                                                 |
| **Framework Web**     | Express.js                                                              |
| **Banco de Dados**    | PostgreSQL                                                              |
| **ORM**               | Prisma                                                                  |
| **Autenticação**      | JSON Web Tokens (JWT)                                                   |
| **Testes**            | Jest & Supertest                                                        |
| **Upload de Arquivos**| Multer, Cloudinary                                                      |
| **Documentação API**  | Swagger (swagger-jsdoc, swagger-ui-express)                             |
| **CI/CD**             | GitHub Actions                                                          |
| **Containerização**   | Docker, Docker Compose                                                  |

## 🚀 Guia para Desenvolvedores (Ambiente Local)

Esta seção descreve como configurar e executar o projeto para fins de desenvolvimento e teste.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [NPM](https://www.npmjs.com/) (já vem com o Node.js)
- [Docker](https://www.docker.com/) (Recomendado para rodar o banco de dados facilmente)

### Configuração do Ambiente

1.  **Clone o repositório e instale as dependências:**
    ```bash
    git clone https://github.com/Pedrocavalcantip/projeto-prefeitura-backend.git
    cd projeto-prefeitura-backend
    npm install
    ```

2.  **Configure as Variáveis de Ambiente (Apenas para Desenvolvimento Local):**
    Crie um arquivo chamado `.env` na raiz do projeto. Este arquivo guarda segredos e configurações que **não devem ser compartilhados ou enviados para o Git**. Ele é usado apenas para fazer a aplicação funcionar na sua máquina.

3.  **Inicie o Banco de Dados com Docker (Recomendado):**
    Se você tem o Docker instalado, o comando abaixo irá criar e iniciar um banco de dados PostgreSQL pronto para uso:
    ```bash
    docker-compose up -d db 
    ```
    *Caso não use Docker, garanta que você tenha um servidor PostgreSQL rodando e que a `DATABASE_URL` no seu `.env` aponte para ele.*

4.  **Aplique a estrutura do Banco de Dados (Migrations):**
    Este comando usa o Prisma para criar todas as tabelas necessárias no banco de dados:
    ```bash
    npx prisma migrate dev
    ```

### Executando a Aplicação

- **Para desenvolver (com reinicio automático ao salvar):**
  ```bash
  npm run dev
  ```

- **Para rodar a versão de produção localmente:**
  ```bash
  npm start
  ```

A aplicação estará disponível em `http://localhost:3000`.

## 🚢 Deployment (Ambiente de Produção)

Para implantar esta aplicação em um servidor de produção (como o da prefeitura), o processo é diferente:

1.  **Variáveis de Ambiente:** As variáveis listadas no arquivo `.env` (como `DATABASE_URL`, `JWT_SECRET`, etc.) devem ser configuradas diretamente no ambiente do servidor (ex: painel de controle da hospedagem, segredos do Docker/Kubernetes). **O arquivo `.env` não deve ser usado em produção.**

2.  **Build e Execução:** O comando para iniciar a aplicação em modo de produção é:
    ```bash
    npm start
    ```

3.  **Containerização:** A forma mais recomendada de implantar é usando a imagem Docker definida no `Dockerfile` e orquestrando com o `docker-compose.yml`. Isso garante um ambiente consistente e isolado.

## 📚 Documentação da API

A documentação completa e interativa da API (Swagger) é gerada automaticamente. Com a aplicação rodando, acesse:

**`http://localhost:3000/api-docs`**

## 🧪 Testes

- **Rodar todos os testes:**
  ```bash
  npm test
  ```

- **Gerar relatório de cobertura de testes:**
  ```bash
  npm test -- --coverage
  ```

## 🏗️ CI/CD

Utilizamos **GitHub Actions** para automação de integração contínua. O workflow em `.github/workflows/ci.yml` executa os testes automaticamente a cada `push` ou `pull request`, garantindo a integridade do código.

## ⚖️ Decisões de Arquitetura (ADRs)

As decisões técnicas mais importantes estão documentadas na pasta `/ADRs` para registrar o contexto e as razões por trás das escolhas de arquitetura.

## 📄 Licença

Este projeto está licenciado sob a Licença ISC.
