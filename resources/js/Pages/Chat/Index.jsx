import ChatLayout from '@/Layouts/ChatLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import axios from '@/bootstrap'; // Use configured axios instance
import CallModal from '@/components/CallModal';

export default function ChatIndex({ conversations = [], selectedUser = null, messages: initialMessages = [], isFriend: initialIsFriend = true }) {
    const [messages, setMessages] = useState(initialMessages);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCall, setActiveCall] = useState(null);
    const [isFriend, setIsFriend] = useState(initialIsFriend);
    const [friendRequestStatus, setFriendRequestStatus] = useState('none'); // 'none', 'sent', 'received', 'friends'
    const messagesEndRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const callPollingIntervalRef = useRef(null);
    const statusPollingIntervalRef = useRef(null);
    const [conversationsStatus, setConversationsStatus] = useState({});
    const [selectedUserStatus, setSelectedUserStatus] = useState(null);
    const currentUser = usePage().props.auth.user;
    const isAdmin = currentUser?.role === 'admin';

    // Memoize utility functions
    const getInitials = useCallback((name) => {
        if (!name || typeof name !== 'string') return 'U';
        return name
            .split(' ')
            .filter(n => n.length > 0)
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';
    }, []);

    const formatTime = useCallback((dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, []);

    const formatLastSeen = useCallback((dateString, isOnline) => {
        if (isOnline) return 'Active now';
        if (!dateString) return 'Offline';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minutes ago`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
        if (minutes < 10080) return `${Math.floor(minutes / 1440)} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, []);

    const formatMessageTime = useCallback((dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }, []);

    const isMyMessage = useCallback((msg) => msg.sender_id === currentUser?.id, [currentUser?.id]);

    // Check friend request status
    const checkFriendRequestStatus = useCallback(async (userId) => {
        if (!userId) return;
        
        try {
            const response = await axios.get(`/api/friends/status/${userId}`);
            if (response.data.success) {
                const status = response.data.status;
                setFriendRequestStatus(status);
                setIsFriend(status === 'friends');
            }
        } catch (error) {
            console.error('Error checking friend request status:', error);
            setFriendRequestStatus('none');
            setIsFriend(false);
        }
    }, []);

    // Fetch messages from API
    const fetchMessages = useCallback(async (userId) => {
        if (!userId) return;
        
        try {
            const response = await axios.get(`/api/messages/${userId}`);
            if (response.data.success) {
                // Merge with existing messages to preserve optimistic updates
                setMessages(prev => {
                    // Get optimistic messages (those with temp IDs)
                    const optimisticMessages = prev.filter(m => String(m.id).startsWith('temp-'));
                    
                    // Merge: keep optimistic messages and add/update real messages
                    const realMessages = response.data.messages || [];
                    const realMessageIds = new Set(realMessages.map(m => m.id));
                    
                    // Keep optimistic messages that don't have a real counterpart yet
                    const stillOptimistic = optimisticMessages.filter(m => {
                        // Check if this optimistic message has been confirmed by server
                        return !realMessages.some(rm => 
                            rm.sender_id === m.sender_id && 
                            rm.receiver_id === m.receiver_id && 
                            rm.message === m.message &&
                            // Check if created within last 10 seconds (likely the same message)
                            Math.abs(new Date(rm.created_at) - new Date(m.created_at)) < 10000
                        );
                    });
                    
                    // Combine: real messages + still-optimistic messages
                    const allMessages = [...realMessages, ...stillOptimistic];
                    
                    // Sort by created_at
                    return allMessages.sort((a, b) => 
                        new Date(a.created_at) - new Date(b.created_at)
                    );
                });
                setIsFriend(true);
                setFriendRequestStatus('friends');
            }
        } catch (error) {
            if (error.response?.status === 403) {
                setIsFriend(false);
                setMessages([]);
                // Check friend request status when not friends
                checkFriendRequestStatus(userId);
            } else {
            console.error('Error fetching messages:', error);
            }
        }
    }, [checkFriendRequestStatus]);

    // Start polling for new messages when a user is selected - Optimized polling interval
    useEffect(() => {
        if (selectedUser) {
            setIsFriend(initialIsFriend);
            setFriendRequestStatus('none');
            checkFriendRequestStatus(selectedUser.id);
            fetchMessages(selectedUser.id);

            // Increased from 2s to 3s to reduce server load
            pollingIntervalRef.current = setInterval(() => {
                fetchMessages(selectedUser.id);
            }, 3000);

            return () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }
            };
        }
    }, [selectedUser, initialIsFriend]);

    // Poll for active calls
    useEffect(() => {
        let isMounted = true;

        const checkActiveCall = async () => {
            try {
                const response = await axios.get('/api/calls/active');
                if (!isMounted) return;

                if (response.data.success && response.data.call) {
                    setActiveCall(prevCall => {
                        // Only update if call changed or doesn't exist
                        if (!prevCall || prevCall.id !== response.data.call.id) {
                            return response.data.call;
                        }
                        // Update call status if it changed
                        if (prevCall.status !== response.data.call.status) {
                            return response.data.call;
                        }
                        return prevCall;
                    });
                } else {
                    // Only clear if we had an active call
                    setActiveCall(prevCall => {
                        if (prevCall) {
                            return null;
                        }
                        return prevCall;
                    });
                }
            } catch (error) {
                console.error('Error checking active call:', error);
            }
        };

        // Check immediately
        checkActiveCall();

        // Increased from 1.5s to 2s to reduce server load
        callPollingIntervalRef.current = setInterval(checkActiveCall, 2000);

        return () => {
            isMounted = false;
            if (callPollingIntervalRef.current) {
                clearInterval(callPollingIntervalRef.current);
            }
        };
    }, []);

    // Poll for online status updates
    useEffect(() => {
        const updateConversationsStatus = async () => {
            try {
                const response = await axios.get('/api/chat/status/conversations');
                if (response.data.success) {
                    const statusMap = {};
                    response.data.conversations.forEach(conv => {
                        statusMap[conv.id] = {
                            is_online: conv.is_online,
                            last_seen_at: conv.last_seen_at,
                        };
                    });
                    setConversationsStatus(statusMap);
                }
            } catch (error) {
                console.error('Error updating conversations status:', error);
            }
        };

        const updateSelectedUserStatus = async () => {
            if (!selectedUser) return;
            
            try {
                const response = await axios.get(`/api/chat/status/user/${selectedUser.id}`);
                if (response.data.success) {
                    setSelectedUserStatus({
                        is_online: response.data.user.is_online,
                        last_seen_at: response.data.user.last_seen_at,
                    });
                }
            } catch (error) {
                console.error('Error updating selected user status:', error);
            }
        };

        // Update immediately
        updateConversationsStatus();
        updateSelectedUserStatus();

        // Poll every 15 seconds for online status updates (increased from 10s)
        statusPollingIntervalRef.current = setInterval(() => {
            updateConversationsStatus();
            updateSelectedUserStatus();
        }, 15000);

        return () => {
            if (statusPollingIntervalRef.current) {
                clearInterval(statusPollingIntervalRef.current);
            }
        };
    }, [selectedUser]);

    // Initialize conversations status from initial data
    useEffect(() => {
        if (conversations && conversations.length > 0) {
            const initialStatus = {};
            conversations.forEach(conv => {
                if (conv.id && conv.is_online !== undefined) {
                    initialStatus[conv.id] = {
                        is_online: conv.is_online,
                        last_seen_at: conv.last_seen_at,
                    };
                }
            });
            setConversationsStatus(prev => ({ ...prev, ...initialStatus }));
        }
    }, [conversations]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = useCallback(async (e) => {
        e.preventDefault();
        
        if (!message.trim() || !selectedUser || isSending) {
            return;
        }

        const messageText = message.trim();
        const tempId = `temp-${Date.now()}`;
        
        // Optimistic update: Add message immediately to UI for instant feedback
        const optimisticMessage = {
            id: tempId,
            sender_id: currentUser.id,
            receiver_id: selectedUser.id,
            message: messageText,
            created_at: new Date().toISOString(),
        };
        
        // Clear input and add message immediately for instant feedback
        setMessage('');
        setMessages(prev => [...prev, optimisticMessage]);
        
        // Don't set isSending to true - let the message appear instantly
        // The button will be enabled immediately so user can send another message

        // Send message in background without blocking UI
        (async () => {
            try {
                // Get CSRF token to ensure it's available
                const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content;
                if (!csrfToken) {
                    alert('CSRF token not found. Please refresh the page and try again.');
                    setMessage(messageText);
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                    return;
                }
                
                const response = await axios.post('/api/messages/send', {
                    receiver_id: selectedUser.id,
                    message: messageText,
                }, {
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    timeout: 5000, // 5 second timeout to prevent hanging
                });

                if (response.data.success) {
                    // Replace optimistic message with real one silently
                    setMessages(prev => {
                        const filtered = prev.filter(m => m.id !== tempId);
                        return [...filtered, response.data.message];
                    });
                } else {
                    // Only show error if message failed
                    alert('Failed to send message. Please try again.');
                    setMessage(messageText);
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                }
            } catch (error) {
                // Only show error for critical failures
                if (error.code === 'ECONNABORTED') {
                    // Timeout - message might have been sent, don't remove it
                    console.warn('Request timeout, but message may have been sent');
                } else if (error.response?.status === 403) {
                    // Not friends - remove message and show error
                    setIsFriend(false);
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                    setMessage(messageText);
                    const errorMessage = error.response?.data?.error || 'You can only send messages to your friends.';
                    alert(errorMessage);
                } else if (error.response?.status === 419) {
                    alert('CSRF token expired. Please refresh the page and try again.');
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                    setMessage(messageText);
                } else if (error.response?.status === 401) {
                    alert('You are not authenticated. Please log in again.');
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                    setMessage(messageText);
                } else {
                    // For other errors, silently try to replace with real message
                    // The polling will eventually sync the correct state
                    console.error('Message send error:', error);
                }
            }
        })();
    }, [message, selectedUser, isSending, currentUser, conversations]);

    const handleStartCall = useCallback(async (callType = 'audio') => {
        if (!selectedUser) return;

        // Check if users are friends
        if (!isFriend) {
            alert('You can only call your friends. Please send a friend request first.');
            return;
        }

        try {
            const response = await axios.post('/api/calls/initiate', {
                receiver_id: selectedUser.id,
                type: callType,
            });

            if (response.data.success) {
                setActiveCall(response.data.call);
            } else {
                alert('Failed to start call. Please try again.');
            }
        } catch (error) {
            console.error('Error starting call:', error);
            if (error.response?.status === 403) {
                setIsFriend(false);
                const errorMessage = error.response?.data?.error || 'You can only call your friends.';
                alert(errorMessage);
            } else {
            const errorMessage = error.response?.data?.error || 'Failed to start call. Please try again.';
            alert(errorMessage);
            }
        }
    }, [selectedUser, isFriend]);

    const handleEndCall = useCallback(() => {
        setActiveCall(null);
    }, []);

    const handleAcceptCall = useCallback(() => {
        // Call is accepted via CallModal
    }, []);

    const handleRejectCall = useCallback(() => {
        setActiveCall(null);
    }, []);

    // Memoize filtered conversations to prevent unnecessary recalculations
    const filteredConversations = useMemo(() => {
        if (!searchTerm.trim()) return conversations;
        const lowerSearch = searchTerm.toLowerCase();
        return conversations.filter(conv =>
            conv.name?.toLowerCase().includes(lowerSearch) ||
            conv.email?.toLowerCase().includes(lowerSearch)
        );
    }, [conversations, searchTerm]);

    // Memoize conversation item component
    const ConversationItem = memo(({ conversation, isActive, currentUserId }) => {
        const isUnread = conversation.unread_count > 0;
        const status = conversationsStatus[conversation.id];
        const isOnline = status !== undefined ? (status.is_online ?? false) : (conversation.is_online ?? false);

        return (
            <Link
                href={route('chat.show', conversation.id)}
                className={`flex items-center space-x-3 p-4 hover:bg-cyan-50/60 transition-colors ${
                    isActive ? 'bg-cyan-50 border-r-2 border-cyan-600' : ''
                }`}
            >
                <div className="relative flex-shrink-0">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-500 text-sm font-bold text-white ${
                        isActive ? 'ring-2 ring-cyan-600 ring-offset-2' : ''
                    }`}>
                        {getInitials(conversation.name)}
                    </div>
                    <span 
                        className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white shadow-sm z-10 ${
                            isOnline ? 'bg-emerald-500 ring-1 ring-emerald-300' : 'bg-gray-400'
                        }`} 
                        title={isOnline ? 'Online' : 'Offline'}
                        style={{ display: 'block', minWidth: '16px', minHeight: '16px' }}
                    ></span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold truncate ${
                            isUnread ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                            {conversation.name}
                        </p>
                        {conversation.last_message && (
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                {formatTime(conversation.last_message.created_at)}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <p className={`text-sm truncate ${
                            isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}>
                            {conversation.last_message ? (
                                conversation.last_message.sender_id === currentUserId ? (
                                    `You: ${conversation.last_message.message}`
                                ) : (
                                    conversation.last_message.message
                                )
                            ) : (
                                'No messages yet'
                            )}
                        </p>
                        {isUnread && (
                            <span className="ml-2 flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-cyan-600 text-white text-xs font-bold">
                                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        );
    });

    return (
        <ChatLayout>
            <Head title="Chat" />
            
            <div className="flex h-full">
                {/* Sidebar - Conversations List */}
                <div className="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-gray-500 font-medium">No conversations found</p>
                                <p className="text-sm text-gray-400 mt-1">Start chatting with someone!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredConversations.map((conversation) => (
                                    <ConversationItem
                                        key={conversation.id}
                                        conversation={conversation}
                                        isActive={selectedUser?.id === conversation.id}
                                        currentUserId={currentUser.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-gray-50">
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                            <div className="relative">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-500 text-base font-bold text-white shadow-lg">
                                                {getInitials(selectedUser.name)}
                                            </div>
                                            <span 
                                                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white shadow-sm z-10 ${
                                                    (selectedUserStatus ? selectedUserStatus.is_online : (selectedUser.is_online ?? false)) 
                                                        ? 'bg-emerald-500 ring-1 ring-emerald-300' 
                                                        : 'bg-gray-400'
                                                }`} 
                                                title={(selectedUserStatus ? selectedUserStatus.is_online : (selectedUser.is_online ?? false)) ? 'Online' : 'Offline'}
                                                style={{ display: 'block', minWidth: '16px', minHeight: '16px' }}
                                            ></span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3>
                                            <p className={`text-sm font-medium ${
                                                (selectedUserStatus ? selectedUserStatus.is_online : (selectedUser.is_online ?? false))
                                                    ? 'text-emerald-600' 
                                                    : 'text-gray-500'
                                            }`}>
                                                {formatLastSeen(
                                                    selectedUserStatus?.last_seen_at || selectedUser.last_seen_at, 
                                                    selectedUserStatus ? selectedUserStatus.is_online : (selectedUser.is_online ?? false)
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={() => handleStartCall('audio')}
                                            disabled={!isFriend}
                                            className={`rounded-xl p-3 transition-all duration-200 ${
                                                isFriend 
                                                    ? 'bg-teal-50 text-teal-600 hover:bg-teal-100 hover:scale-110' 
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                            }`}
                                            title={isFriend ? "Audio Call" : "You must be friends to call"}
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </button>
                                        <button 
                                            onClick={() => handleStartCall('video')}
                                            disabled={!isFriend}
                                            className={`rounded-xl p-3 transition-all duration-200 ${
                                                isFriend 
                                                    ? 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 hover:scale-110' 
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                            }`}
                                            title={isFriend ? "Video Call" : "You must be friends to call"}
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 via-white to-gray-50/30 px-6 py-8 scroll-smooth">
                                <div className="mx-auto max-w-3xl space-y-5">
                                    {!isFriend ? (
                                        <div className="flex h-full items-center justify-center">
                                            <div className="text-center max-w-md">
                                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-red-100">
                                                    <svg className="h-10 w-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                </div>
                                                <p className="text-lg font-semibold text-gray-900 mb-2">You're not friends yet</p>
                                                {friendRequestStatus === 'sent' ? (
                                                    <>
                                                        <p className="text-sm text-gray-600 mb-6">You've sent a friend request to {selectedUser.name}. Waiting for their response...</p>
                                                        <div className="inline-flex items-center rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-600">
                                                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Request Pending
                                                        </div>
                                                    </>
                                                ) : friendRequestStatus === 'received' ? (
                                                    <>
                                                        <p className="text-sm text-gray-600 mb-6">{selectedUser.name} sent you a friend request. Accept it to start chatting!</p>
                                                        <Link
                                                            href={route('friends.index') + '?tab=pending'}
                                                            className="inline-flex items-center rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-green-700 hover:to-emerald-700 hover:shadow-xl transition-all"
                                                        >
                                                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            View Friend Request
                                                        </Link>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-sm text-gray-600 mb-6">
                                                            {isAdmin 
                                                                ? `You need to be friends with ${selectedUser.name} to send messages. As an admin, you can manage users from the admin panel.`
                                                                : `You need to be friends with ${selectedUser.name} to send messages. Send a friend request to start chatting!`}
                                                        </p>
                                                        {!isAdmin ? (
                                                            <button
                                                                onClick={async () => {
                                                                    if (friendRequestStatus === 'sent') return;
                                                                    
                                                                    try {
                                                                        const response = await axios.post('/api/friends/send', { 
                                                                            receiver_id: selectedUser.id 
                                                                        });
                                                                        if (response.data.success) {
                                                                            setFriendRequestStatus('sent');
                                                                        }
                                                                    } catch (error) {
                                                                        const errorMessage = error.response?.data?.error || 'Failed to send friend request';
                                                                        // If request already exists, update status to 'sent'
                                                                        if (errorMessage.includes('already exists') || errorMessage.includes('already sent')) {
                                                                            setFriendRequestStatus('sent');
                                                                        } else {
                                                                            // Only show alert for unexpected errors
                                                                            console.error('Error sending friend request:', error);
                                                                            // Silently update status if it's a duplicate request
                                                                            if (error.response?.status === 400) {
                                                                                setFriendRequestStatus('sent');
                                                                            }
                                                                        }
                                                                    }
                                                                }}
                                                                disabled={friendRequestStatus === 'sent'}
                                                                className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                                </svg>
                                                                Send Friend Request
                                                            </button>
                                                        ) : (
                                                            <Link
                                                                href={route('admin.users')}
                                                                className="inline-flex items-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl transition-all cursor-pointer"
                                                            >
                                                                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                Manage Users
                                                            </Link>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex h-full items-center justify-center">
                                            <div className="text-center">
                                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 via-teal-100 to-blue-100">
                                                    <svg className="h-10 w-10 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </div>
                                                <p className="text-base font-medium text-gray-600">No messages yet</p>
                                                <p className="mt-1 text-sm text-gray-400">Start the conversation!</p>
                                            </div>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isMyMessage(msg) ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`flex max-w-[75%] items-start space-x-3 ${isMyMessage(msg) ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                                    {!isMyMessage(msg) && (
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-500 text-xs font-bold text-white shadow-md ring-2 ring-white">
                                                            {getInitials(selectedUser?.name)}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col space-y-1">
                                                        <div
                                                            className={`group relative rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ${
                                                                isMyMessage(msg)
                                                                    ? 'bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 text-white rounded-br-md shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30'
                                                                    : 'bg-white text-gray-900 rounded-bl-md border border-gray-200/80 shadow-md hover:shadow-lg'
                                                            }`}
                                                        >
                                                            <p className="text-sm leading-relaxed font-medium">{msg.message}</p>
                                                        </div>
                                                        <span className={`px-1 text-xs font-medium text-gray-400 ${isMyMessage(msg) ? 'text-right' : 'text-left'}`}>
                                                            {formatMessageTime(msg.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Message Input */}
                            {isFriend ? (
                            <div className="border-t border-gray-200 bg-white px-6 py-5">
                                <form onSubmit={handleSendMessage}>
                                    <div className="flex items-end space-x-3">
                                        <button
                                            type="button"
                                            className="group rounded-xl bg-gray-100 p-3 text-gray-600 transition-all duration-200 hover:bg-gray-200 hover:scale-110 hover:shadow-md"
                                            title="Attach file"
                                        >
                                            <svg className="h-5 w-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                        </button>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        if (message.trim() && selectedUser) {
                                                            handleSendMessage(e);
                                                        }
                                                    }
                                                }}
                                                placeholder="Type a message..."
                                                className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-3.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-sm ring-0 transition-all duration-200 focus:border-cyan-400 focus:bg-white focus:shadow-md focus:ring-4 focus:ring-cyan-100"
                                                autoFocus
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!message.trim() || !selectedUser}
                                            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 p-3.5 text-white shadow-lg shadow-cyan-500/30 transition-all duration-200 hover:from-cyan-500 hover:via-teal-400 hover:to-blue-500 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-110 disabled:opacity-50 disabled:cursor-default disabled:hover:scale-100 disabled:hover:shadow-lg"
                                            title="Send message"
                                        >
                                            <svg className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </div>
                            ) : (
                                <div className="bg-gray-50 border-t border-gray-200 px-6 py-5">
                                    <div className="flex items-center justify-center space-x-3 text-sm text-gray-500">
                                        <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <span>You must be friends to send messages</span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
                            <div className="text-center">
                                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 via-teal-100 to-blue-100">
                                    <svg className="h-12 w-12 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to OneChat</h3>
                                <p className="text-gray-600 mb-6">Select a conversation from the sidebar to start chatting</p>
                                <Link
                                    href={route('users')}
                                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-cyan-500 hover:via-teal-400 hover:to-blue-500 hover:shadow-xl transition-all"
                                >
                                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Find Users to Chat
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Call Modal */}
            {activeCall && (
                <CallModal
                    call={activeCall}
                    currentUser={currentUser}
                    onEndCall={handleEndCall}
                    onAcceptCall={handleAcceptCall}
                    onRejectCall={handleRejectCall}
                />
            )}
        </ChatLayout>
    );
}

