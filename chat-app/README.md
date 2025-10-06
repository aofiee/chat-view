# Chat Case Management App

A modern, responsive Next.js application for managing chat cases with beautiful sidebar navigation, infinite scroll functionality, and enhanced user experience features.

## Features

- **Modern Sidebar Navigation**: Three menu options (My Case, Finished Case, All Case)
- **Infinite Scroll**: Automatically loads more data as you scroll
- **🆕 Scroll to Top**: Floating button with smooth animation and keyboard shortcuts
- **🆕 Pull to Refresh**: Mobile-friendly gesture and manual refresh functionality
- **🆕 Keyboard Shortcuts**: Fast navigation with F5, Ctrl+R, Home, Ctrl+↑
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Beautiful UI**: Modern design with Tailwind CSS and Lucide React icons
- **Real-time Loading**: Smooth loading states and error handling
- **API Integration**: Connects to backend API endpoints with fallback to mock data

## New Features Added

### 🔝 Scroll to Top
- **Floating Button**: Appears when scrolled down more than 300px
- **Keyboard Shortcut**: Press `Home` or `Ctrl+↑`
- **Smooth Animation**: Beautiful transitions and hover effects

### 🔄 Pull to Refresh
- **Mobile Gesture**: Pull down from the top to refresh data
- **Manual Button**: Refresh button in the header
- **Keyboard Shortcut**: Press `F5` or `Ctrl+R`
- **Visual Feedback**: Loading indicators and pull progress

### ⌨️ Keyboard Navigation
- `Home` or `Ctrl+↑`: Scroll to top
- `F5` or `Ctrl+R`: Refresh data
- Smart detection (doesn't interfere with typing)

## Menu Options

1. **My Case**: Shows personal cases (`/api/case/me`)
2. **Finished Case**: Shows completed cases (`/api/case/finished`)  
3. **All Case**: Shows all available cases (`/api/case/all`) - Default active menu

## API Endpoints

The app expects the following API endpoints:

- `POST http://127.0.0.1:8080/v1/api/case/all`
- `POST http://127.0.0.1:8080/v1/api/case/me`
- `POST http://127.0.0.1:8080/v1/api/case/finished`

### Request Format
```json
{
  "offset": 0,
  "limit": 10
}
```

### Response Format
```json
{
  "data": [
    {
      "name": "John Doe",
      "message": "Hello, I need help with my account issue.",
      "photo": "https://example.com/avatar.jpg"
    }
  ],
  "hasMoreChat": true
}
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3001`

## Usage Guide

### Navigation
- **Desktop**: Use the always-visible sidebar
- **Mobile**: Tap the hamburger menu to open/close sidebar

### Refreshing Data
- **Pull Gesture**: Pull down from the top (mobile/touch)
- **Manual Button**: Click "Refresh" in the header
- **Keyboard**: Press `F5` or `Ctrl+R`

### Scrolling
- **Infinite Scroll**: Automatically loads more as you scroll down
- **Scroll to Top**: Click the floating button or press `Home`/`Ctrl+↑`

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── globals.css        # Enhanced global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ChatItem.tsx       # Individual chat item
│   ├── ChatList.tsx       # Enhanced chat list with new features
│   └── Sidebar.tsx        # Navigation sidebar with updated tips
├── hooks/                 # 🆕 Custom React hooks
│   └── useKeyboardShortcuts.ts  # Keyboard navigation hook
├── lib/                   # Utilities
│   └── api.ts             # API functions
└── types/                 # TypeScript types
    └── chat.ts            # Chat-related types
```

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icons
- **React Hooks**: State management and effects

## Features Implementation

### Enhanced Infinite Scroll
The app implements intelligent infinite scroll that:
- Loads more data when scrolling near the bottom
- Auto-loads until the container becomes scrollable
- Shows loading indicators and handles errors gracefully
- **New**: Includes scroll-to-top functionality for easy navigation

### Pull-to-Refresh
- **Touch Gesture**: Detects pull-down motion at the top of the list
- **Visual Feedback**: Shows pull distance and release instruction
- **API Integration**: Refreshes data from the current menu's endpoint
- **Fallback**: Manual refresh button for non-touch devices

### Responsive Design
- Mobile-first approach with hamburger menu
- Sidebar slides in/out on mobile devices
- **Enhanced**: Optimized touch interactions and gesture support
- Touch-friendly button sizes and spacing

### Enhanced Error Handling
- Graceful fallback to mock data when API is unavailable
- User-friendly error messages with retry functionality
- **New**: Refresh capabilities to recover from errors

## Mock Data

When the API is not available, the app automatically falls back to mock data to demonstrate functionality. This ensures the app works even during development or when the backend is not running.

## Keyboard Shortcuts Reference

| Action | Shortcut | Alternative |
|--------|----------|-------------|
| Scroll to Top | `Home` | `Ctrl` + `↑` |
| Refresh Data | `F5` | `Ctrl` + `R` |

## Customization

You can easily customize:
- API endpoints in `src/lib/api.ts`
- Styling in `src/app/globals.css` and component files
- Mock data structure for testing
- Menu items and navigation structure
- Keyboard shortcuts in `src/hooks/useKeyboardShortcuts.ts`

## Performance Features

- **Stable Rendering**: No infinite loops or unnecessary re-renders
- **Debounced Loading**: Prevents rapid API calls
- **Efficient State Management**: Uses refs for performance-critical state
- **Smooth Animations**: Hardware-accelerated CSS transitions
