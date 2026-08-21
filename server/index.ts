import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PsyForgeService } from './application/psyforge-service.js';
import { PsyForgeRepository } from './persistence/repository.js';
import { createPsyForgeHttpServer } from './transport/http-server.js';

const DEFAULT_PORT = 4317;

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1024 || port > 65_535) {
    throw new Error('PSYFORGE_PORT must be an integer between 1024 and 65535.');
  }
  return port;
}

function localToken(dataDirectory: string): string {
  const provided = process.env.PSYFORGE_LOCAL_TOKEN;
  if (provided !== undefined) {
    if (!/^[a-f0-9]{64}$/i.test(provided)) {
      throw new Error('PSYFORGE_LOCAL_TOKEN must be a 64-character hexadecimal token.');
    }
    return provided;
  }
  const tokenPath = resolve(dataDirectory, '.psyforge-local-token');
  if (existsSync(tokenPath)) {
    const token = readFileSync(tokenPath, 'utf8').trim();
    if (/^[a-f0-9]{64}$/i.test(token)) {
      return token;
    }
    throw new Error(`The local token file at ${tokenPath} is invalid. Replace it with a 64-character hexadecimal token.`);
  }
  const token = randomBytes(32).toString('hex');
  writeFileSync(tokenPath, `${token}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  return token;
}

const dataDirectory = resolve(process.env.PSYFORGE_DATA_DIR ?? './data');
const repository = new PsyForgeRepository(resolve(dataDirectory, 'psyforge.sqlite'));
const server = createPsyForgeHttpServer({ service: new PsyForgeService(repository), localToken: localToken(dataDirectory), staticDirectory: resolve('./dist') });
const port = parsePort(process.env.PSYFORGE_PORT);

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`PsyForge local service listening on http://127.0.0.1:${port}\n`);
});

function stop(signal: string): void {
  server.close(() => {
    repository.close();
    process.stdout.write(`PsyForge local service stopped after ${signal}.\n`);
  });
}

process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
