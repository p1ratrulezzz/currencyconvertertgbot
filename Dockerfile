FROM node:16.18-alpine

RUN apk add bash  \
    && addgroup -S app \
    && adduser -S app -G app -h /app

COPY --chown=app . /app/

WORKDIR /app

RUN npm i