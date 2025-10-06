'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { fetchIndividualChatData } from '@/lib/api';
import { useIndividualWebSocket } from '@/hooks/useIndividualWebSocket';
import MessageBubble from './MessageBubble';
import { X, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface IndividualChatProps {
  userId: string;
  userName: string;
  userPhoto: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function IndividualChat({
  userId,
  userName,
  userPhoto,
  isOpen,
  onClose
}: IndividualChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const previousScrollHeight = useRef(0);
  const limit = 10;

  // Function to handle WebSocket messages and update chat
  const handleWebSocketMessage = useCallback((wsData: any) => {
    console.log('Individual chat WebSocket message received:', wsData);
    
    // Check if the received data has the expected structure for a chat message
    if (wsData && wsData.messageId && wsData.userId && wsData.name) {
      console.log('Processing individual chat message:', wsData.messageId);
      
      // Convert WebSocket data to ChatMessage format
      const newMessage: ChatMessage = {
        messageId: wsData.messageId,
        userId: wsData.userId,
        name: wsData.name,
        photo: wsData.photo || '',
        type: wsData.type || '0',
        message: wsData.message || '',
        content: wsData.content || { type: 'text', text: wsData.message || '' },
        isPinned: wsData.isPinned || false,
        isActive: wsData.isActive || false,
        isUserBlock: wsData.isUserBlock || false,
        createdBy: wsData.createdBy !== undefined ? wsData.createdBy : 0, // Default to 0 (left side) for undefined
        createdAt: wsData.createdAt || new Date().toISOString(),
        updatedAt: wsData.updatedAt || new Date().toISOString()
      };

      // Check if message already exists in DOM
      const existingElement = document.getElementById(wsData.messageId);
      
      if (existingElement) {
        // Update existing message in state
        console.log('Updating existing message:', wsData.messageId);
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.messageId === wsData.messageId ? newMessage : msg
          )
        );
      } else {
        // Append new message to the bottom
        console.log('Adding new message to chat:', wsData.messageId);
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
        // Auto-scroll to bottom for new messages
        setTimeout(() => {
          if (messagesEndRef.current) {
            console.log(`[IndividualChat] Programmatic scroll to bottom for new WebSocket message`);
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      console.log('WebSocket data does not match expected message structure:', wsData);
    }
  }, []);

  // Individual WebSocket integration
  const individualWebSocket = useIndividualWebSocket({
    enabled: isOpen && !!userId,
    targetUserId: userId,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log(`Individual WebSocket connected for user: ${userId} (${userName})`);
    },
    onDisconnect: () => {
      console.log(`Individual WebSocket disconnected from user: ${userId} (${userName})`);
    },
    onError: (error) => {
      console.log(`Individual WebSocket error for user ${userId}: Connection failed`);
      console.log('This is expected if the WebSocket server is not running on localhost:8080');
    }
  });

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      console.log(`[IndividualChat] Programmatic scroll to bottom`);
      setIsProgrammaticScroll(true);
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      // Reset flag after scroll animation completes
      setTimeout(() => {
        setIsProgrammaticScroll(false);
        console.log(`[IndividualChat] Programmatic scroll flag reset`);
      }, 600); // Slightly longer than smooth scroll animation
    }
  }, []);

  const handleClose = useCallback(() => {
    // Clear all chat data from memory/state as per requirement 5
    console.log(`[IndividualChat] Closing chat and clearing data`);
    setMessages([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
    setIsInitialLoad(true);
    setIsProgrammaticScroll(false);
    setLastScrollTop(0);
    loadingRef.current = false;
    previousScrollHeight.current = 0;

    // Call parent close handler
    onClose();
  }, [onClose]);

  const maintainScrollPosition = useCallback(() => {
    if (containerRef.current && previousScrollHeight.current > 0) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const heightDifference = newScrollHeight - previousScrollHeight.current;
      
      console.log(`[IndividualChat] Maintaining scroll position: heightDiff=${heightDifference}, newHeight=${newScrollHeight}, prevHeight=${previousScrollHeight.current}`);
      
      // Adjust scroll position to maintain user's current view
      containerRef.current.scrollTop += heightDifference;
      
      // Reset previous height after adjustment
      previousScrollHeight.current = 0;
    }
  }, []);

  const loadMessages = useCallback(async (currentOffset: number, reset: boolean = false) => {
    if (loadingRef.current || !userId) return;

    console.log(`[IndividualChat] Loading messages: offset=${currentOffset}, reset=${reset}, userId=${userId}`);

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    // Store current scroll height for position maintenance
    if (containerRef.current && !reset) {
      previousScrollHeight.current = containerRef.current.scrollHeight;
    }

    try {
      const response = await fetchIndividualChatData(userId, currentOffset, limit);

      console.log(`[IndividualChat] API response: ${response.data.length} messages, hasMore=${response.hasMoreChat}`);

      if (response.data && response.data.length > 0) {
        setMessages(prev => {
          if (reset) {
            return response.data;
          } else {
            // Prepend older messages to the beginning of the array
            return [...response.data, ...prev];
          }
        });
        setHasMore(response.hasMoreChat);
        setOffset(currentOffset + limit);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError('Failed to load chat messages. Please check your connection.');
      console.error('Error fetching individual chat:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [userId, limit]);

  // Reset and load initial data when chat opens or userId changes
  useEffect(() => {
    if (isOpen && userId) {
      console.log(`[IndividualChat] Chat opened for userId: ${userId}`);
      setMessages([]);
      setOffset(0);
      setHasMore(true);
      setError(null);
      setIsInitialLoad(true);
      setIsProgrammaticScroll(false);
      loadingRef.current = false;

      // Call loadMessages directly to avoid dependency loop
      const loadInitialMessages = async () => {
        if (loadingRef.current) return;

        console.log(`[IndividualChat] Loading initial messages for userId: ${userId}`);
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
          const response = await fetchIndividualChatData(userId, 0, limit);

          console.log(`[IndividualChat] Initial API response: ${response.data.length} messages, hasMore=${response.hasMoreChat}`);

          if (response.data && response.data.length > 0) {
            setMessages(response.data);
            setHasMore(response.hasMoreChat);
            setOffset(limit);
          } else {
            setHasMore(false);
          }
        } catch (err) {
          setError('Failed to load chat messages. Please check your connection.');
          console.error('Error fetching initial chat:', err);
        } finally {
          loadingRef.current = false;
          setLoading(false);
        }
      };

      loadInitialMessages();
    }
  }, [isOpen, userId, limit]); // Remove loadMessages from dependencies

  // Scroll to bottom on initial load, maintain position on history load
  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad) {
        // First load - scroll to bottom to show most recent messages
        console.log(`[IndividualChat] Initial load complete, scrolling to bottom`);
        setTimeout(() => {
          scrollToBottom();
          // Set initial load to false after scroll animation starts
          setTimeout(() => {
            setIsInitialLoad(false);
            console.log(`[IndividualChat] Initial load flag set to false`);
          }, 100);
        }, 100);
      } else if (previousScrollHeight.current > 0) {
        // Loading more history - maintain scroll position
        setTimeout(maintainScrollPosition, 50);
      }
    }
  }, [messages.length, isInitialLoad, scrollToBottom, maintainScrollPosition]);

  // Handle scroll for infinite loading (load more when scrolling up)
  const handleScroll = useCallback(() => {
    // Prevent triggering during initial load or programmatic scrolling
    if (!containerRef.current || loadingRef.current || !hasMore || isInitialLoad || isProgrammaticScroll) {
      console.log(`[IndividualChat] Scroll handler blocked: isInitialLoad=${isInitialLoad}, isProgrammaticScroll=${isProgrammaticScroll}, loading=${loadingRef.current}, hasMore=${hasMore}`);
      return;
    }

    const { scrollTop } = containerRef.current;

    // Load more ONLY when user scrolls to the very top (scrollTop === 0)
    if (scrollTop === 0) {
      console.log(`[IndividualChat] User reached top (scrollTop=0), loading more messages with offset: ${offset}`);

      // Call API directly to avoid dependency issues
      const loadMoreMessages = async () => {
        if (loadingRef.current || !userId) return;

        console.log(`[IndividualChat] Loading more messages: offset=${offset}, userId=${userId}`);

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        // Store current scroll height for position maintenance
        if (containerRef.current) {
          previousScrollHeight.current = containerRef.current.scrollHeight;
        }

        try {
          const response = await fetchIndividualChatData(userId, offset, limit);

          console.log(`[IndividualChat] More messages API response: ${response.data.length} messages, hasMore=${response.hasMoreChat}`);

          if (response.data && response.data.length > 0) {
            setMessages(prev => [...response.data, ...prev]);
            setHasMore(response.hasMoreChat);
            setOffset(prev => prev + limit);
          } else {
            setHasMore(false);
          }
        } catch (err) {
          setError('Failed to load chat messages. Please check your connection.');
          console.error('Error fetching more chat messages:', err);
        } finally {
          loadingRef.current = false;
          setLoading(false);
        }
      };

      loadMoreMessages();
    } else {
      // Log intermediate scrolling but don't trigger load more (throttled)
      if (Math.abs(scrollTop - lastScrollTop) > 50) { // Only log significant scroll changes
        console.log(`[IndividualChat] Intermediate scroll: scrollTop=${scrollTop}, not triggering load more`);
        setLastScrollTop(scrollTop);
      }
    }
  }, [hasMore, offset, userId, limit, isInitialLoad, isProgrammaticScroll, lastScrollTop]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-full lg:inset-0 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close chat"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>

          <div className="flex items-center gap-3 flex-1">
            <Image
              src={userPhoto}
              alt={userName}
              width={40}
              height={40}
              className="rounded-full object-cover"
              unoptimized
            />
            <div>
              <h3 className="font-semibold text-gray-900">{userName}</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">Online</p>
                {/* WebSocket status indicator */}
                <div className={`w-2 h-2 rounded-full ${
                  individualWebSocket.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} title={`WebSocket: ${individualWebSocket.isConnected ? 'Connected' : 'Disconnected'}`}></div>
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
            aria-label="Close chat"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 h-[calc(100vh-80px)] bg-gray-50"
      >
        {/* Loading indicator at top for loading more history */}
        {loading && !isInitialLoad && messages.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm">Loading older messages...</span>
            </div>
          </div>
        )}

        {/* No more history indicator */}
        {!hasMore && messages.length > 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-xs">Beginning of conversation</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <div>
                <p className="text-red-800 font-medium text-sm">Error loading messages</p>
                <p className="text-red-600 text-xs">{error}</p>
                <button
                  onClick={() => loadMessages(0, true)}
                  className="mt-1 text-red-600 hover:text-red-800 text-xs font-medium underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Initial loading */}
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="mx-auto text-blue-600 animate-spin mb-2" size={24} />
              <p className="text-gray-600 text-sm">Loading messages...</p>
            </div>
          </div>
        )}

        {/* No messages */}
        {!loading && messages.length === 0 && !error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No messages yet</h3>
              <p className="text-gray-500 text-sm">Start a conversation with {userName}</p>
            </div>
          </div>
        )}

        {/* Messages - displayed in chronological order (oldest to newest) */}
        <div className="space-y-1">
          {messages.map((message, index) => (
            <MessageBubble
              key={`${message.userId}-${index}-${message.createdAt}`}
              message={message}
            />
          ))}
        </div>

        {/* Scroll anchor for bottom */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
