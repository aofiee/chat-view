'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatItem as ChatItemType, MenuType } from '@/types/chat';
import { fetchChatData } from '@/lib/api';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useWebSocket } from '@/hooks/useWebSocket';
import ChatItem from './ChatItem';
import WebSocketLog from './WebSocketLog';
import { Loader2, AlertCircle, Inbox, ArrowUp, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ChatListProps {
  activeMenu: MenuType;
  onChatItemClick?: (userId: string, userName: string, userPhoto: string) => void;
}

export default function ChatList({ activeMenu, onChatItemClick }: ChatListProps) {
  const [chatItems, setChatItems] = useState<ChatItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const touchStartY = useRef(0);
  const limit = 10;

  // Function to update chat item from WebSocket data
  const updateChatItemFromWebSocket = useCallback((wsData: any) => {
    // Convert WebSocket data to ChatItem format
    const newChatItem: ChatItemType = {
      userId: wsData.userId,
      name: wsData.name,
      photo: wsData.photo,
      message: wsData.content?.text || wsData.message || '',
      id: wsData.userId
    };

    setChatItems(prevItems => {
      // Check if item already exists
      const existingIndex = prevItems.findIndex(item => item.userId === wsData.userId);
      
      if (existingIndex !== -1) {
        // Remove existing item and add updated item at the beginning (most recent)
        const updatedItems = [...prevItems];
        updatedItems.splice(existingIndex, 1); // Remove old item
        return [newChatItem, ...updatedItems]; // Add updated item at the beginning
      } else {
        // Add new item at the beginning (most recent)
        return [newChatItem, ...prevItems];
      }
    });

    // Add visual feedback for the updated item
    setTimeout(() => {
      const userElement = document.getElementById(wsData.userId);
      if (userElement) {
        // Add highlight effect
        userElement.style.backgroundColor = '#dbeafe'; // Light blue
        userElement.style.transition = 'background-color 0.3s ease';
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
          userElement.style.backgroundColor = '';
        }, 2000);
      }
      
      // Scroll to top to show the updated item
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }, 100);

    console.log('Chat item updated/added for user:', wsData.userId);
  }, []);

  // WebSocket integration for all menu types ('all', 'finished', 'me')
  const webSocket = useWebSocket({
    enabled: activeMenu === 'all' || activeMenu === 'finished' || activeMenu === 'me',
    category: activeMenu,
    onMessage: (data) => {
      console.log('Received WebSocket message:', data);
      
      // Check if the received data has the expected structure
      if (data && data.userId && data.name && data.photo) {
        console.log('Updating chat item for user:', data.userId);
        updateChatItemFromWebSocket(data);
      } else {
        console.log('WebSocket data does not match expected chat item structure:', data);
      }
    },
    onConnect: () => {
      const caseType = activeMenu === 'all' ? 'All Cases' : 
                      activeMenu === 'finished' ? 'Finished Cases' : 'My Cases';
      console.log(`WebSocket connected for ${caseType}`);
    },
    onDisconnect: () => {
      const caseType = activeMenu === 'all' ? 'All Cases' : 
                      activeMenu === 'finished' ? 'Finished Cases' : 'My Cases';
      console.log(`WebSocket disconnected from ${caseType}`);
    },
    onError: (error) => {
      const caseType = activeMenu === 'all' ? 'All Cases' : 
                      activeMenu === 'finished' ? 'Finished Cases' : 'My Cases';
      console.log(`WebSocket error in ${caseType} - Connection failed`);
      console.log('This is expected if the WebSocket server is not running on localhost:8080');
      // Don't log the actual error object to avoid console issues
    }
  });

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);

  const loadChatData = useCallback(async (currentOffset: number, reset: boolean = false) => {
    if (loadingRef.current) return; // Use ref to check loading state
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetchChatData(activeMenu, currentOffset, limit);
      
      if (response.data && response.data.length > 0) {
        setChatItems(prev => reset ? response.data : [...prev, ...response.data]);
        setHasMore(response.hasMoreChat);
        setOffset(currentOffset + limit);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError('Failed to load chat data. Please check your connection.');
      console.error('Error fetching chats:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [activeMenu, limit]);

  // Refresh data function for pull-to-refresh
  const refreshData = useCallback(async () => {
    if (loadingRef.current || refreshing) return;
    
    setRefreshing(true);
    loadingRef.current = true;
    setError(null);

    try {
      const response = await fetchChatData(activeMenu, 0, limit);
      
      if (response.data) {
        setChatItems(response.data);
        setHasMore(response.hasMoreChat);
        setOffset(limit);
      }
    } catch (err) {
      setError('Failed to refresh data. Please check your connection.');
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
      loadingRef.current = false;
      setLoading(false);
    }
  }, [activeMenu, limit, refreshing]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onScrollToTop: scrollToTop,
    onRefresh: refreshData,
  });

  // Reset state when menu changes
  useEffect(() => {
    setChatItems([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
    setShowScrollTop(false);
    loadingRef.current = false;
    loadChatData(0, true);
  }, [activeMenu, loadChatData]);

  const loadInitialData = useCallback(async () => {
    await loadChatData(0, true);
  }, [loadChatData]);

  // Load more data when scrolling
  const loadMore = useCallback(() => {
    if (hasMore && !loadingRef.current) {
      loadChatData(offset);
    }
  }, [hasMore, offset, loadChatData]);

  // Handle scroll events for infinite scroll and scroll-to-top button
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // Show/hide scroll to top button
    setShowScrollTop(scrollTop > 300);
    
    // Load more when user scrolls to within 100px of bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  }, [loadMore]);

  // Touch events for pull-to-refresh
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || !containerRef.current) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;

    if (distance > 0 && containerRef.current.scrollTop === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, 120)); // Max pull distance of 120px
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(() => {
    if (isPulling && pullDistance > 80) {
      refreshData();
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [isPulling, pullDistance, refreshData]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Auto-load until scrollable (like the original implementation)
  useEffect(() => {
    const autoLoad = async () => {
      if (!containerRef.current || loadingRef.current || !hasMore) return;
      
      if (containerRef.current.scrollHeight <= containerRef.current.clientHeight) {
        await loadChatData(offset);
      }
    };

    const timeoutId = setTimeout(autoLoad, 100); // Debounce to prevent rapid calls
    return () => clearTimeout(timeoutId);
  }, [chatItems.length, hasMore, offset, loadChatData]);

  const getMenuTitle = (menu: MenuType) => {
    switch (menu) {
      case 'me': return 'My Cases';
      case 'finished': return 'Finished Cases';
      case 'all': return 'All Cases';
      default: return 'Cases';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 pl-16 lg:pl-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800">
                {getMenuTitle(activeMenu)}
              </h2>
              {/* WebSocket status indicator for all menu types */}
              {(activeMenu === 'all' || activeMenu === 'finished' || activeMenu === 'me') && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  webSocket.isConnected 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {webSocket.isConnected ? (
                    <>
                      <Wifi size={12} />
                      <span>WebSocket Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={12} />
                      <span>WebSocket Disconnected</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <p className="text-gray-600 text-sm mt-1">
              {chatItems.length} conversation{chatItems.length !== 1 ? 's' : ''}
              {loading && ' (loading...)'}
              {refreshing && ' (refreshing...)'}
              {(activeMenu === 'all' || activeMenu === 'finished' || activeMenu === 'me') && webSocket.connectionError && (
                <span className="text-red-600"> - {webSocket.connectionError}</span>
              )}
              {(activeMenu === 'all' || activeMenu === 'finished' || activeMenu === 'me') && !webSocket.isConnected && !webSocket.connectionError && (
                <span className="text-blue-600"> - Connecting to WebSocket...</span>
              )}
              {(activeMenu === 'all' || activeMenu === 'finished' || activeMenu === 'me') && (
                <span className="text-green-600 text-xs"> • Frontend ready for WebSocket server</span>
              )}
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group relative"
            title="Refresh (F5 or Ctrl+R)"
          >
            <RefreshCw 
              size={16} 
              className={`${refreshing ? 'animate-spin' : ''}`} 
            />
            <span className="text-sm font-medium">Refresh</span>
            
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              F5 or Ctrl+R
            </div>
          </button>
        </div>
      </div>

      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div 
          className="absolute top-16 left-0 right-0 bg-blue-50 border-b border-blue-200 flex items-center justify-center py-2 z-10 transition-all duration-200"
          style={{ 
            height: `${Math.min(pullDistance, 80)}px`,
            opacity: pullDistance / 80 
          }}
        >
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw 
              size={16} 
              className={pullDistance > 80 ? 'animate-spin' : ''} 
            />
            <span className="text-sm font-medium">
              {pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Chat List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-white"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          paddingTop: isPulling ? `${Math.min(pullDistance, 80)}px` : '0',
          transition: isPulling ? 'none' : 'padding-top 0.2s ease-out'
        }}
      >
        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <div>
                <p className="text-red-800 font-medium">Error loading chats</p>
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={loadInitialData}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {!error && chatItems.length === 0 && !loading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <Inbox className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No conversations found
              </h3>
              <p className="text-gray-500 text-sm">
                {activeMenu === 'me' && "You don&apos;t have any personal cases yet."}
                {activeMenu === 'finished' && "No finished cases available."}
                {activeMenu === 'all' && "No cases available at the moment."}
              </p>
            </div>
          </div>
        )}

        {chatItems.map((item, index) => (
          <ChatItem
            key={`${activeMenu}-${index}-${item.name}`}
            item={item}
            onClick={onChatItemClick}
          />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="p-6 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-sm">Loading more conversations...</span>
            </div>
          </div>
        )}

        {/* End of list indicator */}
        {!hasMore && chatItems.length > 0 && (
          <div className="p-6 text-center">
            <p className="text-gray-500 text-sm">
              You&apos;ve reached the end of the list
            </p>
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 hover:scale-110 active:scale-95 group"
          aria-label="Scroll to top"
          title="Scroll to top (Home or Ctrl+↑)"
        >
          <ArrowUp size={20} />
          
          {/* Tooltip */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Home or Ctrl+↑
          </div>
        </button>
      )}

      {/* WebSocket Log - Show for all menu types */}
      {(activeMenu === 'all' || activeMenu === 'finished' || activeMenu === 'me') && (
        <WebSocketLog
          isConnected={webSocket.isConnected}
          connectionError={webSocket.connectionError}
          messages={webSocket.messages}
          onClearMessages={webSocket.clearMessages}
          onDisconnect={webSocket.disconnect}
          onReconnect={webSocket.reconnect}
          sendMessage={webSocket.sendMessage}
        />
      )}
    </div>
  );
}