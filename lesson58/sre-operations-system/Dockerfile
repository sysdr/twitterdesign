FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000 8080

CMD ["sh", "-c", "npm run dev & node src/server.ts"]
