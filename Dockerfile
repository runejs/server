FROM node:14
WORKDIR /app
COPY [ "package.json", "package-lock.json*", "./" ]
RUN npm install --production --silent && mv node_modules ../
COPY . .

EXPOSE 43594
RUN npm install -g concurrently
RUN npm start
