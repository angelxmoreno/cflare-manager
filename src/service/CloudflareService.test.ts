import { describe, expect, it } from 'bun:test';
import type Cloudflare from 'cloudflare';
import type { RuntimeConfig } from '../config.ts';
import { CloudflareService } from './CloudflareService.ts';

const runtimeConfig: RuntimeConfig = {
    cloudflare: {
        apiToken: 'token',
        accountId: 'account-id',
        tunnelId: 'default-tunnel-id',
        zoneId: 'zone-id',
    },
    log: {
        level: 'info',
    },
};

const makeAsyncIterable = <T>(items: T[]): AsyncIterable<T> => ({
    [Symbol.asyncIterator]: async function* () {
        for (const item of items) {
            yield item;
        }
    },
});

describe('CloudflareService pagination and aggregation', () => {
    it('listTunnels aggregates all items from async paginated list', async () => {
        const mockTunnels = [
            { id: 't1', name: 'one' },
            { id: 't2', name: 'two' },
            { id: 't3', name: 'three' },
        ];
        const list = () => makeAsyncIterable(mockTunnels);
        const mockClient = {
            zeroTrust: {
                tunnels: {
                    list,
                },
            },
        } as unknown as Cloudflare;
        const service = new CloudflareService(runtimeConfig, mockClient);

        const result = await service.listTunnels();
        expect(result).toHaveLength(3);
        expect(result.map((tunnel) => tunnel.id)).toEqual(['t1', 't2', 't3']);
    });

    it('listTunnelIngressRoutes includes ingress from all listed tunnels', async () => {
        const list = () =>
            makeAsyncIterable([
                { id: 't1', name: 'first' },
                { id: 't2', name: 'second' },
            ]);

        const get = async (tunnelId: string) => {
            if (tunnelId === 't1') {
                return {
                    config: {
                        ingress: [
                            { hostname: 'a.example.com', service: 'http://localhost:3000' },
                            { service: 'http_status:404' },
                        ],
                    },
                };
            }
            return {
                config: {
                    ingress: [{ hostname: 'b.example.com', service: 'http://localhost:3001' }],
                },
            };
        };
        const mockClient = {
            zeroTrust: {
                tunnels: {
                    list,
                    cloudflared: {
                        configurations: {
                            get,
                        },
                    },
                },
            },
        } as unknown as Cloudflare;
        const service = new CloudflareService(runtimeConfig, mockClient);

        const routes = await service.listTunnelIngressRoutes();
        expect(routes).toHaveLength(3);
        expect(routes.map((route) => route.tunnelId)).toEqual(['t1', 't1', 't2']);
        expect(routes.map((route) => route.hostname)).toEqual(['a.example.com', '*', 'b.example.com']);
    });
});
