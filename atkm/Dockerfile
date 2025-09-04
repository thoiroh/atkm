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

# Variables utiles pour Docker + Angular CLI
ENV CHOKIDAR_USEPOLLING=1
ENV NG_CLI_ANALYTICS=0

# Lancer Angular en mode dev, détectable par Angular DevTools
CMD ["npx","ng","serve","--configuration","development","--host","0.0.0.0","--port","4200"]

# Start development server
# CMD ["npm", "run", "start:dev"]
