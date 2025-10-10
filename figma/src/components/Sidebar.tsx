import React, { useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { 
  Calendar, 
  BarChart3, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  Menu,
  Home
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'schedule', label: 'Schedule Input', icon: Calendar },
  { id: 'visualization', label: 'Time Analysis', icon: BarChart3 },
  { id: 'free-time', label: 'Free Time Pockets', icon: Clock },
  { id: 'courses', label: 'Create Course', icon: BookOpen },
  { id: 'progress', label: 'Learning Progress', icon: TrendingUp },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="p-6 h-full bg-white border-r border-gray-200">
      <div className="mb-8">
        <h1 className="text-xl text-blue-600 mb-2">OneParent Vic</h1>
        <h2 className="text-gray-600">Time & Learn Hub</h2>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeView === item.id 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => {
                onViewChange(item.id);
                setMobileOpen(false);
              }}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:w-64 lg:flex lg:flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg text-blue-600">OneParent Vic</h1>
              <p className="text-sm text-gray-600">Time & Learn Hub</p>
            </div>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
        {/* Spacer for mobile header */}
        <div className="h-20"></div>
      </div>
    </>
  );
}