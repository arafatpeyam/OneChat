import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function UsersIndex({ users = [] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Joined today';
        if (days === 1) return 'Joined yesterday';
        if (days < 7) return `Joined ${days} days ago`;
        if (days < 30) return `Joined ${Math.floor(days / 7)} weeks ago`;
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">All Users</h2>
                        <p className="mt-1 text-sm text-gray-500">Discover and connect with other users</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="rounded-xl bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 px-4 py-2 border border-cyan-100">
                            <p className="text-xs font-medium text-gray-500">Total Users</p>
                            <p className="text-2xl font-bold text-cyan-700">{users.length}</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Users" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Search Bar */}
                    <div className="mb-8">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full rounded-2xl border-2 border-gray-200 bg-white pl-12 pr-4 py-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-sm transition-all duration-200 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 focus:shadow-md"
                            />
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 mb-8 md:grid-cols-3">
                        <div className="rounded-2xl bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 p-6 border border-cyan-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-cyan-700 mb-1">Active Users</p>
                                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                                </div>
                                <div className="rounded-xl bg-cyan-100 p-3">
                                    <svg className="h-6 w-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 p-6 border border-sky-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-sky-700 mb-1">Search Results</p>
                                    <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
                                </div>
                                <div className="rounded-xl bg-sky-100 p-3">
                                    <svg className="h-6 w-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-6 border border-blue-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-700 mb-1">New This Week</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {users.filter(user => {
                                            const joined = new Date(user.joined);
                                            const weekAgo = new Date();
                                            weekAgo.setDate(weekAgo.getDate() - 7);
                                            return joined >= weekAgo;
                                        }).length}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-blue-100 p-3">
                                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Users Grid */}
                    {filteredUsers.length === 0 ? (
                        <div className="rounded-2xl bg-white p-12 text-center shadow-lg ring-1 ring-gray-200">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                                <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No users found</h3>
                            <p className="text-gray-500">
                                {searchTerm
                                    ? `No users match "${searchTerm}"`
                                    : 'No users available'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:ring-cyan-200"
                                >
                                    {/* Gradient Background Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-teal-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:via-teal-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none" />

                                    <div className="relative z-10">
                                        {/* User Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                                <div className="relative flex-shrink-0">
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-500 text-xl font-bold text-white shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform duration-300">
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <span className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white shadow-sm ${
                                                        user.is_online ? 'bg-emerald-500 ring-1 ring-emerald-300' : 'bg-gray-400'
                                                    }`} title={user.is_online ? 'Online' : 'Offline'}></span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-cyan-700 transition-colors">
                                                        {user.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 truncate mt-0.5">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* User Info */}
                                        <div className="mb-4 space-y-2">
                                            <div className="flex items-center text-xs text-gray-500">
                                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {formatDate(user.joined)}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center space-x-2">
                                            <Link
                                                href={route('chat.show', user.id)}
                                                className="flex-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-cyan-500 hover:via-teal-400 hover:to-blue-500 hover:shadow-lg transition-all duration-200 hover:scale-105"
                                            >
                                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                Start Chat
                                            </Link>
                                            <button className="rounded-xl bg-gray-100 px-4 py-3 text-gray-600 hover:bg-gray-200 transition-all duration-200 hover:scale-105">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
