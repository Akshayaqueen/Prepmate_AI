/**
 * Network Monitor — Track connectivity and handle offline scenarios
 *
 * Provides a React hook for real-time network status and a utility
 * to flush queued responses when connectivity returns.
 *
 * Validates: Requirements 1.5
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
  getQueuedResponses,
  removeQueuedResponse,
  QueuedResponse,
} from './sessionPersistence';

// ─── Hook: useNetworkStatus ──────────────────────────────────────────────────

export interface NetworkStatus {
  isConnected: boolean;
}

/**
 * React hook that provides real-time network connectivity status.
 * Subscribes to NetInfo events and updates when connectivity changes.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
    });

    // Fetch initial state
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { isConnected };
}

// ─── Hook: useNetworkRecovery ────────────────────────────────────────────────

export interface NetworkRecoveryOptions {
  /** Callback to send a queued response to the server */
  onSendResponse: (response: QueuedResponse) => Promise<boolean>;
  /** Called when all queued responses have been flushed */
  onQueueFlushed?: () => void;
}

/**
 * React hook that monitors network recovery and flushes queued responses.
 * When connectivity returns after being offline, it processes any queued
 * responses in order.
 */
export function useNetworkRecovery(options: NetworkRecoveryOptions): {
  isFlushing: boolean;
  queueLength: number;
} {
  const { onSendResponse, onQueueFlushed } = options;
  const [isFlushing, setIsFlushing] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const wasOffline = useRef(false);

  const flushQueue = useCallback(async () => {
    const queued = await getQueuedResponses();
    if (queued.length === 0) return;

    setIsFlushing(true);
    setQueueLength(queued.length);

    for (const response of queued) {
      try {
        const success = await onSendResponse(response);
        if (success) {
          await removeQueuedResponse(response.id);
          setQueueLength((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        // Stop flushing on first failure — will retry on next reconnection
        console.warn('[NetworkMonitor] Failed to flush response:', error);
        break;
      }
    }

    setIsFlushing(false);
    onQueueFlushed?.();
  }, [onSendResponse, onQueueFlushed]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? false;

      if (!connected) {
        wasOffline.current = true;
      } else if (wasOffline.current && connected) {
        // Network just recovered — flush queued responses
        wasOffline.current = false;
        flushQueue();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [flushQueue]);

  return { isFlushing, queueLength };
}
