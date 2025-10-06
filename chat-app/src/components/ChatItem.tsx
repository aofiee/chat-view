'use client';

import { ChatItem as ChatItemType } from '@/types/chat';
import Image from 'next/image';

interface ChatItemProps {
  item: ChatItemType;
  onClick?: (userId: string, userName: string, userPhoto: string) => void;
}

export default function ChatItem({ item, onClick }: ChatItemProps) {
  const handleClick = () => {
    if (onClick && item.userId) {
      onClick(item.userId, item.name, item.photo);
    }
  };

  const renderMessage = (message: string) => {
    const imagePattern = /\.(png|jpg|jpeg|gif|webp)$/i;
    if (imagePattern.test(message)) {
      return (
        <div className="mt-2">
          <Image
            src={message}
            alt="chat-image"
            width={150}
            height={150}
            className="rounded-lg object-cover max-w-[150px] max-h-[150px]"
            unoptimized
          />
        </div>
      );
    }
    return (
      <p className="text-gray-700 text-sm leading-relaxed break-words">
        {message}
      </p>
    );
  };

  return (
    <div 
      id={item.userId}
      className={`flex items-start gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={handleClick}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Image
          src={item.photo}
          alt={item.name}
          width={50}
          height={50}
          className="rounded-full object-cover ring-2 ring-gray-100"
          unoptimized
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 truncate">
            {item.name}
          </h3>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <span className="text-xs text-gray-500">
            {new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        <div className="mt-1">
          {renderMessage(item.message)}
        </div>
      </div>
    </div>
  );
}