import { defineCommand, runMain } from 'citty';
import { maskCommand } from './commands/mask';

const main = defineCommand({
  meta: {
    name: 'pii-mask',
    description: 'Mask PII in CSV, JSON, JSONL, and TXT files',
  },
  subCommands: {
    mask: maskCommand,
  },
});

runMain(main);
