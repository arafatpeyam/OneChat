import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Welcome({ auth, canLogin, canRegister }) {
    // Demo chat state for Oscar conversation
    const [demoMessages, setDemoMessages] = useState([
        { from: 'oscar', text: 'Hi' },
        { from: 'user', text: 'Hello' },
        { from: 'oscar', text: 'How are you?' },
    ]);
    const [demoInput, setDemoInput] = useState('');
    const [isOscarTyping, setIsOscarTyping] = useState(false);

    const handleDemoSend = () => {
        const trimmed = demoInput.trim();
        if (!trimmed) return;

        // Add viewer message first
        setDemoMessages((prev) => [...prev, { from: 'user', text: trimmed }]);
        setDemoInput('');

        // Show Oscar typing, then send a short promo reply
        setIsOscarTyping(true);
        setTimeout(() => {
            setDemoMessages((prev) => [
                ...prev,
                {
                    from: 'oscar',
                    text: 'Awesome! OneChat brings you instant messaging, HD calls, blood donation help, and 24/7 emergency support—join free to get it all.',
                },
            ]);
            setIsOscarTyping(false);
        }, 1200);
    };

    const handleDemoKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleDemoSend();
        }
    };
    return (
        <>
            <Head title="Welcome to OneChat" />
            <div className="min-h-screen bg-white">
                {/* Professional Header */}
                <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10 shadow-lg">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-medium bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 bg-clip-text text-transparent">
                                OneChat
                            </h1>
                            </div>
                        <nav className="flex items-center space-x-6">
                            {auth?.user ? (
                                    <Link
                                        href={auth.user.role === 'admin' ? route('dashboard') : route('chat.index')}
                                    className="px-6 py-2.5 text-sm font-semibold text-white/90 hover:text-white transition-colors"
                                    >
                                        {auth.user.role === 'admin' ? 'Dashboard' : 'Messages'}
                                    </Link>
                                ) : (
                                    <>
                                    {canLogin && (
                                        <Link
                                            href={route('login')}
                                            className="px-6 py-2.5 text-sm font-semibold text-white/90 hover:text-white transition-colors"
                                        >
                                            Log in
                                        </Link>
                                    )}
                                    {canRegister && (
                                        <Link
                                            href={route('register')}
                                            className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-lg shadow-lg hover:shadow-xl hover:from-cyan-500 hover:to-teal-500 transition-all duration-200"
                                        >
                                            Get Started
                                        </Link>
                                    )}
                                    </>
                                )}
                            </nav>
                    </div>
                        </header>

                {/* Hero Section with Flowing Communication Theme - Full Screen */}
                <section className="relative overflow-hidden min-h-screen flex items-center">
                    {/* Flowing Communication and Help Background */}
                    <div className="absolute inset-0 z-0">
                        {/* Base image with flowing aesthetic */}
                        <img 
                            src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1600&q=80" 
                            alt="Flowing Communication and Community Help" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback gradient if image fails to load
                                e.target.style.display = 'none';
                                e.target.parentElement.style.background = 'linear-gradient(to bottom right, #06b6d4, #14b8a6, #3b82f6)';
                            }}
                        />
                        {/* Merged blur effect - Subtle gradient transition matching real image */}
                        <div 
                            className="absolute inset-0"
                            style={{
                                backdropFilter: 'blur(4px)',
                                WebkitBackdropFilter: 'blur(4px)',
                                maskImage: 'linear-gradient(to right, black 0%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.7) 42%, rgba(0,0,0,0.5) 47%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.15) 52%, rgba(0,0,0,0.06) 54%, transparent 55%)',
                                WebkitMaskImage: 'linear-gradient(to right, black 0%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.7) 42%, rgba(0,0,0,0.5) 47%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.15) 52%, rgba(0,0,0,0.06) 54%, transparent 55%)'
                            }}
                        ></div>
                        {/* Merged overlay - Matched with blur transition */}
                        <div 
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.48) 25%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.4) 42%, rgba(0,0,0,0.35) 47%, rgba(0,0,0,0.32) 50%, rgba(0,0,0,0.3) 52%, rgba(0,0,0,0.28) 54%, rgba(0,0,0,0.28) 56%, rgba(0,0,0,0.28) 60%, rgba(0,0,0,0.28) 100%)'
                            }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/25"></div>
                                    </div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
                        <div className="relative z-10 max-w-3xl">
                            {/* Left Content */}
                            <div className="space-y-8">
                                <div className="space-y-4 pt-16 md:pt-24">
                                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white drop-shadow-lg">
                                        The Easiest Way to
                                        <span className="block bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-300 bg-clip-text text-transparent drop-shadow-md">
                                            Communicate
                                        </span>
                                    </h1>
                                    <p className="text-xl text-white/95 leading-relaxed max-w-xl drop-shadow-md">
                                        OneChat is your all-in-one communication solution. Experience seamless messaging, 
                                        crystal-clear audio/video calls, life-saving blood donation services, 
                                        and instant emergency assistance—all in one professional platform.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    {auth?.user ? (
                                        <Link
                                            href={route('chat.index')}
                                            className="px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-lg shadow-xl hover:shadow-2xl hover:from-cyan-500 hover:to-teal-500 transition-all duration-200"
                                        >
                                            Start Chatting
                                        </Link>
                                    ) : (
                                        <>
                                            {canRegister && (
                                                <Link
                                                    href={route('register')}
                                                    className="px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-lg shadow-xl hover:shadow-2xl hover:from-cyan-500 hover:to-teal-500 transition-all duration-200"
                                                >
                                                    Get Started Free
                                                </Link>
                                            )}
                                            {canLogin && (
                                                <Link
                                                    href={route('login')}
                                                    className="px-8 py-4 text-base font-semibold text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg hover:bg-white/20 hover:border-white/50 transition-all duration-200"
                                                >
                                                    Sign In
                                                </Link>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section with Images */}
                <section className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16 pt-16 md:pt-24">
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                                Everything You Need in
                                <span className="block mt-4 mb-8 bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 bg-clip-text text-transparent">
                                    One Platform
                                </span>
                            </h2>
                                    </div>

                        {/* Feature Cards with Images */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Messaging & Calls Feature with Image */}
                            <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
                                <div className="relative min-h-[18rem] md:min-h-[20rem] bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 overflow-hidden">
                                    {/* Full Conversational View */}
                                    <div className="absolute inset-0 flex flex-col">
                                        {/* Chat Header */}
                                        <div className="flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-200/80">
                                            <div className="relative">
                                                <img 
                                                    src="/images/oscar.jpg" 
                                                    alt="Oscar" 
                                                    className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-white"
                                                />
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-gray-800">Oscar!</div>
                                            </div>
                                            {/* Call and Video Call buttons in top right */}
                                            <div className="flex items-center gap-1.5">
                                                {/* Audio Call button */}
                                                <button className="w-9 h-9 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </button>
                                                {/* Video Call button */}
                                                <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border-2 border-teal-400 hover:shadow-md transition-shadow">
                                                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                </button>
                                            </div>
                                            </div>

                                        {/* Conversation Messages */}
                                        <div className="flex-1 flex flex-col justify-end overflow-y-auto pt-1 pb-1 space-y-2 bg-gradient-to-b from-slate-50/50 to-blue-50/30">
                                            {demoMessages.map((msg, index) => {
                                                const isOscar = msg.from === 'oscar';
                                                return (
                                                    <div
                                                        key={index}
                                                        className={`flex ${isOscar ? 'justify-start pl-4 pr-2' : 'justify-end pl-2 pr-4'}`}
                                                    >
                                                        <div className="flex items-end gap-2 max-w-[85%]">
                                                            {isOscar && (
                                                                <img
                                                                    src="/images/oscar.jpg"
                                                                    alt="Oscar"
                                                                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 shadow-sm border border-gray-200"
                                                                />
                                                            )}
                                                            <div
                                                                className={`px-3.5 py-2 rounded-2xl shadow-sm border ${
                                                                    isOscar
                                                                        ? 'bg-white rounded-bl-sm border-gray-100'
                                                                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 rounded-br-sm border-cyan-500'
                                                                }`}
                                                            >
                                                                <p
                                                                    className={`text-sm ${
                                                                        isOscar ? 'text-gray-800' : 'text-white'
                                                                    }`}
                                                                >
                                                                    {msg.text}
                                                </p>
                                            </div>
                                                            {!isOscar && (
                                                                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex-shrink-0 shadow-sm"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Typing indicator when Oscar is preparing a reply */}
                                            {isOscarTyping && (
                                                <div className="flex justify-start pl-4 pr-2 mt-1">
                                                    <div className="flex items-center gap-2 max-w-[60%]">
                                                        <img
                                                            src="/images/oscar.jpg"
                                                            alt="Oscar"
                                                            className="w-7 h-7 rounded-full object-cover flex-shrink-0 shadow-sm border border-gray-200"
                                                        />
                                                        <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chat Input */}
                                        <div className="flex items-center gap-2 px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-200/80">
                                            <button
                                                type="button"
                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                            />
                                        </svg>
                                            </button>
                                            <div className="flex-1 bg-gray-100 rounded-2xl px-3.5 py-2 min-h-[40px] flex items-center">
                                                <input
                                                    type="text"
                                                    value={demoInput}
                                                    onChange={(e) => setDemoInput(e.target.value)}
                                                    onKeyDown={handleDemoKeyDown}
                                                    placeholder="Type a message..."
                                                    className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                                                />
                                    </div>
                                            <button
                                                type="button"
                                                onClick={handleDemoSend}
                                                className="w-9 h-9 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-105"
                                            >
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                            </button>
                                        </div>
                                    </div>
                                    </div>
                                <div className="px-8 pt-4 pb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Messaging & Calls</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Real-time messaging, crystal-clear audio/video calls, and quick sharing in one place.
                                                </p>
                                            </div>
                                    </div>

                            {/* Blood Donation Feature with Image */}
                            <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
                                <div className="relative h-64 bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-100 overflow-hidden">
                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 opacity-15">
                                        <div className="absolute top-0 left-0 w-full h-full" style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H16v-2zm0 4h20v2H16v-2zm0 4h20v2H16v-2zm0 4h20v2H16v-2z'/%3E%3C/g%3E%3C/svg%3E")`
                                        }}></div>
                                    </div>
                                    {/* Foreground Illustration */}
                                    <div className="absolute inset-0 flex items-center justify-center p-8">
                                        <div className="relative w-full h-full max-w-xs">
                                            {/* Heart illustration in blue theme */}
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                <svg
                                                    className="w-28 h-28 text-cyan-500 drop-shadow-2xl"
                                                    fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                </svg>
                                            </div>
                                            {/* People icons */}
                                            <div className="absolute top-4 left-4">
                                                <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg">
                                                    <svg className="w-6 h-6 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 right-4">
                                                <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg">
                                                    <svg className="w-6 h-6 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                                        </svg>
                                    </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-8 pt-4 pb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Blood Donation</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Connect with nearby donors and save lives faster with OneChat’s built-in blood donation network.
                                        </p>
                                    </div>
                                    </div>

                            {/* Emergency Services Feature with Image */}
                            <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
                                <div className="relative h-64 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 overflow-hidden">
                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 opacity-20">
                                        <div className="absolute top-0 left-0 w-full h-full" style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                                        }}></div>
                                    </div>
                                    {/* Subtle blue blur overlay on left side */}
                                    <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-cyan-500/25 via-cyan-400/15 to-transparent backdrop-blur-sm pointer-events-none"></div>
                                    {/* Foreground Illustration */}
                                    <div className="absolute inset-0 flex items-center justify-center p-8">
                                        <div className="relative w-full h-full max-w-xs">
                                            {/* Emergency alert icon */}
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                <div className="relative">
                                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                                                        <svg className="w-14 h-14 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                    </div>
                                                    {/* Signal waves */}
                                                    <div className="absolute inset-0 border-4 border-amber-400 rounded-full animate-ping opacity-70"></div>
                                                    <div className="absolute inset-0 border-4 border-orange-300 rounded-full animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
                                                </div>
                                            </div>
                                            {/* Phone icon */}
                                            <div className="absolute bottom-8 left-8">
                                                <div className="w-14 h-14 bg-white/90 rounded-xl flex items-center justify-center shadow-lg">
                                                    <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                                </div>
                                            </div>
                                            {/* Medical cross */}
                                            <div className="absolute top-8 right-8">
                                                <div className="w-14 h-14 bg-white/90 rounded-xl flex items-center justify-center shadow-lg">
                                                    <svg className="w-7 h-7 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                                        </svg>
                                    </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Emergency Services</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Instant access to emergency assistance and support when you need it most. 
                                        Quick response for critical situations.
                                        </p>
                                    </div>
                                </div>
                            </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Ready to Get Started?
                        </h2>
                        <p className="text-xl text-cyan-50 mb-8 max-w-2xl mx-auto">
                            Join thousands of users who trust OneChat for their communication needs.
                        </p>
                        {!auth?.user && canRegister && (
                            <Link
                                href={route('register')}
                                className="inline-block px-8 py-4 text-base font-semibold text-cyan-600 bg-white rounded-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
                            >
                                Create Your Free Account
                            </Link>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-gray-400 py-12">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center justify-between">
                            <div className="mb-4 md:mb-0">
                                <h3 className="text-2xl font-medium bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 bg-clip-text text-transparent mb-2">
                                    OneChat
                                </h3>
                                <p className="text-sm">© {new Date().getFullYear()} OneChat. All rights reserved.</p>
                            </div>
                            <p className="text-sm">
                                The easiest communication platform for everyone.
                            </p>
                    </div>
                </div>
                </footer>
            </div>
        </>
    );
}
