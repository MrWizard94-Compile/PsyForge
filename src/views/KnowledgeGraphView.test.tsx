import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import KnowledgeGraphView from './KnowledgeGraphView';

describe('P6 Graph Inspector', () => {
  it('labels the graph surface as read-only and documents its no-inference boundary', () => {
    render(<KnowledgeGraphView />);
    expect(screen.getByRole('heading', { name: 'P6 Graph Inspector' })).toBeInTheDocument();
    expect(screen.getByText(/read-only view/i)).toBeInTheDocument();
    expect(screen.getByText(/does not retrieve source text, infer relationships/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open read-only session' })).toBeInTheDocument();
  });
});