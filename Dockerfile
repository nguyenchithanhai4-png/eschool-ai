# ============================================
# E-School AI - Multi-stage Dockerfile
# Node.js + Python (for OMR YOLO)
# ============================================

FROM node:18-slim

# Install Python and required system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy Python requirements and install
COPY ChamThiTuDong/requirements.txt ./ChamThiTuDong/
RUN pip3 install --no-cache-dir -r ChamThiTuDong/requirements.txt --break-system-packages

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHONIOENCODING=utf-8

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
