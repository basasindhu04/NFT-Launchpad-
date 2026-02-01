FROM node:18-alpine AS base

WORKDIR /app

# --- Hardhat / Contracts Layer ---
FROM base AS contracts
# Copy root package.json for hardhat dependencies
COPY package*.json ./
RUN npm install
# Copy the rest of the project
COPY . .
# Base command (overridden by docker-compose)
CMD ["npx", "hardhat", "node"]

# --- Frontend Layer ---
FROM base AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
CMD ["npm", "run", "dev"]
