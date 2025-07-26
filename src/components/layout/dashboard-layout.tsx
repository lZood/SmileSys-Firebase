'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Home,
  Package,
  PanelLeft,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ToothIcon } from '../icons/tooth-icon';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/patients', icon: Users, label: 'Patients' },
  { href: '/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/billing', icon: DollarSign, label: 'Billing' },
  { href: '/inventory', icon: Package, label: 'Inventory' },
];

const bottomNavItems = [{ href: '/settings', icon: Settings, label: 'Settings' }];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = React.useState(true);

  const isNavItemActive = (href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  };
  
  const SidebarNav = ({ mobile = false }: { mobile?: boolean }) => {
     const navClass = mobile ? 'flex flex-col gap-2 text-lg font-medium' : 'flex flex-col items-start gap-2 px-2 py-4';

    return (
      <TooltipProvider>
        <nav className={cn(navClass, !mobile && !isExpanded && "items-center")}>
        {navItems.map((item) => (
            <React.Fragment key={item.href}>
              {mobile ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
                    isNavItemActive(item.href) && 'text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex h-9 items-center justify-start gap-3 rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8',
                        isNavItemActive(item.href) && 'bg-accent text-accent-foreground',
                        isExpanded ? 'w-full px-3' : 'w-9 justify-center'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className={cn("sr-only", isExpanded && "not-sr-only")}>{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" hidden={isExpanded}>{item.label}</TooltipContent>
                </Tooltip>
              )}
            </React.Fragment>
          ))}
        </nav>
      </TooltipProvider>
    );
  };
  
  const BottomSidebarNav = ({ mobile = false }: { mobile?: boolean }) => {
     const navClass = mobile ? 'flex flex-col gap-2 text-lg font-medium' : 'mt-auto flex flex-col items-start gap-2 px-2 py-4';

    return (
       <TooltipProvider>
        <nav className={cn(navClass, !mobile && !isExpanded && "items-center")}>
        {bottomNavItems.map((item) => (
            <React.Fragment key={item.href}>
              {mobile ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
                    isNavItemActive(item.href) && 'text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex h-9 items-center justify-start gap-3 rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8',
                        isNavItemActive(item.href) && 'bg-accent text-accent-foreground',
                        isExpanded ? 'w-full px-3' : 'w-9 justify-center'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className={cn("sr-only", isExpanded && "not-sr-only")}>{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" hidden={isExpanded}>{item.label}</TooltipContent>
                </Tooltip>
              )}
            </React.Fragment>
          ))}
        </nav>
      </TooltipProvider>
    );
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300",
        isExpanded ? 'w-56' : 'w-20'
        )}>
        <div className={cn(
            "flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6",
            isExpanded ? "justify-between" : "justify-center"
          )}>
            <Link href="/dashboard" className={cn(
                "flex items-center gap-2 font-semibold",
                 !isExpanded && "sr-only"
                )}>
                <ToothIcon className="h-6 w-6 text-primary" />
                <span>SmileSys</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
        </div>
        <SidebarNav />
        <BottomSidebarNav />
      </aside>
      <div className={cn(
        "flex flex-col sm:gap-4 sm:py-4 transition-all duration-300",
        isExpanded ? 'sm:pl-56' : 'sm:pl-20'
        )}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/dashboard"
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                  <ToothIcon className="h-5 w-5 transition-all group-hover:scale-110" />
                  <span className="sr-only">SmileSys</span>
                </Link>
                <SidebarNav mobile={true} />
                <BottomSidebarNav mobile={true} />
              </nav>
            </SheetContent>
          </Sheet>
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                 <span className="sr-only">Toggle notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Appointment reminder sent to J. Doe</DropdownMenuItem>
              <DropdownMenuItem>Low stock warning for "Gloves"</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                <Avatar>
                  <AvatarImage src="https://placehold.co/32x32.png" alt="@user" data-ai-hint="person" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/">Logout</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
