When user click on individual screen current version call to endpoint "http://127.0.0.1:8080/v1/api/case/individual"

response
{
    "status": {
        "code": 200,
        "message": [
            "Success"
        ]
    },
    "data": [
        {
            "messageId": "009927fc-8448-4f73-b34f-29fddaa4209d",
            "userId": "cd7f7895-bf28-49b5-b874-9826372ff045",
            "name": "DD.Hakka",
            "photo": "https://sprofile.line-scdn.net/0hF-rakWjqGQJfGAej18FnPC9IGmh8aUAQdX1eND9NT2Fmf1xVcSkFYz1PEDphIAoDd34GbGseQjV9QwcTCiQuLxhYKTA6LABVCH80IGp4BEkAbRoLEXw_JxVnT21rcigjLSxRAi8aTlw2QwAyGx00DwhsMDAnfj0GD091VFoqd4EwGm5Xcn9QbWIZQTDh",
            "type": "0",
            "message": "",
            "content": {
                "stage": {
                    "chat": {
                        "type": 0,
                        "content": "(funny Moon)(funny Moon)",
                        "category": "Info",
                        "packageId": null,
                        "stickerId": null
                    },
                    "type": 1
                },
                "payload": {
                    "text": "(funny Moon)(funny Moon)",
                    "type": "text"
                }
            },
            "isPinned": false,
            "isActive": false,
            "isUserBlock": false,
            "createdBy": 0,
            "createdAt": "2025-10-08T14:37:39.817155+07:00",
            "updatedAt": "2025-10-08T14:37:39.817155+07:00"
        }
    ],
    "hasMoreChat": true
}

in current version bubble chat display message from content any type I will change to use content.payload to display in bubble case eg content.payload.type

## CHANGES IMPLEMENTED:

### 1. Updated MessageBubble Component (src/components/MessageBubble.tsx)
- Modified `renderContent` function to prioritize `content.payload` over direct `content` properties
- For text messages: Now displays `displayContent.text` (from payload) with fallback to `content.text`
- For all message types: Updated to use payload structure when available
- Maintains backward compatibility with existing message formats

### 2. Updated TypeScript Types (src/types/chat.ts)
- Enhanced `MessageContent` interface to include:
  - `payload?: { text?: string; type: string; }` - Main content payload structure
  - `stage?: { chat?: {...}, type: number }` - Stage information from API
- Maintains all existing properties for backward compatibility

### 3. Updated IndividualChat Component (src/components/IndividualChat.tsx)
- Modified WebSocket message handling to create proper payload structure
- When creating messages from WebSocket data, now includes both payload and fallback content

### 4. Updated Mock Data (src/lib/api.ts)
- Updated sample messages to match real API structure with payload and stage properties
- Ensures testing shows the new payload-based display

### KEY FEATURES:
- **Payload Priority**: Chat bubbles now display `content.payload.text` first, falling back to `content.text`
- **Type Safety**: Proper TypeScript interfaces for the nested payload structure
- **Backward Compatibility**: Works with both new payload format and legacy content format
- **WebSocket Support**: Real-time messages properly formatted with payload structure

### RESULT:
Individual chat now displays messages using `content.payload` as specified in the API response structure, while maintaining compatibility with existing message formats.
