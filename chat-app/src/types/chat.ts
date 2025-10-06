export interface ChatItem {
  id?: string;
  name: string;
  message: string;
  photo: string;
  userId?: string;
}

export interface ChatResponse {
  data: ChatItem[];
  hasMoreChat: boolean;
}

export type MenuType = 'all' | 'me' | 'finished';

export interface ApiRequest {
  offset: number;
  limit: number;
}

// Individual chat types
export interface ChatMessage {
  messageId?: string; // Unique identifier for each message
  userId: string;
  name: string;
  photo: string;
  type: string;
  message: string;
  content: MessageContent | MessageContent[]; // Handle array of content for imagemap
  isPinned: boolean;
  isActive: boolean;
  isUserBlock: boolean;
  createdBy: number | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface MessageContent {
  text?: string;
  type: 'text' | 'image' | 'flex' | 'sticker' | 'imagemap';
  altText?: string;
  contents?: any;
  previewImageUrl?: string;
  originalContentUrl?: string;
  packageId?: string;
  stickerId?: string;
}

export interface IndividualChatResponse {
  status: {
    code: number;
    message: string[];
  };
  data: ChatMessage[];
  hasMoreChat: boolean;
}

export interface IndividualChatRequest {
  userId: string;
  offset: number;
  limit: number;
}