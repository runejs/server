FROM node:14
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run build
RUN npm install -g concurrently
COPY . .

EXPOSE 43594
CMD [ "concurrently", "npm run start:game-server", "npm run start:login-server", "npm run start:update-server" ]