FROM node:16
WORKDIR /usr/src/app
COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY src ./src
COPY tsconfig.json ./
COPY .babelrc ./

RUN npm run build

EXPOSE 43594
CMD [ "npm", "run", "start:standalone" ]
