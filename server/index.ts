import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInitialLocalActorCredentials, parseLocalActorCredentialsFile, serializeLocalActorCredentialsFile } from './auth/local-credentials.js';
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

/**
 * Creates one private token per fixed local workflow identity on first launch.
 * The file is intentionally never printed, served, or committed. Possession of
 * an individual token fixes the actor, tenant, and role for the session.
 */
function localActorCredentials(dataDirectory: string) {
  const credentialPath = resolve(dataDirectory, '.psyforge-local-actors.json');
  if (existsSync(credentialPath)) {
    return parseLocalActorCredentialsFile(readFileSync(credentialPath, 'utf8'));
  }
  const credentials = createInitialLocalActorCredentials(() => randomBytes(32).toString('hex'));
  writeFileSync(credentialPath, serializeLocalActorCredentialsFile(credentials), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  return credentials;
}

const dataDirectory = resolve(process.env.PSYFORGE_DATA_DIR ?? './data');
const repository = new PsyForgeRepository(resolve(dataDirectory, 'psyforge.sqlite'));
const server = createPsyForgeHttpServer({ service: new PsyForgeService(repository), actorCredentials: localActorCredentials(dataDirectory), staticDirectory: resolve('./dist') });
const port = parsePort(process.env.PSYFORGE_PORT);

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`PsyForge local service listening on http://127.0.0.1:${port}\n`);
});

function stop(signal: string): void {
  server.close(() => {
    repository.close();
    process.stdout.write(`PsyForge local service stopped after ${signal}\n`);
  });
}

process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));