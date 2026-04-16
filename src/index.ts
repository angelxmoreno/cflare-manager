#!/usr/bin/env bun
import { Command } from 'commander';
import { ingressAddCmd } from './commands/ingressAdd.ts';
import { ingressListCmd } from './commands/ingressList.ts';
import { tunnelListCmd } from './commands/tunnelList.ts';

const program = new Command();

program.name('cfm').description('cf-manager - A CLI tool to manage Cloudflare resources').version('1.0.0');

program.addCommand(ingressAddCmd);
program.addCommand(ingressListCmd);
program.addCommand(tunnelListCmd);

// If no arguments provided, show help and exit gracefully
if (process.argv.length <= 2) {
    program.help();
}

program.parse(process.argv);
