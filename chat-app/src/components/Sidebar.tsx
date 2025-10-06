'use client';

import { MenuType } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, CheckCircle, FolderOpen, X, Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface SidebarProps {
  activeMenu: MenuType;
  onMenuChange: (menu: MenuType) => void;
}

const menuItems = [
  {
    id: 'me' as MenuType,
    label: 'My Case',
    icon: MessageSquare,
    description: 'Your personal cases'
  },
  {
    id: 'finished' as MenuType,
    label: 'Finished Case',
    icon: CheckCircle,
    description: 'Completed cases'
  },
  {
    id: 'all' as MenuType,
    label: 'All Case',
    icon: FolderOpen,
    description: 'All available cases'
  }
];

export default function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleMenuClick = (menu: MenuType) => {
    onMenuChange(menu);
    setIsOpen(false); // Close mobile menu after selection
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-lg border border-gray-200"
      >
        <Menu size={24} className="text-gray-600" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-80 bg-white border-r border-gray-200 h-screen flex flex-col shadow-lg
        lg:relative lg:translate-x-0
        fixed left-0 top-0 z-50 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 relative">
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} className="text-gray-500" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Chat Cases</h1>
          <p className="text-gray-600 text-sm">Manage your conversations</p>
        </div>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="relative">
                {user.picture || user.pictureUrl ? (
                  <Image
                    src={user.picture || user.pictureUrl}
                    alt={user.name || user.displayName}
                    width={40}
                    height={40}
                    className="rounded-full ring-2 ring-white shadow-sm"
                    unoptimized
                    onError={(e) => {
                      // Fallback to default avatar on error
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.name || user.displayName}</p>
                <p className="text-sm text-gray-600 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <Icon 
                    size={20} 
                    className={`${
                      isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                    }`} 
                  />
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${isActive ? 'text-blue-800' : ''}`}>
                      {item.label}
                    </div>
                    <div className={`text-xs ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">💡 Tips</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Scroll down to load more conversations</li>
              <li>• Pull down to refresh data</li>
              <li>• Press F5 or Ctrl+R to refresh</li>
              <li>• Press Home or Ctrl+↑ to scroll to top</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}