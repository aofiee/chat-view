import { ChatResponse, ApiRequest, MenuType, IndividualChatResponse, IndividualChatRequest } from '@/types/chat';
import { authStorage, refreshAccessToken, isTokenExpired } from '@/lib/auth';

const BASE_URL = 'http://127.0.0.1:8080/v1/api/case';

const API_ENDPOINTS = {
  all: `${BASE_URL}/all`,
  me: `${BASE_URL}/me`,
  finished: `${BASE_URL}/finished`,
  individual: `${BASE_URL}/individual`,
};

// Create authenticated request with Bearer token
async function createAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
  let accessToken = authStorage.getAccessToken();

  // Check if token is expired and refresh if needed
  if (accessToken && isTokenExpired(accessToken)) {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResult = await refreshAccessToken(refreshToken);
        if (refreshResult.status.code === 200) {
          authStorage.setTokens(
            refreshResult.data.accessToken,
            refreshResult.data.refreshToken
          );
          accessToken = refreshResult.data.accessToken;
        } else {
          // Refresh failed, redirect to login
          authStorage.clearAuth();
          window.location.href = '/login';
          throw new Error('Authentication expired');
        }
      } catch {
        // Refresh failed, redirect to login
        authStorage.clearAuth();
        window.location.href = '/login';
        throw new Error('Authentication expired');
      }
    } else {
      // No refresh token, redirect to login
      authStorage.clearAuth();
      window.location.href = '/login';
      throw new Error('Authentication expired');
    }
  }

  // Add Authorization header
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

export async function fetchChatData(
  menuType: MenuType,
  offset: number = 0,
  limit: number = 10
): Promise<ChatResponse> {
  try {
    const endpoint = API_ENDPOINTS[menuType];
    const requestBody: ApiRequest = { offset, limit };

    const response = await createAuthenticatedRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized, redirect to login
        authStorage.clearAuth();
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.warn('API not available, using mock data:', error);

    // Return mock data with pagination simulation
    const mockData: ChatResponse = {
      data: [
        {
          userId: 'cd7f7895-bf28-49b5-b874-9826372ff045',
          name: 'John Doe',
          message: 'Hello, I need help with my account issue.',
          photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        },
        {
          userId: 'cd7f7895-bf28-49b5-b874-9826372ff046',
          name: 'Jane Smith',
          message: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=300&h=200&fit=crop',
          photo: 'https://images.unsplash.com/photo-1494790108755-2616b612-85b9c6?w=150&h=150&fit=crop&crop=face'
        },
        {
          userId: 'cd7f7895-bf28-49b5-b874-9826372ff047',
          name: 'Mike Johnson',
          message: 'Can someone please review my case? It has been pending for a while.',
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        {
          userId: 'cd7f7895-bf28-49b5-b874-9826372ff048',
          name: 'Sarah Wilson',
          message: 'Thank you for the quick response! The issue has been resolved.',
          photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
        },
        {
          userId: 'cd7f7895-bf28-49b5-b874-9826372ff049',
          name: 'David Brown',
          message: 'I have uploaded the required documents. Please check them.',
          photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
        }
      ],
      hasMoreChat: true
    };

    const start = offset;
    const end = start + limit;
    const paginatedData = mockData.data.slice(start, end);

    // Add some variety to names based on menu type
    const adjustedData = paginatedData.map((item, index) => ({
      ...item,
      name: `${item.name} (${menuType === 'me' ? 'My' : menuType === 'finished' ? 'Finished' : 'All'} #${start + index + 1})`
    }));

    return {
      data: adjustedData,
      hasMoreChat: end < mockData.data.length + 10 // Simulate more data
    };
  }
}

export async function fetchIndividualChatData(
  userId: string,
  offset: number = 0,
  limit: number = 10
): Promise<IndividualChatResponse> {
  console.log(`[API] fetchIndividualChatData called: userId=${userId}, offset=${offset}, limit=${limit}`);

  try {
    const endpoint = API_ENDPOINTS.individual;
    const requestBody: IndividualChatRequest = { userId, offset, limit };

    const response = await createAuthenticatedRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 401) {
        authStorage.clearAuth();
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[API] Real API response: ${result.data?.length || 0} messages`);
    return result;
  } catch (error) {
    console.warn('[API] Individual chat API not available, using mock data:', error);

    // Generate mock messages that simulate a real chat history
    // Messages are returned in chronological order (oldest first)
    const allMockMessages = [
      {
        messageId: "msg_001",
        userId: userId,
        name: "DD.Hakka",
        photo: "https://sprofile.line-scdn.net/0hF-rakWjqGQJfGAej18FnPC9IGmh8aUAQdX1eND9NT2Fmf1xVcSkFYz1PEDphIAoDd34GbGseQjV9QwcTCiQuLxhYKTA6LABVCH80IGp4BEkAbRoLEXw_JxVnT21rcigjLSxRAi8aTlw2QwAyGx00DwhsMDAnfj0GD091VFoqd4EwGm5Xcn9QbWIZQTDh",
        type: "0",
        message: "",
        content: {
          text: "Welcome to our support chat! How can I help you today?",
          type: "text" as const
        },
        isPinned: false,
        isActive: false,
        isUserBlock: false,
        createdBy: 0,
        createdAt: "2025-01-20T10:00:00.000Z",
        updatedAt: "2025-01-20T10:00:00.000Z"
      },
      {
        messageId: "msg_002",
        userId: userId,
        name: "User",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        type: "0",
        message: "",
        content: {
          text: "Hi! I'm having some issues with my account.",
          type: "text" as const
        },
        isPinned: false,
        isActive: false,
        isUserBlock: false,
        createdBy: 1,
        createdAt: "2025-01-20T10:01:00.000Z",
        updatedAt: "2025-01-20T10:01:00.000Z"
      },
      {
        messageId: "msg_003",
        userId: userId,
        name: "DD.Hakka",
        photo: "https://sprofile.line-scdn.net/0hF-rakWjqGQJfGAej18FnPC9IGmh8aUAQdX1eND9NT2Fmf1xVcSkFYz1PEDphIAoDd34GbGseQjV9QwcTCiQuLxhYKTA6LABVCH80IGp4BEkAbRoLEXw_JxVnT21rcigjLSxRAi8aTlw2QwAyGx00DwhsMDAnfj0GD091VFoqd4EwGm5Xcn9QbWIZQTDh",
        type: "0",
        message: "",
        content: {
          text: "I'd be happy to help! Can you tell me more about the specific issue you're experiencing?",
          type: "text" as const
        },
        isPinned: false,
        isActive: false,
        isUserBlock: false,
        createdBy: 0,
        createdAt: "2025-01-20T10:02:00.000Z",
        updatedAt: "2025-01-20T10:02:00.000Z"
      },
      {
        messageId: "msg_004",
        userId: userId,
        name: "User",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        type: "0",
        message: "",
        content: {
          text: "I can't seem to log into my dashboard. It keeps saying my credentials are invalid.",
          type: "text" as const
        },
        isPinned: false,
        isActive: false,
        isUserBlock: false,
        createdBy: 1,
        createdAt: "2025-01-20T10:03:00.000Z",
        updatedAt: "2025-01-20T10:03:00.000Z"
      },
      {
        messageId: "msg_005",
        userId: userId,
        name: "DD.Hakka",
        photo: "https://sprofile.line-scdn.net/0hF-rakWjqGQJfGAej18FnPC9IGmh8aUAQdX1eND9NT2Fmf1xVcSkFYz1PEDphIAoDd34GbGseQjV9QwcTCiQuLxhYKTA6LABVCH80IGp4BEkAbRoLEXw_JxVnT21rcigjLSxRAi8aTlw2QwAyGx00DwhsMDAnfj0GD091VFoqd4EwGm5Xcn9QbWIZQTDh",
        type: "0",
        message: "",
        content: [{
          type: "imagemap" as const,
          altText: "Here's a helpful guide on how to reset your password",
          sender: {
            name: "Support Team",
            iconUrl: "https://storage.healthathome.in.th/fcad6c42-7c3a-455f-ab99-e2985e2371f0.png"
          },
          actions: [{
            area: { x: 0, y: 0, width: 1040, height: 1517 },
            type: "uri",
            linkUri: "https://www.example.com/password-reset-guide"
          }],
          baseUrl: "https://storage.healthathome.in.th/c4b9748f-7228-4117-aae8-ebe2dc575d77.png?w=",
          baseSize: { width: 1040, height: 1517 }
        }],
        isPinned: false,
        isActive: false,
        isUserBlock: false,
        createdBy: 0,
        createdAt: "2025-01-20T10:04:30.000Z",
        updatedAt: "2025-01-20T10:04:30.000Z"
      },
      {
        messageId: "msg_006",
        userId: userId,
        name: "DD.Hakka",
        photo: "https://sprofile.line-scdn.net/0hF-rakWjqGQJfGAej18FnPC9IGmh8aUAQdX1eND9NT2Fmf1xVcSkFYz1PEDphIAoDd34GbGseQjV9QwcTCiQuLxhYKTA6LABVCH80IGp4BEkAbRoLEXw_JxVnT21rcigjLSxRAi8aTlw2QwAyGx00DwhsMDAnfj0GD091VFoqd4EwGm5Xcn9QbWIZQTDh",
        type: "0",
        message: "",
        content: {
          text: "I've sent you a screenshot showing the login process. Please try using the 'Forgot Password' link if you're still having trouble.",
          type: "text" as const
        },
        isPinned: false,
        isActive: false,
        isUserBlock: false,
        createdBy: 0,
        createdAt: "2025-01-20T10:05:00.000Z",
        updatedAt: "2025-01-20T10:05:00.000Z"
      },
      {
        messageId: "msg_007",
        userId: userId,
        name: "DD.Hakka",
        photo: "https://sprofile.line-scdn.net/0hF-rakWjqGQJfGAej18FnPC9IGmh8aUAQdX1eND9NT2Fmf1xVcSkFYz1PEDphIAoDd34GbGseQjV9QwcTCiQuLxhYKTA6LABVCH80IGp4BEkAbRoLEXw_JxVnT21rcigjLSxRAi8aTlw2QwAyGx00DwhsMDAnfj0GD091VFoqd4EwGm5Xcn9QbWIZQTDh",
        type: "0",
        message: "",
        content: {
          type: "image" as const,
          previewImageUrl: "https://storage.googleapis.com/hah-staging-bucket/line/461a6bc8-e027-4139-948e-ffe2f5174fc6.jpeg",
          originalContentUrl: "https://storage.googleapis.com/hah-staging-bucket/line/461a6bc8-e027-4139-948e-ffe2f5174fc6.jpeg"
        },
        isPinned: false,
        isActive: false,
        isUserBlock: false,
        createdBy: 0,
        createdAt: "2025-01-20T10:05:30.000Z",
        updatedAt: "2025-01-20T10:05:30.000Z"
      },
      {
        messageId: "msg_008",
        userId: userId,
        name: "User",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        type: "0",
        message: "",
        content: {
          type: "sticker" as const,
          packageId: "1",
          stickerId: "10"
        },
        isPinned: false,
        isActive: false,
        isUserBlock: false,
        createdBy: 1,
        createdAt: "2025-01-20T10:06:00.000Z",
        updatedAt: "2025-01-20T10:06:00.000Z"
      },
      {
        messageId: "msg_009",
        userId: userId,
        name: "User",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        type: "0",
        message: "",
        content: {
          text: "Thank you! That worked perfectly. I was able to reset my password and log in successfully.",
          type: "text" as const
        },
        isPinned: false,
        isActive: false,
        isUserBlock: false,
        createdBy: 1,
        createdAt: "2025-01-20T10:07:00.000Z",
        updatedAt: "2025-01-20T10:07:00.000Z"
      },
      {
        messageId: "msg_010",
        userId: userId,
        name: "DD.Hakka",
        photo: "https://sprofile.line-scdn.net/0hF-rakWjqGQJfGAej18FnPC9IGmh8aUAQdX1eND9NT2Fmf1xVcSkFYz1PEDphIAoDd34GbGseQjV9QwcTCiQuLxhYKTA6LABVCH80IGp4BEkAbRoLEXw_JxVnT21rcigjLSxRAi8aTlw2QwAyGx00DwhsMDAnfj0GD091VFoqd4EwGm5Xcn9QbWIZQTDh",
        type: "0",
        message: "",
        content: {
          type: "flex" as const,
          altText: "Great! I'm glad I could help you resolve the login issue. Is there anything else I can assist you with today?",
          contents: {}
        },
        isPinned: false,
        isActive: false,
        isUserBlock: false,
        createdBy: 0,
        createdAt: "2025-01-20T10:08:00.000Z",
        updatedAt: "2025-01-20T10:08:00.000Z"
      },
      {
        messageId: "msg_011",
        userId: userId,
        name: "User",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        type: "0",
        message: "",
        content: {
          text: "No, that's all for now. Thanks for the excellent support!",
          type: "text" as const
        },
        isPinned: false,
        isActive: false,
        isUserBlock: false,
        createdBy: 1,
        createdAt: "2025-01-20T10:09:00.000Z",
        updatedAt: "2025-01-20T10:09:00.000Z"
      }
    ];

    // Simulate pagination - return messages in chronological order
    // For chat applications, we typically load recent messages first, then load older messages when scrolling up
    // So we reverse the array and paginate from the end (most recent messages first on initial load)
    const totalMessages = allMockMessages.length;
    const reversedMessages = [...allMockMessages].reverse(); // Most recent first

    const start = offset;
    const end = Math.min(start + limit, totalMessages);
    const paginatedData = reversedMessages.slice(start, end);

    // For display, we need to reverse again so oldest appears at top, newest at bottom
    const displayMessages = [...paginatedData].reverse();

    console.log(`[API] Mock data response: ${displayMessages.length} messages, offset=${offset}, hasMore=${end < totalMessages}`);

    return {
      status: {
        code: 200,
        message: ["Success"]
      },
      data: displayMessages,
      hasMoreChat: end < totalMessages
    };
  }
}
