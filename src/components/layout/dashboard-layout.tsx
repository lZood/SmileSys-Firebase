
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Home,
  Package,
  PanelLeft,
  Search,
  Settings,
  Users,
  LogOut,
  CreditCard,
  LineChart,
  Moon,
  Sun,
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
import { SmileSysLogo } from '../icons/smilesys-logo';
import { useTheme } from 'next-themes';
import { Switch } from '../ui/switch';
import { createClient } from '@/lib/supabase/client';
import { getUserData } from '@/app/user/actions';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

type UserData = Awaited<ReturnType<typeof getUserData>>;

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/patients', icon: Users, label: 'Pacientes' },
  { href: '/appointments', icon: Calendar, label: 'Citas' },
  { href: '/inventory', icon: Package, label: 'Inventario' },
  { href: '/billing', icon: CreditCard, label: 'Facturación' },
  { href: '/reports', icon: LineChart, label: 'Reportes' },
];

const bottomNavItems = [{ href: '/settings', icon: Settings, label: 'Ajustes' }];

const ThemeSwitcher = ({ inMobileNav = false }: { inMobileNav?: boolean }) => {
    const { theme, setTheme } = useTheme();
    const [isMounted, setIsMounted] = React.useState(false);
    
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    if (inMobileNav) {
        return (
            <div className="flex items-center justify-between gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                <div className="flex items-center gap-4">
                    <Sun className="h-5 w-5" />
                    <span>Claro / Oscuro</span>
                </div>
                <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    aria-label="Cambiar tema"
                />
            </div>
        )
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex h-9 w-full items-center justify-center gap-3 rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8">
                     <Sun className="h-5 w-5" />
                     <Switch
                        id="theme-switcher-desktop"
                        checked={theme === 'dark'}
                        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        aria-label="Cambiar tema"
                    />
                    <Moon className="h-5 w-5" />
                </div>
            </TooltipTrigger>
            <TooltipContent side="right">Cambiar Tema</TooltipContent>
        </Tooltip>
    );
};


export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    getUserData().then(data => {
      setUserData(data);
      setIsLoading(false);
    });
  }, []);

  const isNavItemActive = (href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  };
  
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
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
  
  const BottomNav = ({ mobile = false }: { mobile?: boolean }) => {
    const navClass = mobile ? 'flex flex-col gap-2 text-lg font-medium' : 'mt-auto flex flex-col items-start gap-2 px-2 py-4';
    
    return (
      <TooltipProvider>
        <div className={cn(navClass, !mobile && !isExpanded && "items-center")}>
            <div className="pt-2 w-full">
                {mobile ? <ThemeSwitcher inMobileNav /> : (isExpanded ? <ThemeSwitcher /> : <Tooltip><TooltipTrigger asChild><ThemeSwitcher /></TooltipTrigger><TooltipContent side="right">Cambiar Tema</TooltipContent></Tooltip>)}
            </div>
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
                        'flex h-9 w-full items-center justify-start gap-3 rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8',
                        isNavItemActive(item.href) && 'bg-accent text-accent-foreground',
                         isExpanded ? 'px-3' : 'w-9 justify-center'
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
           

            {mobile ? (
               <button onClick={handleSignOut} className="flex items-center gap-4 px-2.5 text-red-500 hover:text-red-600 w-full">
                  <LogOut className="h-5 w-5" />
                  Cerrar Sesión
               </button>
            ) : (
               <Tooltip>
                  <TooltipTrigger asChild>
                     <button
                      onClick={handleSignOut}
                      className={cn(
                        'flex h-9 w-full items-center justify-start gap-3 rounded-lg text-red-500 hover:text-red-600 transition-colors md:h-8',
                         isExpanded ? 'px-3' : 'w-9 justify-center'
                      )}
                    >
                      <LogOut className="h-5 w-5" />
                      <span className={cn("sr-only", isExpanded && "not-sr-only")}>Cerrar Sesión</span>
                    </button>
                  </TooltipTrigger>
                   <TooltipContent side="right" hidden={isExpanded}>Cerrar Sesión</TooltipContent>
                </Tooltip>
            )}
        </div>
      </TooltipProvider>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300",
        isExpanded ? 'w-56' : 'w-20'
        )}>
        <div className={cn(
            "flex h-14 items-center border-b px-4 lg:h-[60px]",
             isExpanded ? "justify-between" : "justify-center"
          )}>
          <Link href="/dashboard" className={cn(
              "flex items-center gap-2 font-semibold",
              !isExpanded && "justify-center"
            )}>
              {userData?.clinic?.logo_url ? (
                  <Image src={userData.clinic.logo_url} alt="Clinic Logo" width={32} height={32} className="h-8 w-8 rounded-md object-contain" />
              ) : (
                  <SmileSysLogo className={cn("h-8", isExpanded ? "w-8" : "w-8" )} />
              )}
              <span className={cn(isExpanded ? "block" : "hidden")}>SmileSys</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className={cn(!isExpanded && "absolute right-0 top-14 translate-x-1/2 bg-background border rounded-full ")}>
            {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
        <SidebarNav />
        <BottomNav />
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
                <span className="sr-only">Abrir Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/dashboard"
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                  <SmileSysLogo className="h-5 w-5 transition-all group-hover:scale-110" />
                  <span className="sr-only">SmileSys</span>
                </Link>
                <SidebarNav mobile={true} />
                <BottomNav mobile={true} />
              </nav>
            </SheetContent>
          </Sheet>
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                 <span className="sr-only">Ver notificaciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Recordatorio de cita enviado a J. Doe</DropdownMenuItem>
              <DropdownMenuItem>Alerta de stock bajo para "Guantes"</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                {isLoading ? (
                    <Skeleton className="h-8 w-8 rounded-full" />
                ) : (
                    <Avatar>
                      {userData?.clinic?.logo_url ? (
                          <AvatarImage src={userData.clinic.logo_url} alt="Clinic Logo" />
                      ) : (
                          <AvatarImage src="https://placehold.co/32x32.png" alt="@user" data-ai-hint="person" />
                      )}
                      <AvatarFallback>
                        {userData?.profile?.first_name?.charAt(0)}
                        {userData?.profile?.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Ajustes</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Soporte</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-500 hover:!text-red-500">
                Cerrar Sesión
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
