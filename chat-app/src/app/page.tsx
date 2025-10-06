'use client';

import { useState, useEffect } from 'react';
import { MenuType } from '@/types/chat';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import ChatList from '@/components/ChatList';
import IndividualChat from '@/components/IndividualChat';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto text-blue-600 animate-spin mb-4" size={32} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <HomeContent />;
}

function HomeContent() {
  const [activeMenu, setActiveMenu] = useState<MenuType>('all');
  const [individualChat, setIndividualChat] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    userPhoto: string;
  }>({
    isOpen: false,
    userId: '',
    userName: '',
    userPhoto: ''
  });

  const handleChatItemClick = (userId: string, userName: string, userPhoto: string) => {
    setIndividualChat({
      isOpen: true,
      userId,
      userName,
      userPhoto
    });
  };

  const handleCloseIndividualChat = () => {
    setIndividualChat(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50 relative">
        <Sidebar 
          activeMenu={activeMenu} 
          onMenuChange={setActiveMenu} 
        />
        <div className="flex-1 lg:ml-0">
          <ChatList 
            activeMenu={activeMenu} 
            onChatItemClick={handleChatItemClick}
          />
        </div>
        
        {/* Individual Chat Overlay */}
        <IndividualChat
          userId={individualChat.userId}
          userName={individualChat.userName}
          userPhoto={individualChat.userPhoto}
          isOpen={individualChat.isOpen}
          onClose={handleCloseIndividualChat}
        />
      </div>
    </ProtectedRoute>
  );
}
