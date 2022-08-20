FROM node:14.4-alpine3.11

WORKDIR /app

COPY ./src /app/src
COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json
COPY ./tsconfig.json /app/tsconfig.json

RUN npm i typescript -g
RUN npm ci --production

RUN npm run build
RUN npm uni typescript -g

COPY ./src/public /app/build/public

# Remove unused files
RUN rm -rf /app/src

CMD ["npm", "run", "start:prod"]
