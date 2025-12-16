import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from '@/bootstrap';

export default function NotificationsIndex({ notifications: initialNotifications = [], unreadCount: initialUnreadCount = 0, typeCounts = {} }) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'friend_request', 'message', 'blood_request', 'emergency'
    const [isLoading, setIsLoading] = useState(false);

    // Fetch notifications
    const fetchNotifications = async () => {
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
    };

    // Poll for new notifications every 10 seconds
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    // Mark notification as read
    const markAsRead = async (notificationId) => {
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
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const response = await axios.post(route('notifications.read-all'));
            if (response.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
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
    };

    // Get notification icon
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'friend_request':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                );
            case 'message':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                );
            case 'blood_request':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                );
            case 'emergency':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                );
        }
    };

    // Get notification type color
    const getNotificationTypeColor = (type) => {
        switch (type) {
            case 'friend_request':
                return 'from-blue-500 to-indigo-600';
            case 'message':
                return 'from-green-500 to-emerald-600';
            case 'blood_request':
                return 'from-red-500 to-rose-600';
            case 'emergency':
                return 'from-cyan-600 via-teal-500 to-blue-600';
            default:
                return 'from-gray-500 to-gray-600';
        }
    };

    // Get notification type label
    const getNotificationTypeLabel = (type) => {
        switch (type) {
            case 'friend_request':
                return 'Friend Request';
            case 'message':
                return 'New Message';
            case 'blood_request':
                return 'Blood Request';
            case 'emergency':
                return 'Emergency Alert';
            default:
                return 'Notification';
        }
    };

    // Get notification link
    const getNotificationLink = (notification) => {
        if (notification.data?.link) {
            return notification.data.link;
        }
        switch (notification.type) {
            case 'friend_request':
                return route('friends.index');
            case 'message':
                return notification.data?.sender_id ? route('chat.show', notification.data.sender_id) : route('chat.index');
            case 'blood_request':
                return notification.data?.request_id 
                    ? route('blood-donation.requests')
                    : route('blood-donation.requests');
            case 'emergency':
                return notification.data?.emergency_id 
                    ? route('emergency.show', notification.data.emergency_id)
                    : route('emergency.index');
            default:
                return '#';
        }
    };

    // Format time ago
    const formatTimeAgo = (dateString) => {
        if (!dateString) return 'Just now';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    // Handle notification click - navigate to detail page
    const handleNotificationClick = (notification) => {
        // Mark as read if not already read
        if (!notification.read) {
            markAsRead(notification.id);
        }
        
        // Navigate to notification detail page
        router.visit(route('notifications.show', notification.id));
    };

    // Filter notifications
    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notification.read;
        return notification.type === filter;
    });

    const filterTabs = [
        { key: 'all', label: 'All', count: typeCounts.all || 0 },
        { key: 'unread', label: 'Unread', count: typeCounts.unread || 0 },
        { key: 'friend_request', label: 'Friends', count: typeCounts.friend_request || 0 },
        { key: 'message', label: 'Messages', count: typeCounts.message || 0 },
        { key: 'blood_request', label: 'Blood', count: typeCounts.blood_request || 0 },
        { key: 'emergency', label: 'Emergency', count: typeCounts.emergency || 0 },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-500 to-blue-600 p-6 shadow-xl">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white blur-3xl"></div>
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-lg ring-2 ring-white/30">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white">Notifications</h2>
                                <p className="text-sm text-cyan-100/80 mt-1">
                                    {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                                </p>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-medium text-sm"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Notifications" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Filter Tabs */}
                    <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                        <div className="flex items-center gap-2 overflow-x-auto">
                            {filterTabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                                        filter === tab.key
                                            ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                            filter === tab.key
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                                <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p className="text-gray-500 font-medium">No notifications found</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {filter === 'unread' ? 'You\'re all caught up!' : 'Try selecting a different filter'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-5 hover:bg-gray-50 transition-colors cursor-pointer ${
                                            !notification.read ? 'bg-cyan-50/50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${getNotificationTypeColor(notification.type)} text-white shadow-md`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className={`text-base font-semibold ${
                                                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                                                            }`}>
                                                                {notification.title}
                                                            </h3>
                                                            {!notification.read && (
                                                                <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className="text-xs text-gray-400">
                                                                {notification.time_ago || formatTimeAgo(notification.created_at)}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                                notification.type === 'friend_request' ? 'bg-blue-100 text-blue-700' :
                                                                notification.type === 'message' ? 'bg-green-100 text-green-700' :
                                                                notification.type === 'blood_request' ? 'bg-red-100 text-red-700' :
                                                                notification.type === 'emergency' ? 'bg-cyan-100 text-cyan-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                                {getNotificationTypeLabel(notification.type)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(notification.id);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete notification"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

