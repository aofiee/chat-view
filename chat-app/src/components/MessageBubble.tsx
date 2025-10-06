'use client';

import { ChatMessage, MessageContent } from '@/types/chat';
import Image from 'next/image';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  // If createdBy is null, undefined, or 0, display on left side (not from user)
  // If createdBy is any other value (1, 2, etc.), display on right side (from user)
  const isFromUser = message.createdBy !== null && 
                     message.createdBy !== undefined && 
                     message.createdBy !== 0;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContent = (content: MessageContent | MessageContent[]) => {
    // Handle array case for imagemap
    if (Array.isArray(content)) {
      // For imagemap array, display the altText of the first item
      const firstItem = content[0];
      if (firstItem && firstItem.type === 'imagemap' && firstItem.altText) {
        return (
          <div className={`p-3 rounded-2xl max-w-xs break-words ${
            isFromUser
              ? 'bg-blue-100 text-blue-800'
              : 'bg-blue-50 text-blue-700'
          }`}>
            <p className="text-sm">{firstItem.altText}</p>
          </div>
        );
      }
      return null;
    }

    // Handle single content object
    switch (content.type) {
      case 'text':
        return (
          <div className={`p-3 rounded-2xl max-w-xs break-words ${
            isFromUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}>
				<p className="text-sm">{content.text}</p>
          </div>
        );

      case 'image':
        return (
          <div className="rounded-2xl overflow-hidden max-w-xs">
            <Image
              src={content.previewImageUrl || ''}
              alt="Image message"
              width={200}
              height={200}
              className="w-full h-auto object-cover"
              unoptimized
            />
          </div>
        );

      case 'flex':
        return (
          <div className={`p-3 rounded-2xl max-w-xs break-words ${
            isFromUser
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700'
          }`}>
            <p className="text-sm">{content.altText}</p>
          </div>
        );

      case 'imagemap':
        return (
          <div className={`p-3 rounded-2xl max-w-xs break-words ${
            isFromUser
              ? 'bg-blue-100 text-blue-800'
              : 'bg-blue-50 text-blue-700'
          }`}>
            <p className="text-sm">{content.altText}</p>
          </div>
        );

      case 'sticker':
        const stickerUrl = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${content.stickerId}/android/sticker.png`;
        return (
          <div className="rounded-2xl overflow-hidden">
            <Image
              src={stickerUrl}
              alt="Sticker"
              width={120}
              height={120}
              className="w-auto h-auto max-w-[120px] max-h-[120px]"
              unoptimized
            />
          </div>
        );

      default:
        return (
          <div className={`p-3 rounded-2xl max-w-xs break-words ${
            isFromUser
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-700'
          }`}>
            <p className="text-sm">Unsupported message type</p>
          </div>
        );
    }
  };

  return (
    <div 
      id={message.messageId}
      className={`flex mb-4 ${isFromUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex gap-2 max-w-[70%] ${isFromUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Image
            src={message.photo}
            alt={message.name}
            width={32}
            height={32}
            className="rounded-full object-cover"
            unoptimized
          />
        </div>

        {/* Message content */}
        <div className={`flex flex-col ${isFromUser ? 'items-end' : 'items-start'}`}>
          {renderContent(message.content)}

          {/* Timestamp and name */}
          <div className={`mt-1 flex items-center gap-2 text-xs text-gray-500 ${
            isFromUser ? 'flex-row-reverse' : 'flex-row'
          }`}>
            <span className="font-medium">{message.name}</span>
            <span>•</span>
            <span>{formatTime(message.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
