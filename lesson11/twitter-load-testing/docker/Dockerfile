FROM node:20-alpine

# Install bash
RUN apk add --no-cache bash

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Build both frontend and server
RUN npm run build
RUN npm run build:server

# Make the startup script executable
RUN chmod +x docker/start.sh

EXPOSE 3000 8000

CMD ["bash", "./docker/start.sh"]
