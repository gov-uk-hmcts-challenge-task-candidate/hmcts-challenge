# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY prisma ./prisma
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build TypeScript
RUN npm run build

# Expose port (matches server.ts)
EXPOSE 3000

# Run database migrations on container start (optional, for dev/test)
# Uncomment if you want migrations to run automatically:
# RUN npm run setup

# Start the app
CMD ["npm", "run", "start"]