FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production --fetch-timeout=600000 --fetch-retries=5

# Copy application source code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 8000

ENV PORT=8000
ENV NODE_ENV=production

CMD ["npm", "start"]

