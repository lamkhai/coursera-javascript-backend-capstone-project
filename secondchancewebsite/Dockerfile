# Use Node.js LTS version (recommended: Node 18 or 20)
FROM node:20-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 9000

# Run the application
CMD ["node", "index.js"]
