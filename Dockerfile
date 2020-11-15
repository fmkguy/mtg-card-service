FROM node:15.0-stretch

EXPOSE 3000

WORKDIR /usr/src/app

COPY package*.json yarn.lock* ./

RUN npm update
RUN npm install && npm cache clean --force

COPY . .

CMD ["node", "src/index.js"]