FROM node:20-alpine

WORKDIR /app

# Install system dependencies for image processing
RUN apk add --no-cache \
    ffmpeg \
    imagemagick \
    vips-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create upload directories
RUN mkdir -p uploads thumbnails

EXPOSE 5000

CMD ["npm", "run", "dev"]
