import Cloudflare from 'cloudflare';
import type { RuntimeConfig } from '../config.ts';

export class CloudflareService {
    protected config: RuntimeConfig;
    protected client: Cloudflare;

    constructor(config: RuntimeConfig) {
        this.config = config;
        this.client = new Cloudflare({ apiToken: config.cloudflare.apiToken });
    }

    public async listTunnels() {
        return this.client.zeroTrust.tunnels.list({
            account_id: this.config.cloudflare.accountId,
        });
    }

    public async listTunnelIngressRoutes(tunnelId?: string) {
        const tunnels = await this.listTunnels();
        const selectedTunnels = tunnelId ? tunnels.result.filter((tunnel) => tunnel.id === tunnelId) : tunnels.result;

        const routes: Array<{
            tunnelId: string;
            tunnelName: string;
            hostname: string;
            service: string;
        }> = [];

        for (const tunnel of selectedTunnels) {
            if (!tunnel.id) {
                continue;
            }

            const config = await this.client.zeroTrust.tunnels.cloudflared.configurations.get(tunnel.id, {
                account_id: this.config.cloudflare.accountId,
            });

            for (const ingress of config.config?.ingress ?? []) {
                routes.push({
                    tunnelId: tunnel.id,
                    tunnelName: tunnel.name ?? '-',
                    hostname: ingress.hostname ?? '*',
                    service: ingress.service ?? '-',
                });
            }
        }

        return routes;
    }

    public async addTunnelIngressRoute(tunnelId: string, hostname: string, service: string) {
        const current = await this.client.zeroTrust.tunnels.cloudflared.configurations.get(tunnelId, {
            account_id: this.config.cloudflare.accountId,
        });

        const currentIngress = current.config?.ingress ?? [];
        const duplicate = currentIngress.some((rule) => rule.hostname === hostname);
        if (duplicate) {
            throw new Error(`An ingress rule for hostname "${hostname}" already exists on this tunnel.`);
        }

        const newRule = { hostname, service };
        const firstCatchAllIndex = currentIngress.findIndex((rule) => !rule.hostname);
        const nextIngress =
            firstCatchAllIndex >= 0
                ? [...currentIngress.slice(0, firstCatchAllIndex), newRule, ...currentIngress.slice(firstCatchAllIndex)]
                : [...currentIngress, newRule];

        return this.client.zeroTrust.tunnels.cloudflared.configurations.update(tunnelId, {
            account_id: this.config.cloudflare.accountId,
            config: {
                ...(current.config ?? {}),
                ingress: nextIngress,
            },
        });
    }
}
