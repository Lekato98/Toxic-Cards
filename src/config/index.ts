import * as dotenv from 'dotenv';
dotenv.config();

export const ioConfig = {
    cors: {
        origin: '*',
        method: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 200,
    },
};

export const config = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
};
