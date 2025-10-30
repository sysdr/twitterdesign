FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose ports
EXPOSE 3000 8080

# Create start script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'npm run start &' >> start.sh && \
    echo 'npm run dev' >> start.sh && \
    chmod +x start.sh

CMD ["./start.sh"]
