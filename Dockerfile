FROM node:16
WORKDIR /usr/src/app
COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY src ./src
COPY tsconfig.json ./

RUN npm build

EXPOSE 43594
CMD [ "npm", "start" ]
