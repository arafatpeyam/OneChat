import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Link, router } from '@inertiajs/react';
import axios from '@/bootstrap';
import { Transition } from '@headlessui/react';

function NotificationBar({ initialNotifications = [], initialUnreadCount = 0 }) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Fetch notifications - memoized
    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(route('notifications.get'));
            if (response.data.success) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.unread_count);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Poll for new notifications every 15 seconds (increased from 10s)
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Mark notification as read - memoized
    const markAsRead = useCallback(async (notificationId, e) => {
        e?.stopPropagation();
        try {
            const response = await axios.post(route('notifications.read', notificationId));
            if (response.data.success) {
                setNotifications(prev => 
                    prev.map(n => n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    // Mark all as read - memoized
    const markAllAsRead = useCallback(async (e) => {
        e?.stopPropagation();
        try {
            const response = await axios.post(route('notifications.read-all'));
            if (response.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }, []);

    // Delete notification - memoized
    const deleteNotification = useCallback(async (notificationId, e) => {
        e?.stopPropagation();
        try {
            const response = await axios.delete(route('notifications.destroy', notificationId));
            if (response.data.success) {
                const notification = notifications.find(n => n.id === notificationId);
                if (notification && !notification.read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }, []);

    // Get notification icon based on type - memoized
    const getNotificationIcon = useCallback((type) => {
        switch (type) {
            case 'friend_request':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                );
            case 'message':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                );
            case 'blood_request':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                );
            case 'emergency':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                );
        }
    }, []);

    // Handle notification click - navigate to detail page - memoized
    const handleNotificationClick = useCallback((notification, e) => {
        e.preventDefault();
        setIsOpen(false);
        
        // Mark as read if not already read
        if (!notification.read) {
            markAsRead(notification.id);
        }
        
        // Navigate to notification detail page
        router.visit(route('notifications.show', notification.id));
    }, [markAsRead]);

    // Format time ago - memoized
    const formatTimeAgo = useCallback((dateString) => {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // difference in seconds
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }, []);

    // Memoize unread notifications
    const unreadNotifications = useMemo(() => notifications.filter(n => !n.read), [notifications]);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center transform translate-x-1 -translate-y-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <Transition
                show={isOpen}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
            >
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-teal-50">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                                >
                                    Mark all as read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                                <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p className="text-gray-500">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={(e) => handleNotificationClick(notification, e)}
                                        className={`block px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                                            !notification.read ? 'bg-cyan-50/50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 mt-0.5 ${
                                                notification.type === 'friend_request' ? 'text-blue-500' :
                                                notification.type === 'message' ? 'text-green-500' :
                                                notification.type === 'blood_request' ? 'text-red-500' :
                                                notification.type === 'emergency' ? 'text-cyan-500' :
                                                'text-gray-500'
                                            }`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-medium ${
                                                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                                                        }`}>
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {notification.time_ago || formatTimeAgo(notification.created_at)}
                                                        </p>
                                                    </div>
                                                    {!notification.read && (
                                                        <div className="flex-shrink-0">
                                                            <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => deleteNotification(notification.id, e)}
                                                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1"
                                                title="Delete notification"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-center">
                            <Link
                                href={route('notifications.index')}
                                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            </Transition>
        </div>
    );
}

export default memo(NotificationBar);

