"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Building, BarChartBig, Lightbulb, Settings, School } from 'lucide-react'; // Added School icon
import { cn } from '@/lib/utils';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/institutions', label: 'Institutions', icon: School }, // New Item
  { href: '/local-seo', label: 'Local SEO', icon: MapPin },
  { href: '/gmb-optimizer', label: 'GMB Optimizer', icon: Building },
  { href: '/performance-marketing', label: 'Performance Marketing', icon: BarChartBig },
  { href: '/content-ideas', label: 'Content Ideas', icon: Lightbulb },
  // { href: '/settings', label: 'Settings', icon: Settings }, // Example for future use
];

export default function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 px-2 py-4">
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              tooltip={{ children: item.label, className: "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" }}
              className={cn(
                "justify-start",
                (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
              )}
            >
              <Link href={item.href}>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
