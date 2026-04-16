import Table from 'cli-table3';
import { Command } from 'commander';
import { type RuntimeOptions, resolveRuntimeConfig } from '../config.ts';
import { CloudflareService } from '../service/CloudflareService.ts';
import { getLogger } from '../utils/createLogger.ts';

export const tunnelListCmd = new Command('tunnel:list')
    .description('List Cloudflare tunnels')
    .option('--config <path>', 'Path to JSON config file (defaults to ./config.json when present)')
    .option('--api-token <token>', 'Cloudflare API token override')
    .option('--account-id <id>', 'Cloudflare account ID override')
    .action(async (options: RuntimeOptions) => {
        const runtimeConfig = await resolveRuntimeConfig(options);
        const logger = getLogger(runtimeConfig.log.level);
        const cloudflareService = new CloudflareService(runtimeConfig);
        const list = await cloudflareService.listTunnels();

        if (!list.length) {
            logger.info('No tunnels found.');
            return;
        }

        const table = new Table({
            head: ['Tunnel ID', 'Name', 'Status', 'Type', 'Created At'],
        });

        for (const tunnel of list) {
            table.push([
                tunnel.id ?? '-',
                tunnel.name ?? '-',
                tunnel.status ?? '-',
                tunnel.tun_type ?? '-',
                tunnel.created_at ?? '-',
            ]);
        }

        console.log(table.toString());
    });
