import * as React from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { getUserNotifications, markNotificationsAsRead } from '@/app/notifications/actions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Notification = {
    id: string;
    title: string;
    message: string;
    created_at: string;
    read: boolean;
    link_to?: string;
    type: string;
};

export function NotificationsDropdown() {
    const router = useRouter();
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [hasMore, setHasMore] = React.useState(true);
    const pageSize = 5;

    const fetchNotifications = React.useCallback(async () => {
        try {
            const data = await getUserNotifications();
            if (data) {
                setNotifications(data.slice(0, page * pageSize));
                setUnreadCount(data.filter(n => !n.read).length);
                setHasMore(data.length > page * pageSize);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    React.useEffect(() => {
        fetchNotifications();
        
        // Set up real-time subscription for new notifications
        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications'
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [fetchNotifications]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markNotificationsAsRead([notification.id]);
            setNotifications(prev => 
                prev.map(n => 
                    n.id === notification.id ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        if (notification.link_to) {
            router.push(notification.link_to);
        }
    };

    const loadMore = () => {
        setPage(prev => prev + 1);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'appointment_created':
                return '🆕';
            case 'appointment_updated':
                return '📝';
            case 'appointment_cancelled':
                return '❌';
            case 'appointment_reminder':
                return '⏰';
            default:
                return '📫';
        }
    };

    const formatDate = (date: string) => {
        return format(new Date(date), "d 'de' MMMM 'a las' HH:mm", { locale: es });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 p-0">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px]">
                <ScrollArea className="h-[300px]">
                    <div className="p-2">
                        <h4 className="mb-4 text-sm font-medium">Notificaciones</h4>
                        {isLoading ? (
                            <div className="flex items-center justify-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="space-y-2">
                                {notifications.map((notification) => (
                                    <DropdownMenuItem
                                        key={notification.id}
                                        className={`flex flex-col items-start p-3 cursor-pointer ${
                                            !notification.read ? 'bg-accent/50' : ''
                                        }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start gap-2 w-full">
                                            <span className="text-lg">
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{notification.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(notification.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                                {hasMore && (
                                    <Button
                                        variant="ghost"
                                        className="w-full mt-2"
                                        onClick={loadMore}
                                    >
                                        Cargar más
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-muted-foreground p-4">
                                No hay notificaciones
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
