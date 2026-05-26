FROM node:20-slim

# Install system dependencies: ffmpeg + yt-dlp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
       -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend deps
COPY package.json ./
RUN npm install --production

# Install and build frontend
COPY frontend/package.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copy backend source
COPY server.js ./

# Persist downloads across restarts (Railway volume mount point)
RUN mkdir -p /app/downloads

EXPOSE 3000

CMD ["node", "server.js"]
