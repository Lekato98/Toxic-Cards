import * as dotenv from 'dotenv';
import * as path from 'path';
import * as os from 'os';

dotenv.config({path: path.join(__dirname, '.env')});

const ip4 = os.networkInterfaces()['Loopback Pseudo-Interface 1']?.[1]?.address ?? 'toxic-cards.fun';

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
    IO_PORT: process.env.IO_PORT,
    IP4: String(ip4),
};
