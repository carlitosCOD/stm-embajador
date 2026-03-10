FROM node:18

WORKDIR /app

# copiar dependencias del backend
COPY backend/package*.json ./

RUN npm install

# copiar código backend
COPY backend .

EXPOSE 5000

CMD ["node", "index.js"]