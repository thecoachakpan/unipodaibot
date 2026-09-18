FROM node:20-alpine

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Set environment
ENV NODE_ENV=production

# Command to launch WhatsApp background worker
CMD ["node", "worker/bot.js"]
