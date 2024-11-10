FROM node:20.9.0-alpine

WORKDIR /CHATAPP

COPY package*.json ./
RUN npm install --save-dev ts-node typescript
RUN npm install
COPY . .

CMD ["npm","start"]