# Development stage
FROM node:20-alpine as development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies - CHANGER CETTE LIGNE
RUN npm install

# Copy source code
COPY . .

# Expose development port
EXPOSE 4200

# Start development server
CMD ["npm", "run", "start:dev"]
