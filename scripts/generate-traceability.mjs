import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const documentationDirectory = join(repositoryRoot, 'docs');
const requirementPattern = /\bREQ-[A-Z]+-\d{3}\b/g;
const sourceFiles = [
  'PsyForge_VolumeI.md',
  'PsyForge_VolumeII.md',
  'PsyForge_VolumeIII.md',
  'PsyForge_VolumeIV.md',
  'PsyForge_VolumeV.md',
  'PsyForge_VolumeVI.md',
  'PsyForge_VolumeVII.md',
  'PsyForge_VolumeVIII.md',
  'PsyForge_VolumeIX.md',
  'PsyForge_VolumeX.md',
  'PsyForge_Appendices.md',
];
const requirements = new Set();
for (const sourceFile of sourceFiles) {
  const contents = await readFile(join(repositoryRoot, sourceFile), 'utf8');
  for (const requirementId of contents.matchAll(requirementPattern)) {
    requirements.add(requirementId[0]);
  }
}
const output = {
  schemaVersion: '1.0',
  purpose: 'Machine-readable traceability ledger. Normative requirement statuses remain planned until their complete owning increment is verified.',
  sourceDocuments: sourceFiles,
  requirements: [...requirements].sort((left, right) => left.localeCompare(right, 'en')).map((id) => ({ id, status: 'planned', evidence: [] })),
  verifiedIncrements: [
    {
      id: 'P0-P4-local-vertical-slice',
      status: 'verified',
      evidence: ['server/psyforge-service.test.ts', 'server/http-server.test.ts', 'server/auth/local-credentials.ts', 'server/auth/local-credentials.test.ts', 'server/domain/feature-definitions.ts', 'server/domain/feature-definitions.test.ts', 'server/recompute-features.ts', 'server/recompute-features.test.ts', 'server/domain/model-registry.ts', 'server/domain/model-registry.test.ts', 'docs/LOCAL-SERVICE.md', 'docs/FEATURE-ENGINE.md', 'docs/MODEL-REGISTRY.md', 'docs/DRIFT-AND-ROLLBACK.md', 'docs/MODEL-CARD-BASELINE-1.0.md', 'docs/EVALUATION-CARD-BASELINE-1.0.md']
    },
    {
      id: 'P5-evidence-registry-foundation',
      status: 'verified',
      evidence: ['server/evidence/local-source-import.ts', 'server/evidence/local-source-import.test.ts', 'server/import-evidence.ts', 'server/auth/local-credentials.ts', 'server/auth/local-credentials.test.ts', 'server/persistence/repository.ts', 'server/application/psyforge-service.ts', 'server/psyforge-service.test.ts', 'server/http-server.test.ts', 'src/views/EvidenceRegistryView.tsx', 'docs/foundations/ADR-008-EVIDENCE-REGISTRY.md', 'docs/EVIDENCE-REGISTRY.md', 'docs/LOCAL-ACTOR-CREDENTIALS.md']
    },
    {
      id: 'P6-synthetic-graph-kernel',
      status: 'verified',
      evidence: ['server/domain/graph.ts', 'server/graph-kernel.test.ts', 'server/graph/synthetic-graph-fixture.ts', 'server/graph/synthetic-graph-fixture.test.ts', 'server/graph/fixture-cli.ts', 'server/application/psyforge-service.ts', 'server/persistence/repository.ts', 'server/transport/http-server.ts', 'server/http-server.test.ts', 'src/hooks/useGraphInspector.ts', 'src/views/KnowledgeGraphView.tsx', 'src/views/KnowledgeGraphView.test.tsx', 'docs/foundations/ADR-009-SYNTHETIC-GRAPH-KERNEL.md', 'docs/NEXT-PHASE-PLAN.md']
    }
  ]
};
await mkdir(documentationDirectory, { recursive: true });
await writeFile(join(documentationDirectory, 'TRACEABILITY.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');