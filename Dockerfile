FROM node:14-alpine
RUN apk add --no-cache python3 g++ make
WORKDIR /DealsBot_NodeJS
COPY . .