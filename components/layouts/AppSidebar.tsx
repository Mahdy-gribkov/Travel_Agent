'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Home,
  MapPin,
  MessageSquare,
  Calendar,
  Settings,
  HelpCircle,
  BarChart3,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Itineraries', href: '/itineraries', icon: MapPin },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Explore', href: '/explore', icon: Globe },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <nav className="flex flex-col h-full p-4 space-y-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="pt-4 border-t space-y-1">
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
