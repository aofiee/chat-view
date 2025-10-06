'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { authStorage, decodeJWT } from '@/lib/auth';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  enabled: boolean;
  category?: string; // 'all', 'finished', or 'me'
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const { enabled, category = 'all', onMessage, onConnect, onDisconnect, onError } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Use refs to store the latest callback functions to avoid stale closures
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onErrorRef.current = onError;
  });

  const addMessage = useCallback((type: string, data: any) => {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, message]);
    console.log(`[WebSocket ${type}]:`, data);
  }, []);

  const getUserIdFromToken = useCallback((): string | null => {
    const accessToken = authStorage.getAccessToken();
    if (!accessToken) {
      console.error('No access token found');
      return null;
    }

    const payload = decodeJWT(accessToken);
    if (!payload || !payload.payload) {
      console.error('Invalid JWT payload');
      return null;
    }

    const userPayload = payload.payload as Record<string, unknown>;
    const userId = userPayload.id?.toString();
    
    if (!userId) {
      console.error('No user ID found in JWT payload');
      return null;
    }

    return userId;
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;

    const userId = getUserIdFromToken();
    if (!userId) {
      setConnectionError('Unable to get user ID from authentication token');
      return;
    }

    const wsUrl = `ws://localhost:8080/v1/api/ws/case?owner=${userId}&category=${category}`;
    console.log('Attempting to connect to WebSocket:', wsUrl);
    console.log(`WebSocket category switching: ${category}`);
    
    addMessage('LOG', `Attempting to connect to: ${wsUrl}`);
    addMessage('LOG', `Category: ${category} | User ID: ${userId}`);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Set a connection timeout
      let connectionTimeout: NodeJS.Timeout | null = null;
      connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          setConnectionError('WebSocket connection timeout - server may not be running');
          addMessage('ERROR', 'Connection timeout - WebSocket server may not be running on localhost:8080');
        }
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        if (connectionTimeout) clearTimeout(connectionTimeout);
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        addMessage('LOG', 'WebSocket connection established successfully');
        
        if (onConnectRef.current) {
          onConnectRef.current();
        }
      };

      ws.onmessage = (event) => {
        try {
          console.log('WebSocket message received:', event.data);
          let messageData;
          
          // Try to parse as JSON, fallback to plain text
          try {
            messageData = JSON.parse(event.data);
          } catch {
            messageData = event.data;
          }
          
          addMessage('MESSAGE', messageData);
          
          if (onMessageRef.current) {
            onMessageRef.current(messageData);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          addMessage('ERROR', `Error processing message: ${error}`);
        }
      };

      ws.onclose = (event) => {
        if (connectionTimeout) clearTimeout(connectionTimeout);
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        let closeReason = 'No reason provided';
        let errorMessage = '';
        
        if (event.code === 1006) {
          closeReason = 'Connection failed - server may not be running';
          errorMessage = 'WebSocket server not reachable - check if server is running on localhost:8080';
        } else if (event.code === 1000) {
          closeReason = 'Normal closure';
        } else if (event.code === 1011) {
          closeReason = 'Server error - insufficient resources';
          errorMessage = 'WebSocket server reported insufficient resources - server may be overloaded or not properly configured';
        } else if (event.reason) {
          closeReason = event.reason;
        }
        
        if (errorMessage) {
          setConnectionError(errorMessage);
        }
        
        addMessage('LOG', `WebSocket disconnected (Code: ${event.code}, Reason: ${closeReason})`);
        
        if (onDisconnectRef.current) {
          onDisconnectRef.current();
        }

        // Don't attempt to reconnect immediately for resource issues
        const shouldReconnect = enabled && 
          event.code !== 1000 && 
          event.code !== 1011 && // Don't reconnect on insufficient resources
          reconnectAttemptsRef.current < maxReconnectAttempts;

        if (shouldReconnect) {
          reconnectAttemptsRef.current++;
          addMessage('LOG', `Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError('Maximum reconnection attempts reached - server may be offline');
          addMessage('ERROR', 'Maximum reconnection attempts reached - server may be offline');
        } else if (event.code === 1011) {
          addMessage('ERROR', 'Server reported insufficient resources - manual reconnection required');
        }
      };

      ws.onerror = (error) => {
        if (connectionTimeout) clearTimeout(connectionTimeout);
        console.log('WebSocket error occurred - likely connection failure');
        setConnectionError('WebSocket connection failed - server may not be running');
        addMessage('ERROR', 'WebSocket connection failed - check if server is running on localhost:8080');
        
        if (onErrorRef.current) {
          onErrorRef.current(error);
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create WebSocket connection:', errorMessage);
      setConnectionError('Failed to create WebSocket connection');
      addMessage('ERROR', `Failed to create WebSocket connection: ${errorMessage}`);
    }
  }, [enabled, category]); // Depend on enabled and category to reconnect when category changes

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      console.log('Manually disconnecting WebSocket');
      addMessage('LOG', 'Disconnecting WebSocket for category change');
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
  }, []); // No dependencies needed

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && isConnected) {
      try {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        wsRef.current.send(messageStr);
        addMessage('SENT', message);
        console.log('Message sent:', message);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to send message:', errorMessage);
        addMessage('ERROR', `Failed to send message: ${errorMessage}`);
      }
    } else {
      console.warn('WebSocket not connected, cannot send message');
      addMessage('WARNING', 'Cannot send message: WebSocket not connected');
    }
  }, [isConnected]); // Only depend on connection state

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Effect to handle connection when enabled or category changes
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [enabled, category]); // Depend on both enabled and category

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    connectionError,
    messages,
    sendMessage,
    clearMessages,
    disconnect,
    reconnect: connect
  };
}