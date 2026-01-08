From node:22-alpine

WORKDIR /MMP_Backend

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install
RUN npm install -g typescript

COPY . .
RUN tsc -b

EXPOSE 3000

CMD ["node", "dist/index.js"]
