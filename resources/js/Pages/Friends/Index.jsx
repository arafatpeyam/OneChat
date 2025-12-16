import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import axios from '@/bootstrap';

function FriendsIndex() {
    const currentUser = usePage().props.auth.user;
    const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser?.role]);
    const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'pending', 'sent', 'search'
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    useEffect(() => {
        // Load all users when "Find Friends" tab is active
        if (activeTab === 'search') {
            const loadAllUsers = async () => {
                setSearchLoading(true);
                try {
                    const response = await axios.get('/api/friends/search');
                    if (response.data.success) {
                        setSearchResults(response.data.users);
                    }
                } catch (error) {
                    console.error('Error loading users:', error);
                } finally {
                    setSearchLoading(false);
                }
            };
            loadAllUsers();
        }
    }, [activeTab]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'friends') {
                const response = await axios.get('/api/friends/');
                if (response.data.success) {
                    setFriends(response.data.friends);
                }
            } else if (activeTab === 'pending') {
                const response = await axios.get('/api/friends/pending');
                if (response.data.success) {
                    setPendingRequests(response.data.pending_requests);
                }
            } else if (activeTab === 'sent') {
                const response = await axios.get('/api/friends/sent');
                if (response.data.success) {
                    setSentRequests(response.data.sent_requests);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    const handleSearch = useCallback(async (query) => {
        setSearchLoading(true);
        try {
            const url = query.trim() 
                ? `/api/friends/search?query=${encodeURIComponent(query)}`
                : '/api/friends/search';
            const response = await axios.get(url);
            if (response.data.success) {
                setSearchResults(response.data.users);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearchLoading(false);
        }
    }, []);

    const handleSendRequest = useCallback(async (userId) => {
        if (isAdmin) {
            alert('Admins cannot send friend requests. Use the admin panel to manage users.');
            return;
        }

        setSearchResults((prev) =>
            prev.map((user) =>
                user.id === userId
                    ? {
                          ...user,
                          has_pending_request: true,
                          pending_request_sent_by_me: true,
                          pending_request_id: user.pending_request_id || null,
                      }
                    : user
            )
        );

        try {
            const response = await axios.post('/api/friends/send', { receiver_id: userId });
            if (response.data.success) {
                const friendRequestId = response.data.friend_request?.id;
                if (friendRequestId) {
                    setSearchResults((prev) =>
                        prev.map((user) =>
                            user.id === userId
                                ? {
                                      ...user,
                                      pending_request_id: friendRequestId,
                                  }
                                : user
                        )
                    );
                }
                // Refresh sent requests
                if (activeTab === 'sent') {
                    fetchData();
                }
            }
        } catch (error) {
            // Revert optimistic update on failure
            setSearchResults((prev) =>
                prev.map((user) =>
                    user.id === userId
                        ? {
                              ...user,
                              has_pending_request: false,
                              pending_request_id: null,
                              pending_request_sent_by_me: false,
                          }
                        : user
                )
            );
            alert(error.response?.data?.error || 'Failed to send friend request');
        }
    }, [isAdmin, activeTab, fetchData]);

    const handleCancelSearchRequest = useCallback(async (userId, requestId) => {
        try {
            const response = await axios.delete(`/api/friends/${requestId}/cancel`);
            if (response.data.success) {
                setSearchResults((prev) =>
                    prev.map((user) =>
                        user.id === userId
                            ? {
                                  ...user,
                                  has_pending_request: false,
                                  pending_request_id: null,
                                  pending_request_sent_by_me: false,
                              }
                            : user
                    )
                );

                if (activeTab === 'sent') {
                    fetchData();
                }
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to cancel friend request');
        }
    }, [activeTab, fetchData]);

    const refreshSearchResults = useCallback(async () => {
        await handleSearch(searchQuery);
    }, [handleSearch, searchQuery]);

    const handleAccept = useCallback(async (requestId) => {
        try {
            const response = await axios.post(`/api/friends/${requestId}/accept`);
            if (response.data.success) {
                fetchData();
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to accept friend request');
        }
    }, [fetchData]);

    const handleReject = useCallback(async (requestId) => {
        try {
            const response = await axios.post(`/api/friends/${requestId}/reject`);
            if (response.data.success) {
                fetchData();
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to reject friend request');
        }
    }, [fetchData]);

    const handleCancel = useCallback(async (requestId) => {
        try {
            const response = await axios.delete(`/api/friends/${requestId}/cancel`);
            if (response.data.success) {
                fetchData();
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to cancel friend request');
        }
    }, [fetchData]);

    const handleRemove = useCallback(async (requestId) => {
        if (!window.confirm('Are you sure you want to remove this friend?')) {
            return;
        }
        try {
            const response = await axios.delete(`/api/friends/${requestId}/remove`);
            if (response.data.success) {
                fetchData();
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to remove friend');
        }
    }, [fetchData]);

    const getInitials = useCallback((name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }, []);

    const UserCard = memo(({ user, type = 'friend', requestId = null, onSendRequest, onCancelSearchRequest, onAccept, onReject, onCancel, onRemove, isAdmin: isAdminProp, currentUserId }) => {
        return (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                        {user.image ? (
                            <img
                                src={user.image}
                                alt={user.name}
                                className="h-14 w-14 rounded-full object-cover border-2 border-gray-200"
                            />
                        ) : (
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                {getInitials(user.name)}
                            </div>
                        )}
                        <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white shadow-sm ${
                            user.is_online ? 'bg-emerald-500 ring-1 ring-emerald-300' : 'bg-gray-400'
                        }`} title={user.is_online ? 'Online' : 'Offline'}></span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                            {user.blood_group && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-800 border border-red-300">
                                    {user.blood_group}
                                </span>
                            )}
                            {user.city && (
                                <span className="text-xs text-gray-500">📍 {user.city}</span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        {type === 'friend' && (
                            <>
                                <Link
                                    href={route('chat.show', user.id)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                                >
                                    Message
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => onRemove(requestId)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                                >
                                    Remove
                                </button>
                            </>
                        )}
                        {type === 'pending' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onAccept(requestId)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                                >
                                    Accept
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onReject(requestId)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                                >
                                    Reject
                                </button>
                            </>
                        )}
                        {type === 'sent' && (
                            <button
                                type="button"
                                onClick={() => onCancel(requestId)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
                            >
                                Cancel
                            </button>
                        )}
                        {type === 'search' && (
                            <>
                                {user.is_friend ? (
                                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-semibold">
                                        Already Friends
                                    </span>
                                ) : user.has_pending_request ? (
                                    user.pending_request_sent_by_me && user.pending_request_id ? (
                                        <button
                                            type="button"
                                            onClick={() => onCancelSearchRequest(user.id, user.pending_request_id)}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
                                        >
                                            Cancel Request
                                        </button>
                                    ) : (
                                        <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold">
                                            Request Pending
                                        </span>
                                    )
                                ) : (
                                    <>
                                        {!isAdminProp ? (
                                            <button
                                                type="button"
                                                onClick={() => onSendRequest(user.id)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                                            >
                                                Send Request
                                            </button>
                                        ) : (
                                            <Link
                                                href={route('admin.users')}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                                            >
                                                Manage User
                                            </Link>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    });

    return (
        <AuthenticatedLayout>
            <Head title="Friends" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
                        <p className="mt-2 text-gray-600">Manage your friends and friend requests</p>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('friends')}
                                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                                    activeTab === 'friends'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Friends ({friends.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                                    activeTab === 'pending'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Pending Requests ({pendingRequests.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('sent')}
                                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                                    activeTab === 'sent'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Sent Requests ({sentRequests.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('search')}
                                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                                    activeTab === 'search'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Find Friends
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        {loading && activeTab !== 'search' ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="mt-4 text-gray-500">Loading...</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'friends' && (
                                    <div className="space-y-4">
                                        {friends.length === 0 ? (
                                            <div className="text-center py-12">
                                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <p className="mt-4 text-gray-500">No friends yet. Start by searching for friends!</p>
                                            </div>
                                        ) : (
                                            friends.map((friend) => (
                                                <UserCard
                                                    key={friend.id}
                                                    user={friend}
                                                    type="friend"
                                                    requestId={friend.friend_request_id}
                                                    onRemove={handleRemove}
                                                    currentUserId={currentUser.id}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'pending' && (
                                    <div className="space-y-4">
                                        {pendingRequests.length === 0 ? (
                                            <div className="text-center py-12">
                                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="mt-4 text-gray-500">No pending friend requests</p>
                                            </div>
                                        ) : (
                                            pendingRequests.map((request) => (
                                                <UserCard
                                                    key={request.id}
                                                    user={request.sender}
                                                    type="pending"
                                                    requestId={request.id}
                                                    onAccept={handleAccept}
                                                    onReject={handleReject}
                                                    currentUserId={currentUser.id}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'sent' && (
                                    <div className="space-y-4">
                                        {sentRequests.length === 0 ? (
                                            <div className="text-center py-12">
                                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                <p className="mt-4 text-gray-500">No sent friend requests</p>
                                            </div>
                                        ) : (
                                            sentRequests.map((request) => (
                                                <UserCard
                                                    key={request.id}
                                                    user={request.receiver}
                                                    type="sent"
                                                    requestId={request.id}
                                                    onCancel={handleCancel}
                                                    currentUserId={currentUser.id}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'search' && (
                                    <div className="space-y-6">
                                        {/* Search Input */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Search Users
                                            </label>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    handleSearch(e.target.value);
                                                }}
                                                placeholder="Search by name or email..."
                                                className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                                            />
                                        </div>

                                        {/* Search Results */}
                                        {searchLoading ? (
                                            <div className="text-center py-12">
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                <p className="mt-4 text-gray-500">Searching...</p>
                                            </div>
                                        ) : searchResults.length === 0 && searchQuery ? (
                                            <div className="text-center py-12">
                                                <p className="text-gray-500">No users found</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {searchResults.length === 0 && !searchQuery ? (
                                                    <div className="text-center py-12">
                                                        <p className="text-gray-500">Loading all users...</p>
                                                    </div>
                                                ) : (
                                                    searchResults.map((user) => (
                                                        <UserCard
                                                            key={user.id}
                                                            user={user}
                                                            type="search"
                                                            onSendRequest={handleSendRequest}
                                                            onCancelSearchRequest={handleCancelSearchRequest}
                                                            isAdmin={isAdmin}
                                                            currentUserId={currentUser.id}
                                                        />
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

export default FriendsIndex;

