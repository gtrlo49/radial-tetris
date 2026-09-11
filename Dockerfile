FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./server/

RUN cd server && npm install --production

COPY . .

RUN mkdir -p /data

ENV DB_PATH=/data/leaderboard.db
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/server.js"]
