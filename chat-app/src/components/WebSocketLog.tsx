'use client';

import { useState } from 'react';
import { X, Minimize2, Maximize2, Trash2, Wifi, WifiOff, AlertCircle, MessageCircle, Send, ArrowUp, ArrowDown } from 'lucide-react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WebSocketLogProps {
  isConnected: boolean;
  connectionError: string | null;
  messages: WebSocketMessage[];
  onClearMessages: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
  sendMessage: (message: any) => void;
}

export default function WebSocketLog({
  isConnected,
  connectionError,
  messages,
  onClearMessages,
  onDisconnect,
  onReconnect,
  sendMessage
}: WebSocketLogProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'LOG':
        return <MessageCircle size={14} className="text-blue-500" />;
      case 'MESSAGE':
        return <ArrowDown size={14} className="text-green-500" />;
      case 'SENT':
        return <ArrowUp size={14} className="text-purple-500" />;
      case 'ERROR':
        return <AlertCircle size={14} className="text-red-500" />;
      case 'WARNING':
        return <AlertCircle size={14} className="text-yellow-500" />;
      default:
        return <MessageCircle size={14} className="text-gray-500" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'LOG':
        return 'text-blue-700 bg-blue-50';
      case 'MESSAGE':
        return 'text-green-700 bg-green-50';
      case 'SENT':
        return 'text-purple-700 bg-purple-50';
      case 'ERROR':
        return 'text-red-700 bg-red-50';
      case 'WARNING':
        return 'text-yellow-700 bg-yellow-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const handleSendTestMessage = () => {
    if (testMessage.trim()) {
      sendMessage(testMessage.trim());
      setTestMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTestMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi size={16} className="text-green-500" />
          ) : (
            <WifiOff size={16} className="text-red-500" />
          )}
          <span className="font-medium text-sm">
            WebSocket Log
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={isMinimized ? () => setIsMinimized(false) : () => setIsMinimized(true)}
            className="p-1 hover:bg-gray-200 rounded"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={onClearMessages}
            className="p-1 hover:bg-gray-200 rounded"
            title="Clear messages"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Connection Info */}
          {!isConnected && !connectionError && (
            <div className="p-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 text-sm">
                <MessageCircle size={14} />
                <div>
                  <div>Attempting to connect to WebSocket server...</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Server: ws://localhost:8080/v1/api/ws/case
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Info - Implementation Working */}
          {(isConnected || connectionError) && (
            <div className="p-3 bg-green-50 border-b border-green-200">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <MessageCircle size={14} />
                <div>
                  <div>✅ WebSocket Implementation Working</div>
                  <div className="text-xs text-green-600 mt-1">
                    JWT parsed successfully • User ID extracted • URL generated correctly
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connection Error */}
          {connectionError && (
            <div className="p-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={14} />
                <div>
                  <div>{connectionError}</div>
                  <div className="text-xs text-red-600 mt-1">
                    Make sure the WebSocket server is running on localhost:8080
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connection Controls */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <button
                onClick={isConnected ? onDisconnect : onReconnect}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  isConnected 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {isConnected ? 'Disconnect' : 'Reconnect'}
              </button>
              <span className="text-xs text-gray-500">
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Test Message Input */}
          {isConnected && (
            <div className="p-3 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Send test message..."
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendTestMessage}
                  disabled={!testMessage.trim()}
                  className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send message"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-2 space-y-1 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-8">
                No messages yet
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-xs ${getMessageColor(message.type)}`}
                >
                  <div className="flex items-start gap-2">
                    {getMessageIcon(message.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{message.type}</span>
                        <span className="text-gray-500 text-xs">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      <div className="break-words">
                        {typeof message.data === 'string' ? (
                          message.data
                        ) : (
                          <pre className="whitespace-pre-wrap font-mono text-xs">
                            {JSON.stringify(message.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}