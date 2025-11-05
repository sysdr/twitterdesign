FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY shared ./shared

RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source
COPY backend ./backend
COPY frontend ./frontend

# Build
RUN cd backend && npm run build
RUN cd frontend && npm run build

# Expose ports
EXPOSE 3000 3001

# Start services
CMD ["sh", "-c", "cd backend && npm start & cd frontend && npm run preview"]
