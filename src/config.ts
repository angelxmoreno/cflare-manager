import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import z from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
const DEFAULT_CONFIG_FILE = 'cfm.config.json';

const EnvConfigSchema = z
    .object({
        CF_API_TOKEN: z.string().optional(),
        CF_ZONE_ID: z.string().optional(),
        CF_ACCOUNT_ID: z.string().optional(),
        CF_TUNNEL_ID: z.string().optional(),
        LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
    })
    .transform((data) => ({
        cloudflare: {
            apiToken: data.CF_API_TOKEN,
            zoneId: data.CF_ZONE_ID,
            accountId: data.CF_ACCOUNT_ID,
            tunnelId: data.CF_TUNNEL_ID,
        },
        log: {
            level: data.LOG_LEVEL,
        },
    }));

const FileConfigSchema = z
    .object({
        apiToken: z.string().optional(),
        accountId: z.string().optional(),
        zoneId: z.string().optional(),
        tunnelId: z.string().optional(),
        logLevel: z.enum(LOG_LEVELS).optional(),
        cloudflare: z
            .object({
                apiToken: z.string().optional(),
                accountId: z.string().optional(),
                zoneId: z.string().optional(),
                tunnelId: z.string().optional(),
            })
            .optional(),
        log: z
            .object({
                level: z.enum(LOG_LEVELS).optional(),
            })
            .optional(),
    })
    .transform((data) => ({
        cloudflare: {
            apiToken: data.apiToken ?? data.cloudflare?.apiToken,
            accountId: data.accountId ?? data.cloudflare?.accountId,
            zoneId: data.zoneId ?? data.cloudflare?.zoneId,
            tunnelId: data.tunnelId ?? data.cloudflare?.tunnelId,
        },
        log: {
            level: data.logLevel ?? data.log?.level,
        },
    }));
type FileConfig = z.infer<typeof FileConfigSchema>;

export type Config = z.infer<typeof EnvConfigSchema>;
export type RuntimeOptions = {
    config?: string;
    apiToken?: string;
    accountId?: string;
    zoneId?: string;
    tunnelId?: string;
};

export type RuntimeConfig = {
    cloudflare: {
        apiToken: string;
        accountId: string;
        zoneId?: string;
        tunnelId?: string;
    };
    log: {
        level: (typeof LOG_LEVELS)[number];
    };
};

let cachedConfig: Config | undefined;

export const getConfig = (): Config => {
    if (!cachedConfig) {
        cachedConfig = EnvConfigSchema.parse(Bun.env);
    }
    return cachedConfig;
};

const readConfigFile = async (configPath: string, required: boolean) => {
    const file = Bun.file(configPath);
    if (!(await file.exists())) {
        if (required) {
            throw new Error(`Config file not found: ${configPath}`);
        }
        return undefined;
    }

    const raw = await file.json();
    return FileConfigSchema.parse(raw);
};

const mergeFileConfig = (base: FileConfig | undefined, incoming: FileConfig | undefined): FileConfig | undefined => {
    if (!base) {
        return incoming;
    }
    if (!incoming) {
        return base;
    }

    return {
        cloudflare: {
            apiToken: incoming.cloudflare.apiToken ?? base.cloudflare.apiToken,
            accountId: incoming.cloudflare.accountId ?? base.cloudflare.accountId,
            zoneId: incoming.cloudflare.zoneId ?? base.cloudflare.zoneId,
            tunnelId: incoming.cloudflare.tunnelId ?? base.cloudflare.tunnelId,
        },
        log: {
            level: incoming.log.level ?? base.log.level,
        },
    };
};

const getExecutableDir = () => {
    const executablePath = process.argv[1];
    if (!executablePath) {
        return undefined;
    }

    try {
        return dirname(realpathSync(executablePath));
    } catch {
        return dirname(resolve(executablePath));
    }
};

const getDefaultConfigCandidates = () => {
    const candidates = [resolve(process.cwd(), DEFAULT_CONFIG_FILE)];

    const executableDir = getExecutableDir();
    if (executableDir) {
        candidates.push(resolve(executableDir, DEFAULT_CONFIG_FILE));
    }

    const homeDir = Bun.env.HOME;
    if (homeDir) {
        candidates.push(join(homeDir, '.cfm', 'config.json'));
    }

    return candidates;
};

const requireValue = (value: string | undefined, key: string, flagName: string) => {
    if (!value) {
        throw new Error(
            `Missing required ${key}. Provide ${flagName}, set it in ${DEFAULT_CONFIG_FILE} or ~/.cfm/config.json, or export ${key}.`
        );
    }
    return value;
};

export const resolveRuntimeConfig = async (options: RuntimeOptions): Promise<RuntimeConfig> => {
    const env = getConfig();
    let fileConfig: FileConfig | undefined;

    if (options.config) {
        fileConfig = await readConfigFile(options.config, true);
    } else {
        for (const candidate of getDefaultConfigCandidates()) {
            const candidateConfig = await readConfigFile(candidate, false);
            fileConfig = mergeFileConfig(fileConfig, candidateConfig);
        }
    }

    const apiToken = options.apiToken ?? fileConfig?.cloudflare.apiToken ?? env.cloudflare.apiToken;
    const accountId = options.accountId ?? fileConfig?.cloudflare.accountId ?? env.cloudflare.accountId;
    const zoneId = options.zoneId ?? fileConfig?.cloudflare.zoneId ?? env.cloudflare.zoneId;
    const tunnelId = options.tunnelId ?? fileConfig?.cloudflare.tunnelId ?? env.cloudflare.tunnelId;

    return {
        cloudflare: {
            apiToken: requireValue(apiToken, 'CF_API_TOKEN', '--api-token'),
            accountId: requireValue(accountId, 'CF_ACCOUNT_ID', '--account-id'),
            zoneId,
            tunnelId,
        },
        log: {
            level: fileConfig?.log.level ?? env.log.level,
        },
    };
};
