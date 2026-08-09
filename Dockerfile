FROM node:alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Install tsx for running TypeScript
RUN npm install -g tsx

EXPOSE 3000

CMD ["tsx", "server.ts"]
