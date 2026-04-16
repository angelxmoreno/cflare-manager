import pino from 'pino';
import { getConfig } from '../config.ts';

const { isTTY } = process.stdout;

let cachedLogger: pino.Logger | undefined;

export const getLogger = (): pino.Logger => {
    if (!cachedLogger) {
        const config = getConfig();
        cachedLogger = pino({
            level: config.log.level,
            transport: isTTY
                ? {
                      target: 'pino-pretty',
                      options: {
                          colorize: true,
                      },
                  }
                : undefined,
        });
    }
    return cachedLogger;
};

export const createLogger = (): pino.Logger => getLogger();
