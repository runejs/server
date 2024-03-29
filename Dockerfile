FROM node:20
WORKDIR /usr/src/app
COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY src ./src
COPY tsconfig.json ./
COPY .swcrc ./

RUN npm run build

EXPOSE 43594
CMD [ "npm", "run", "start:standalone" ]
