import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the PsyForge brand', () => {
    render(<App />);
    expect(screen.getByText('PSYFORGE')).toBeInTheDocument();
  });

  it('renders the sidebar navigation', () => {
    render(<App />);
    expect(screen.getAllByText('System Overview')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Player Models')[0]).toBeInTheDocument();
  });

  it('labels the demonstration panels and exposes the local-review surface', () => {
    render(<App />);
    expect(screen.getByText(/Deterministic demo panels/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Local Review' }));
    expect(screen.getByText('Local Recommendation Review')).toBeInTheDocument();
  });

  it('navigates to the simulation demonstration and completes its local state cycle', () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Simulation Engine' }));
    expect(screen.getByText('Demonstration Scenario')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Run Simulation' }));
    expect(screen.getByText(/Simulating/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText(/The demonstration projects stress metrics/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });
});

afterEach(() => {
  vi.useRealTimers();
});
