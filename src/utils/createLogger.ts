import pino from 'pino';
import { getConfig } from '../config.ts';

const { isTTY } = process.stdout;

let cachedLogger: pino.Logger | undefined;
let cachedLogLevel: pino.LevelWithSilent | undefined;

export const getLogger = (levelOverride?: pino.LevelWithSilent): pino.Logger => {
    const config = getConfig();
    const logLevel = levelOverride ?? config.log.level;

    if (!cachedLogger || cachedLogLevel !== logLevel) {
        cachedLogger = pino({
            level: logLevel,
            transport: isTTY
                ? {
                      target: 'pino-pretty',
                      options: {
                          colorize: true,
                      },
                  }
                : undefined,
        });
        cachedLogLevel = logLevel;
    }
    return cachedLogger;
};

export const createLogger = (levelOverride?: pino.LevelWithSilent): pino.Logger => getLogger(levelOverride);
