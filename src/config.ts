import z from 'zod';

const ConfigSchema = z
    .object({
        CF_API_TOKEN: z.string(),
    })
    .transform((data) => ({
        cloudflare: {
            apiToken: data.CF_API_TOKEN,
        },
    }));

export type Config = z.infer<typeof ConfigSchema>;

export const config = ConfigSchema.parse(Bun.env);
