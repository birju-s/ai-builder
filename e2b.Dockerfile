FROM node:20-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN npm install -g npm@latest

RUN mkdir -p /home/user/project
WORKDIR /home/user/project

# Pre-install the exact dependencies used by generated sites
# This turns `npm install` into a ~1s cache hit instead of ~20s cold install
COPY lib/templates/generated-site-package.json ./package.json

RUN npm install --no-audit --no-fund

# Clean up package.json - will be overwritten by generated code
# but node_modules stays cached in the generated-site working directory
RUN rm package.json package-lock.json
