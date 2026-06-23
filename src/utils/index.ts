/**
 * Utility modules for PrepMate AI
 */

export {
  saveSessionState,
  loadSessionState,
  clearSessionState,
  queueResponse,
  getQueuedResponses,
  removeQueuedResponse,
  clearQueuedResponses,
} from './sessionPersistence';
export type { SessionState, QueuedResponse } from './sessionPersistence';

export { useNetworkStatus, useNetworkRecovery } from './networkMonitor';
export type { NetworkStatus, NetworkRecoveryOptions } from './networkMonitor';

export { useSessionInterruption } from './useSessionInterruption';
export type {
  SessionInterruptionOptions,
  SessionInterruptionResult,
} from './useSessionInterruption';
