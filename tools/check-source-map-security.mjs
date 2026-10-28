// CVE-2026-93749 regression for the resolved build dependency, not product input.
// Keep this ESM tool independent of the upstream incomplete indexed-map .d.ts;
// no unsafe TypeScript cast or test-assertion weakening is necessary.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { SourceMapConsumer, SourceMapGenerator } = require('source-map-js');
const flatMap = { version: 3, sources: ['synthetic.js'], names: [], mappings: 'AAAA' };
const indexed = (line, column = 0, map = flatMap) => ({
  version: 3,
  sections: [{ offset: { line, column }, map }],
});

// Constructor-only probes avoid generating huge mappings, even if a vulnerable
// dependency is accidentally reintroduced. The old version fails these asserts
// promptly; the test never materializes the denial-of-service payload.
for (const map of [
  indexed(1e12),
  indexed(-1),
  indexed(0.5),
  indexed(Infinity),
  indexed(0, NaN),
  indexed(6e6, 0, indexed(6e6)),
]) {
  assert.throws(() => new SourceMapConsumer(map), /offset/i);
}

const consumer = new SourceMapConsumer(indexed(2));
const mappings = [];
const generator = new SourceMapGenerator({ file: 'synthetic-out.js' });
consumer.eachMapping((mapping) => {
  mappings.push(mapping);
  generator.addMapping({
    source: mapping.source,
    generated: { line: mapping.generatedLine, column: mapping.generatedColumn },
    original: { line: mapping.originalLine, column: mapping.originalColumn },
  });
});
assert.deepEqual(mappings, [{
  source: 'synthetic.js', generatedLine: 3, generatedColumn: 0,
  originalLine: 1, originalColumn: 0, name: null,
}]);
assert.deepEqual(generator.toJSON(), {
  version: 3, sources: ['synthetic.js'], names: [], mappings: ';;AAAA',
  file: 'synthetic-out.js',
});
console.log('PASS: source-map indexed offsets reject invalid/oversized/nested totals and retain valid mapping');
