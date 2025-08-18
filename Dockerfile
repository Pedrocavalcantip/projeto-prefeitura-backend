FROM node:18

WORKDIR /app

# instala deps a partir dos manifests (cache de build)
COPY package*.json ./
RUN npm install

# copia o restante do código
COPY . .

# gera cliente Prisma
RUN npx prisma generate

EXPOSE 3004

# modo dev (hot reload se você usar nodemon no "dev")
CMD ["npm", "run", "dev"]
