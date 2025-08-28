FROM node:18

WORKDIR /app

COPY package*.json ./
# Em produção, se você precisa rodar "prisma migrate" na inicialização,
# mantenha o pacote "prisma" instalado (não use --omit=dev aqui).
RUN npm ci

COPY . .

# Gera Prisma Client
RUN npx prisma generate

EXPOSE 3004

# Configurar variáveis de ambiente para DNS
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# Roda migrations e inicia
CMD sh -c "npx prisma migrate deploy && npm start"
