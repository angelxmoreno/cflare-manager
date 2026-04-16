import z from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;

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

const requireValue = (value: string | undefined, key: string, flagName: string) => {
    if (!value) {
        throw new Error(`Missing required ${key}. Provide ${flagName}, set it in config.json, or export ${key}.`);
    }
    return value;
};

export const resolveRuntimeConfig = async (options: RuntimeOptions): Promise<RuntimeConfig> => {
    const env = getConfig();
    const hasExplicitConfig = Boolean(options.config);
    const fileConfig = await readConfigFile(options.config ?? 'config.json', hasExplicitConfig);

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
