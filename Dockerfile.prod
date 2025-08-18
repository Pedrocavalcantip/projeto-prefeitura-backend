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

# Roda migrations e inicia
CMD sh -c "npx prisma migrate deploy && npm start"
