FROM node:20-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN npm install -g npm@latest

WORKDIR /home/user/project

# Pre-install the exact dependencies used by generated sites
# This turns `npm install` into a ~1s cache hit instead of ~20s cold install
RUN echo '{"name":"generated-site","version":"0.1.0","private":true,"scripts":{"dev":"next dev","build":"next build","start":"next start","lint":"next lint"},"dependencies":{"react":"19.2.4","react-dom":"19.2.4","next":"16.2.0","class-variance-authority":"0.7.1","clsx":"2.1.1","tailwind-merge":"3.5.0","lucide-react":"0.577.0"},"devDependencies":{"tailwindcss":"4.2.2","@tailwindcss/postcss":"4.2.2","typescript":"5.8.3","@types/react":"^19","@types/react-dom":"^19","@types/node":"^20"}}' > package.json

RUN npm install

# Clean up package.json - will be overwritten by generated code
# but node_modules stays cached
RUN rm package.json package-lock.json

WORKDIR /home/user
