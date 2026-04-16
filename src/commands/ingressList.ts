import Table from 'cli-table3';
import { Command } from 'commander';
import { type RuntimeOptions, resolveRuntimeConfig } from '../config.ts';
import { CloudflareService } from '../service/CloudflareService.ts';
import { getLogger } from '../utils/createLogger.ts';

export const ingressListCmd = new Command('ingress:list')
    .description('List tunnel ingress routes')
    .option(
        '--config <path>',
        'Path to JSON config file (default chain: ./cfm.config.json, executable dir, ~/.cfm/config.json)'
    )
    .option('--api-token <token>', 'Cloudflare API token override')
    .option('--account-id <id>', 'Cloudflare account ID override')
    .option('--tunnel-id <tunnelId>', 'Filter ingress routes by tunnel UUID')
    .action(async (options: RuntimeOptions) => {
        const runtimeConfig = await resolveRuntimeConfig(options);
        const logger = getLogger(runtimeConfig.log.level);
        const cloudflareService = new CloudflareService(runtimeConfig);
        const routes = await cloudflareService.listTunnelIngressRoutes(
            options.tunnelId ?? runtimeConfig.cloudflare.tunnelId
        );

        if (!routes.length) {
            logger.info('No routes found.');
            return;
        }

        const table = new Table({
            head: ['Tunnel ID', 'Tunnel Name', 'Hostname', 'Service'],
        });

        for (const route of routes) {
            table.push([route.tunnelId, route.tunnelName, route.hostname, route.service]);
        }

        console.log(table.toString());
    });
