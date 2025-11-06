import ChatLayout from '@/Layouts/ChatLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import axios from '@/bootstrap'; // Use configured axios instance
import CallModal from '@/components/CallModal';

export default function ChatIndex({ conversations = [], selectedUser = null, messages: initialMessages = [] }) {
    const [messages, setMessages] = useState(initialMessages);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCall, setActiveCall] = useState(null);
    const messagesEndRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const callPollingIntervalRef = useRef(null);
    const currentUser = usePage().props.auth.user;

    // Fetch messages from API
    const fetchMessages = async (userId) => {
        if (!userId) return;
        
        try {
            const response = await axios.get(`/api/messages/${userId}`);
            if (response.data.success) {
                setMessages(response.data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Start polling for new messages when a user is selected
    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id);

            pollingIntervalRef.current = setInterval(() => {
                fetchMessages(selectedUser.id);
            }, 2000);

            return () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }
            };
        }
    }, [selectedUser]);

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

        // Then poll every 1.5 seconds for faster updates
        callPollingIntervalRef.current = setInterval(checkActiveCall, 1500);

        return () => {
            isMounted = false;
            if (callPollingIntervalRef.current) {
                clearInterval(callPollingIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !selectedUser || isSending) return;

        const messageText = message.trim();
        setMessage('');
        setIsSending(true);

        try {
            // Get CSRF token to ensure it's available
            const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content;
            if (!csrfToken) {
                console.error('CSRF token not found');
                alert('CSRF token not found. Please refresh the page and try again.');
                setMessage(messageText);
                setIsSending(false);
                return;
            }

            const response = await axios.post('/api/messages/send', {
                receiver_id: selectedUser.id,
                message: messageText,
            }, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            if (response.data.success) {
                setMessages(prev => [...prev, response.data.message]);
                await fetchMessages(selectedUser.id);
                // Refresh conversations to update last message
                router.reload({ only: ['conversations'] });
            } else {
                console.error('Failed to send message:', response.data);
                alert('Failed to send message. Please try again.');
                setMessage(messageText);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Handle specific error cases
            if (error.response?.status === 419) {
                alert('CSRF token expired. Please refresh the page and try again.');
            } else if (error.response?.status === 401) {
                alert('You are not authenticated. Please log in again.');
            } else if (error.response?.status === 422) {
                const errors = error.response.data?.errors;
                const errorMessage = errors ? Object.values(errors).flat().join(', ') : 'Validation error';
                alert(errorMessage);
            } else {
                const errorMessage = error.response?.data?.error || 
                                   error.response?.data?.message || 
                                   error.message || 
                                   'Failed to send message. Please try again.';
                alert(errorMessage);
            }
            
            setMessage(messageText);
        } finally {
            setIsSending(false);
        }
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatMessageTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const isMyMessage = (msg) => msg.sender_id === currentUser?.id;

    const handleStartCall = async (callType = 'audio') => {
        if (!selectedUser) return;

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
            const errorMessage = error.response?.data?.error || 'Failed to start call. Please try again.';
            alert(errorMessage);
        }
    };

    const handleEndCall = () => {
        setActiveCall(null);
    };

    const handleAcceptCall = () => {
        // Call is accepted via CallModal
    };

    const handleRejectCall = () => {
        setActiveCall(null);
    };

    const filteredConversations = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                                {filteredConversations.map((conversation) => {
                                    const isActive = selectedUser?.id === conversation.id;
                                    const isUnread = conversation.unread_count > 0;

                                    return (
                                        <Link
                                            key={conversation.id}
                                            href={route('chat.show', conversation.id)}
                                            className={`flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors ${
                                                isActive ? 'bg-indigo-50 border-r-2 border-indigo-600' : ''
                                            }`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white ${
                                                    isActive ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
                                                }`}>
                                                    {getInitials(conversation.name)}
                                                </div>
                                                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"></span>
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
                                                            conversation.last_message.sender_id === currentUser.id ? (
                                                                `You: ${conversation.last_message.message}`
                                                            ) : (
                                                                conversation.last_message.message
                                                            )
                                                        ) : (
                                                            'No messages yet'
                                                        )}
                                                    </p>
                                                    {isUnread && (
                                                        <span className="ml-2 flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                                                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
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
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-base font-bold text-white shadow-lg">
                                                {getInitials(selectedUser.name)}
                                            </div>
                                            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"></span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3>
                                            <p className="text-sm text-emerald-600 font-medium">Active now</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={() => handleStartCall('audio')}
                                            className="rounded-xl bg-emerald-50 p-3 text-emerald-600 hover:bg-emerald-100 transition-all duration-200 hover:scale-110" 
                                            title="Audio Call"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </button>
                                        <button 
                                            onClick={() => handleStartCall('video')}
                                            className="rounded-xl bg-blue-50 p-3 text-blue-600 hover:bg-blue-100 transition-all duration-200 hover:scale-110" 
                                            title="Video Call"
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
                                    {messages.length === 0 ? (
                                        <div className="flex h-full items-center justify-center">
                                            <div className="text-center">
                                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
                                                    <svg className="h-10 w-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-md ring-2 ring-white">
                                                            {getInitials(selectedUser.name)}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col space-y-1">
                                                        <div
                                                            className={`group relative rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ${
                                                                isMyMessage(msg)
                                                                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white rounded-br-md shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30'
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
                                                placeholder="Type a message..."
                                                className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-3.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-sm ring-0 transition-all duration-200 focus:border-indigo-400 focus:bg-white focus:shadow-md focus:ring-4 focus:ring-indigo-100"
                                                autoFocus
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!message.trim() || isSending}
                                            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-3.5 text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                                            title="Send message"
                                        >
                                            {isSending ? (
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            ) : (
                                                <svg className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <div className="text-center">
                                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
                                    <svg className="h-12 w-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to One Chat</h3>
                                <p className="text-gray-600 mb-6">Select a conversation from the sidebar to start chatting</p>
                                <Link
                                    href={route('users')}
                                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transition-all"
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

