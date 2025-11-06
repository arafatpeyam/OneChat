import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import axios from '@/bootstrap';

export default function Dashboard({ stats: initialStats = {} }) {
    const user = usePage().props.auth.user;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stats, setStats] = useState(initialStats);
    const pollingIntervalRef = useRef(null);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch stats in real-time
    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/dashboard/stats');
            if (response.data.success) {
                setStats(prevStats => {
                    // Only update if values changed to avoid unnecessary re-renders
                    const newStats = response.data.stats;
                    if (
                        prevStats.total_users !== newStats.total_users ||
                        prevStats.total_messages !== newStats.total_messages ||
                        prevStats.total_conversations !== newStats.total_conversations ||
                        prevStats.unread_messages !== newStats.unread_messages
                    ) {
                        return newStats;
                    }
                    return prevStats;
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Poll for stats every 5 seconds
    useEffect(() => {
        // Fetch immediately
        fetchStats();
        
        // Then poll every 5 seconds
        pollingIntervalRef.current = setInterval(() => {
            fetchStats();
        }, 5000);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true 
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    // Use useMemo to prevent unnecessary recalculations
    const statCards = useMemo(() => [
        {
            title: 'Total Users',
            value: stats.total_users || 0,
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            gradient: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-50 to-cyan-50',
            textColor: 'text-blue-600',
        },
        {
            title: 'Total Messages',
            value: stats.total_messages || 0,
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            gradient: 'from-purple-500 to-pink-500',
            bgGradient: 'from-purple-50 to-pink-50',
            textColor: 'text-purple-600',
        },
        {
            title: 'Conversations',
            value: stats.total_conversations || 0,
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            ),
            gradient: 'from-indigo-500 to-purple-500',
            bgGradient: 'from-indigo-50 to-purple-50',
            textColor: 'text-indigo-600',
        },
        {
            title: 'Unread Messages',
            value: stats.unread_messages || 0,
            icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
            gradient: 'from-emerald-500 to-teal-500',
            bgGradient: 'from-emerald-50 to-teal-50',
            textColor: 'text-emerald-600',
            badge: stats.unread_messages > 0,
        },
    ], [stats]);

    const quickActions = [
        {
            title: 'Start Chatting',
            description: 'Open your messages and continue conversations',
            icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            href: route('chat.index'),
            gradient: 'from-indigo-600 to-purple-600',
        },
        {
            title: 'Browse Users',
            description: 'Discover and connect with other users',
            icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            href: route('users'),
            gradient: 'from-blue-600 to-cyan-600',
        },
        {
            title: 'Profile Settings',
            description: 'Update your profile and account information',
            icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            href: route('profile.edit'),
            gradient: 'from-purple-600 to-pink-600',
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 shadow-xl">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white blur-3xl"></div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        {/* Left section - User info */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-xl font-bold text-white shadow-lg ring-2 ring-white/30">
                                {getInitials(user.name)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-indigo-100">{getGreeting()},</span>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white">{user.name}</h2>
                                </div>
                                <p className="text-sm text-indigo-100/80 flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {formatDate(currentTime)}
                                </p>
                            </div>
                        </div>

                        {/* Right section - Time and stats */}
                        <div className="flex flex-col md:items-end gap-3">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2.5 text-center ring-1 ring-white/30">
                                    <div className="flex items-center gap-2">
                                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-lg font-bold text-white font-mono">{formatTime(currentTime)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5">
                                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="text-white font-medium">{(stats.total_users || 0).toLocaleString()} Users</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5">
                                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className="text-white font-medium">{(stats.total_messages || 0).toLocaleString()} Messages</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Stats Grid */}
                    <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                        {statCards.map((stat, index) => (
                            <div
                                key={`${stat.title}-${stat.value}`}
                                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                                        <p className="text-3xl font-bold text-gray-900 transition-all duration-300">{stat.value.toLocaleString()}</p>
                                    </div>
                                    <div className={`rounded-xl bg-gradient-to-br ${stat.bgGradient} p-3 ${stat.textColor} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                        {stat.icon}
                                    </div>
                                </div>
                                {stat.badge && stat.value > 0 && (
                                    <div className="absolute top-4 right-4">
                                        <span className="flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid gap-6 md:grid-cols-3">
                            {quickActions.map((action, index) => (
                                <Link
                                    key={index}
                                    href={action.href}
                                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.gradient} p-8 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105`}
                                >
                                    <div className="relative z-10">
                                        <div className="mb-4 inline-flex rounded-xl bg-white/20 backdrop-blur-sm p-3">
                                            {action.icon}
                                        </div>
                                        <h4 className="text-xl font-bold mb-2">{action.title}</h4>
                                        <p className="text-white/80 text-sm">{action.description}</p>
                                        <div className="mt-4 flex items-center text-sm font-medium">
                                            Get started
                                            <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity / Info Cards */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Getting Started Card */}
                        <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-200">
                            <div className="p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 p-3">
                                        <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Getting Started</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                                            <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Account Setup Complete</p>
                                            <p className="text-sm text-gray-500">Your account is ready to use</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                                            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Start Messaging</p>
                                            <p className="text-sm text-gray-500">Connect with other users and start conversations</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Info Card */}
                        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white shadow-lg ring-1 ring-gray-200">
                            <div className="p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 p-3">
                                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">System Status</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Platform</span>
                                        <span className="text-sm font-semibold text-gray-900">One Chat</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Status</span>
                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                            Online
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Real-time Messaging</span>
                                        <span className="text-sm font-semibold text-emerald-600">Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
