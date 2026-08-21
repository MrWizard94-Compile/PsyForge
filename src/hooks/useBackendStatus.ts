type NodeStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'NOMINAL' | 'SYNCING';

interface BackendStatus {
  graphDb: NodeStatus;
  inferenceNode: NodeStatus;
}

export function useBackendStatus() {
  // The current frontend has no backend connection. Keep demo state stable so
  // it cannot be mistaken for observed production telemetry.
  return {
    graphDb: 'ONLINE',
    inferenceNode: 'NOMINAL',
  } satisfies BackendStatus;
}
