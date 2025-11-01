# Dev Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm i && npm run build
EXPOSE 8001
CMD ["node","dist/index.js"]
