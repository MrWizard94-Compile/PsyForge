import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EvidenceRegistryView from './EvidenceRegistryView';

const TOKEN = 'a'.repeat(64);
const actor = { id: 'local-operator', role: 'operator', tenantId: 'studio-alpha' };

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('EvidenceRegistryView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses only the configured actor token and clears transient source text after successful registration', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ actor }, 201))
      .mockResolvedValueOnce(response({ sources: [] }))
      .mockResolvedValueOnce(response({ source: { sourceId: '00000000-0000-4000-8000-000000000001', sourceKey: 'synthetic-source-001', version: 'v1', title: 'Synthetic local evidence source', stableCitation: 'internal:synthetic-source-001:v1', publisher: 'Local PsyForge operator', publishedAt: '2026-08-21T00:00:00.000Z', domain: 'synthetic_test', licenseBasis: 'synthetic', rightsReference: 'Synthetic test data created for P5 evidence-registry verification.', contentSha256: 'a'.repeat(64), contentBytes: 24, status: 'pending_review', registeredAt: '2026-08-21T12:00:00.000Z' } }, 201));
    vi.stubGlobal('fetch', fetchMock);
    render(<EvidenceRegistryView />);

    fireEvent.change(screen.getByLabelText('Evidence actor token'), { target: { value: TOKEN } });
    fireEvent.click(screen.getByRole('button', { name: 'Create local session' }));
    await screen.findByText('Register local source for human review');

    const sourceText = screen.getByLabelText('Local source text (maximum 48 KiB; hashed, never stored)');
    fireEvent.change(sourceText, { target: { value: 'A transient local source body.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register pending source' }));

    await waitFor(() => expect(sourceText).toHaveValue(''));
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ headers: { 'x-psyforge-api-token': TOKEN } });
    expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toHaveProperty('x-psyforge-role');
  });
});