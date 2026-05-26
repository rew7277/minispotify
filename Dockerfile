FROM node:20-slim

# Install system deps: ffmpeg, python3, curl, deno (JS runtime for yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    unzip \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
       -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && curl -fsSL https://deno.land/install.sh | sh \
    && ln -s /root/.deno/bin/deno /usr/local/bin/deno \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend deps
COPY package.json ./
RUN npm install --production

# Frontend build
COPY frontend/package.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Backend source
COPY server.js ./

# Ensure downloads dir exists (Railway volume mounts here)
RUN mkdir -p /app/downloads

EXPOSE 3000
CMD ["node", "server.js"]
