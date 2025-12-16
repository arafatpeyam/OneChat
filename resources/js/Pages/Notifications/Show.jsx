import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from '@/bootstrap';

export default function NotificationShow({ notification: initialNotification }) {
    const [notification, setNotification] = useState(initialNotification);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get notification icon
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'friend_request':
                return (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                );
            case 'message':
                return (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                );
            case 'blood_request':
                return (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                );
            case 'emergency':
                return (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                return route('blood-donation.requests');
            case 'emergency':
                return notification.data?.emergency_id 
                    ? route('emergency.show', notification.data.emergency_id)
                    : route('emergency.index');
            default:
                return '#';
        }
    };

    // Format time
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    // Mark as read
    const markAsRead = async () => {
        if (notification.read) return;
        
        try {
            const response = await axios.post(route('notifications.read', notification.id));
            if (response.data.success) {
                setNotification(prev => ({ ...prev, read: true, read_at: new Date().toISOString() }));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Delete notification
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this notification?')) return;
        
        setIsDeleting(true);
        try {
            const response = await axios.delete(route('notifications.destroy', notification.id));
            if (response.data.success) {
                router.visit(route('notifications.index'));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            alert('Failed to delete notification. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Mark as read on mount
    useEffect(() => {
        if (!notification.read) {
            markAsRead();
        }
    }, []);

    const actionLink = getNotificationLink(notification);

    return (
        <AuthenticatedLayout
            header={
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getNotificationTypeColor(notification.type)} p-6 shadow-xl`}>
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white blur-3xl"></div>
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-lg ring-2 ring-white/30">
                                {getNotificationIcon(notification.type)}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white">{getNotificationTypeLabel(notification.type)}</h2>
                                <p className="text-sm text-white/80 mt-1">{formatTime(notification.created_at)}</p>
                            </div>
                        </div>
                        <Link
                            href={route('notifications.index')}
                            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-medium text-sm cursor-pointer"
                        >
                            Back to Notifications
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Notification: ${notification.title}`} />

            <div className="py-8">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        {/* Status Badge */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`h-3 w-3 rounded-full ${notification.read ? 'bg-gray-300' : 'bg-cyan-500 animate-pulse'}`}></div>
                                    <span className="text-sm font-medium text-gray-700">
                                        {notification.read ? 'Read' : 'Unread'}
                                    </span>
                                    {notification.read_at && (
                                        <span className="text-xs text-gray-400">
                                            • Read {new Date(notification.read_at).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {!notification.read && (
                                        <button
                                            onClick={markAsRead}
                                            className="px-3 py-1.5 text-xs font-medium text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                                        >
                                            Mark as Read
                                        </button>
                                    )}
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className={`bg-gradient-to-r ${getNotificationTypeColor(notification.type)} p-6`}>
                                <h3 className="text-2xl font-bold text-white">{notification.title}</h3>
                                <p className="text-white/90 mt-2 text-sm">Received {formatTime(notification.created_at)}</p>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {/* Message */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Message</h4>
                                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200">
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{notification.message}</p>
                                    </div>
                                </div>

                                {/* Details */}
                                {notification.data && Object.keys(notification.data).length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Details</h4>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                                            {notification.data.sender_name && (
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    <div>
                                                        <span className="text-xs text-gray-500 font-medium">From:</span>
                                                        <p className="text-sm font-semibold text-gray-900">{notification.data.sender_name}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {notification.data.blood_group && (
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    </svg>
                                                    <div>
                                                        <span className="text-xs text-gray-500 font-medium">Blood Group:</span>
                                                        <p className="text-sm font-semibold text-gray-900">{notification.data.blood_group}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {notification.data.urgency && (
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    <div>
                                                        <span className="text-xs text-gray-500 font-medium">Urgency:</span>
                                                        <span className={`ml-2 px-2 py-1 rounded-lg text-xs font-semibold ${
                                                            notification.data.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                                                            notification.data.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {notification.data.urgency.charAt(0).toUpperCase() + notification.data.urgency.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {notification.data.request_id && (
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <div>
                                                        <span className="text-xs text-gray-500 font-medium">Request ID:</span>
                                                        <p className="text-sm font-semibold text-gray-900">#{notification.data.request_id}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {notification.data.emergency_id && (
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    <div>
                                                        <span className="text-xs text-gray-500 font-medium">Emergency ID:</span>
                                                        <p className="text-sm font-semibold text-gray-900">#{notification.data.emergency_id}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        {actionLink && actionLink !== '#' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <button
                                    onClick={() => router.visit(actionLink)}
                                    className={`w-full py-4 px-6 rounded-xl bg-gradient-to-r ${getNotificationTypeColor(notification.type)} text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer`}
                                >
                                    <span>View Related Content</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

