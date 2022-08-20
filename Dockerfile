FROM node:14.4-alpine3.11

WORKDIR /app
COPY ./ /app/

RUN npm i
RUN npm run build

COPY ./src/public /app/build/public
COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json

# Remove unused files
RUN rm -rf /app/src
RUN rm -rf /app/__test__
RUN rm -rf /app/node_modules

# Run after removing node_modules
RUN npm ci --production

CMD ["npm", "run", "start:prod"]
