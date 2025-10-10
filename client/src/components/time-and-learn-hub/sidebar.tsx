'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Home, Calendar, BarChart3, Clock, BookOpen, TrendingUp, Menu } from 'lucide-react'

interface TimeLearnSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'schedule', label: 'Schedule Input', icon: Calendar },
  { id: 'visualization', label: 'Schedule Analysis', icon: BarChart3 },
  { id: 'free-time', label: 'Free Time Pockets', icon: Clock },
  { id: 'courses', label: 'Create Course', icon: BookOpen },
  { id: 'progress', label: 'Learning Progress', icon: TrendingUp },
]

export function TimeLearnSidebar({ activeView, onViewChange }: TimeLearnSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <div className="sticky top-0 w-64 bg-white border-r border-gray-200 h-screen">
      <div className="p-6 h-full overflow-y-auto">
        <div className="pt-16 pb-4">
          <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? "primary" : "outline"}
              className={`w-full justify-start text-left pl-4 ${
                activeView === item.id 
                  ? '' 
                  : 'text-gray-700 hover:bg-gray-100 border-0 shadow-none'
              }`}
              onClick={() => {
                onViewChange(item.id)
                setMobileOpen(false)
              }}
            >
              <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="text-left">{item.label}</span>
            </Button>
          )
        })}
          </nav>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* desktop sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* mobile sidebar */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mb-4">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}