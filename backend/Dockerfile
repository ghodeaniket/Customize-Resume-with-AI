FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm install

# Copy app source code
COPY . .

# Expose API port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
