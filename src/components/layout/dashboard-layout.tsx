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
  Circle,
  X,
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
import { SmileSysLogoDynamic } from '../icons/smilesys-logo-dynamic';
import { useTheme } from 'next-themes';
import { Switch } from '../ui/switch';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';
import { getAppointments } from '@/app/appointments/actions';
import { startOfToday, format, differenceInMinutes, parse } from 'date-fns';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { useUserData } from '@/context/UserDataProvider';
// import { useDebounce } from '@/hooks/use-mobile'; // reutilizamos hook simple si existe, si no, ignorar


type DashboardLayoutProps = {
  children: React.ReactNode;
};

type Appointment = Awaited<ReturnType<typeof getAppointments>>[0];
// Define a type for your notifications
type Notification = {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    link_to?: string;
    user_id: string;
};


const allNavItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'doctor', 'staff'] },
  { href: '/patients', icon: Users, label: 'Pacientes', roles: ['admin', 'doctor', 'staff'] },
  { href: '/appointments', icon: Calendar, label: 'Citas', roles: ['admin', 'doctor', 'staff'] },
  { href: '/inventory', icon: Package, label: 'Inventario', roles: ['admin', 'doctor'] },
  { href: '/billing', icon: CreditCard, label: 'Facturación', roles: ['admin', 'doctor'] },
  { href: '/reports', icon: LineChart, label: 'Reportes', roles: ['admin'] },
];

const bottomNavItems = [{ href: '/settings', icon: Settings, label: 'Ajustes', roles: ['admin', 'doctor', 'staff'] }];

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
  const { userData, isLoading } = useUserData();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [remindersToDismiss, setRemindersToDismiss] = React.useState<string[]>([]);
  const [globalSearch, setGlobalSearch] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);
  
  // Real-time notifications and reminders
  React.useEffect(() => {
    const supabase = createClient();

    // 1. Fetch initial notifications
    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (data) setNotifications(data);
        }
    };
    fetchNotifications();

    // 2. Listen for new notifications in real-time
    const notificationsChannel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        (payload) => {
          // Check if the notification is for the current user
          if ((payload.new as Notification).user_id === userData?.user?.id) {
             setNotifications(currentNotifications => [
                payload.new as Notification, 
                ...currentNotifications
             ]);
          }
        }
      )
      .subscribe();
      
    // 3. Reminder logic
    let reminderInterval: NodeJS.Timeout;

    const checkAppointmentsForReminders = async () => {
        const today = startOfToday();
        const todayString = format(today, 'yyyy-MM-dd');
        const appointmentsToday = await getAppointments({
            startDate: todayString,
            endDate: todayString,
        });

        const now = new Date();
        appointmentsToday.forEach(app => {
             if (remindersToDismiss.includes(app.id)) return;

            const appTime = parse(app.time, 'HH:mm', new Date(app.date.replace(/-/g, '/')));
            const diff = differenceInMinutes(appTime, now);

            if (diff > 0 && diff <= 5) {
                const toastId = `reminder-${app.id}`;
                 hotToast((t) => (
                    <div className="flex items-center justify-between w-full">
                        <div className="flex-1">
                            <p className="font-bold">Recordatorio de Cita</p>
                            <p>Tu cita con {app.patientName} empieza en {diff} minuto(s).</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => {
                            setRemindersToDismiss(prev => [...prev, app.id]);
                            hotToast.dismiss(t.id);
                        }}><X className="h-4 w-4" /></Button>
                    </div>
                 ), {
                    id: toastId, // Use a unique ID to prevent duplicates
                    duration: 60000 // 1 minute
                 });
            }
        });
    };
    
    checkAppointmentsForReminders(); // Check immediately on load
    reminderInterval = setInterval(checkAppointmentsForReminders, 60000);
    
    // Cleanup on unmount
    return () => {
      supabase.removeChannel(notificationsChannel);
      clearInterval(reminderInterval);
    };
  }, [userData?.user?.id, remindersToDismiss]);




  const userRoles = userData?.profile?.roles || [];
  const navItems = allNavItems.filter(item => 
      userRoles.some((userRole: string) => item.roles.includes(userRole))
  );

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

  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  React.useEffect(() => {
    if (!globalSearch) {
      setSearchResults([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(globalSearch)}`);
        if (res.ok) {
          const json = await res.json();
          const flat = [
            ...json.patients,
            ...json.appointments,
            ...json.inventory,
          ];
          setSearchResults(flat);
          setShowResults(true);
        }
      } catch (e) {
        // silent
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [globalSearch]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <Toaster position="bottom-right" />
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
              <SmileSysLogoDynamic size={32} className={cn("h-8 w-8", isExpanded ? "" : "")} />
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
                  <SmileSysLogoDynamic size={20} className="h-5 w-5 transition-all group-hover:scale-110" />
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
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onFocus={() => { if (searchResults.length) setShowResults(true); }}
              onBlur={() => setTimeout(()=> setShowResults(false), 150)}
            />
            {showResults && (globalSearch || isSearching) && (
              <div className="absolute mt-1 w-full rounded-md border bg-popover shadow z-50 max-h-80 overflow-auto text-sm">
                {isSearching && (
                  <div className="p-3 text-muted-foreground">Buscando...</div>
                )}
                {!isSearching && searchResults.length === 0 && (
                  <div className="p-3 text-muted-foreground">Sin resultados</div>
                )}
                {!isSearching && searchResults.map(item => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.type === 'patient' ? `/patients/${item.id}` : item.type === 'appointment' ? '/appointments' : '/inventory'}
                    className="flex items-start gap-2 px-3 py-2 hover:bg-accent"
                  >
                    <span className="font-medium capitalize w-20 shrink-0 text-xs text-muted-foreground">{item.type}</span>
                    <span className="flex-1 truncate">
                      {item.type === 'patient' && item.name}
                      {item.type === 'appointment' && item.summary}
                      {item.type === 'inventory' && `${item.name} (${item.sku || ''})`}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="h-5 w-5" />
                 {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                 )}
                 <span className="sr-only">Ver notificaciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
               {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <DropdownMenuItem key={notification.id} className="flex items-start gap-2">
                            {!notification.is_read && <Circle className="h-2 w-2 mt-1.5 fill-blue-500 text-blue-500" />}
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium">{notification.title}</p>
                                <p className="text-xs text-muted-foreground">{notification.message}</p>
                            </div>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        No tienes notificaciones nuevas.
                    </div>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                {isLoading ? (
                    <Skeleton className="h-8 w-8 rounded-full" />
                ) : (
                    <Avatar>
                      {userData?.profile?.photo_url ? (
                          <AvatarImage src={userData.profile.photo_url} alt="User Avatar" />
                      ) : (
                         <AvatarFallback>
                            {userData?.profile?.first_name?.charAt(0)}
                            {userData?.profile?.last_name?.charAt(0)}
                          </AvatarFallback>
                      )}
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

