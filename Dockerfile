FROM node:14
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

EXPOSE 43594
CMD [ "npm", "start" ]
