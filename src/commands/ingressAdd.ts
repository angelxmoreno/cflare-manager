import { Command } from 'commander';
import { type RuntimeOptions, resolveRuntimeConfig } from '../config.ts';
import { CloudflareService } from '../service/CloudflareService.ts';
import { getLogger } from '../utils/createLogger.ts';

export const ingressAddCmd = new Command('ingress:add')
    .description('Add an ingress route (hostname -> service) to a Cloudflare tunnel')
    .argument('<hostname>', 'Public hostname, e.g. app.example.com')
    .argument('<service>', 'Origin service URL, e.g. http://localhost:3000')
    .option(
        '--config <path>',
        'Path to JSON config file (default chain: ./cfm.config.json, executable dir, ~/.cfm/config.json)'
    )
    .option('--api-token <token>', 'Cloudflare API token override')
    .option('--account-id <id>', 'Cloudflare account ID override')
    .option('--tunnel-id <tunnelId>', 'Tunnel UUID override')
    .action(async (hostname, service, options: RuntimeOptions) => {
        const runtimeConfig = await resolveRuntimeConfig(options);
        const logger = getLogger(runtimeConfig.log.level);
        const cloudflareService = new CloudflareService(runtimeConfig);
        const tunnelId = options.tunnelId ?? runtimeConfig.cloudflare.tunnelId;

        if (!tunnelId) {
            throw new Error(
                'Missing tunnel ID. Provide --tunnel-id, set tunnelId in cfm.config.json or ~/.cfm/config.json, or export CF_TUNNEL_ID.'
            );
        }

        logger.info({ tunnelId, hostname, service }, 'Adding ingress route to tunnel...');

        await cloudflareService.addTunnelIngressRoute(tunnelId, hostname, service);

        logger.info({ tunnelId, hostname, service }, 'Ingress route added successfully.');
    });
