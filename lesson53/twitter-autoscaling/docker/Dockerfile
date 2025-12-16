FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000 4000

CMD ["sh", "-c", "npm run start:metrics & npm run start:predictor & npm run start:scaler & npm run dev"]
