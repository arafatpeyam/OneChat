import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from '@/bootstrap';

export default function EmergencyShow({ emergency, canResolve = false }) {
    const [status, setStatus] = useState(emergency.status);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState(null);

    const getEmergencyTypeLabel = (type) => {
        const labels = {
            'fire': 'Fire Emergency',
            'harassment': 'Harassment',
            'medical': 'Medical Emergency',
            'accident': 'Accident',
            'crime': 'Crime',
            'natural_disaster': 'Natural Disaster',
            'other': 'Emergency',
        };
        return labels[type] || 'Emergency';
    };

    const getEmergencyTypeColor = (type) => {
        const colors = {
            'fire': 'from-red-500 to-rose-600',
            'harassment': 'from-orange-500 to-amber-600',
            'medical': 'from-red-500 to-pink-600',
            'accident': 'from-orange-500 to-red-600',
            'crime': 'from-red-600 to-rose-700',
            'natural_disaster': 'from-yellow-500 to-orange-600',
            'other': 'from-gray-500 to-gray-600',
        };
        return colors[type] || 'from-gray-500 to-gray-600';
    };

    const getPriorityColor = (priority) => {
        if (priority >= 4) return 'bg-red-100 text-red-700 border-red-300';
        if (priority === 3) return 'bg-orange-100 text-orange-700 border-orange-300';
        if (priority === 2) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        return 'bg-blue-100 text-blue-700 border-blue-300';
    };

    const getPriorityLabel = (priority) => {
        if (priority >= 4) return 'Critical';
        if (priority === 3) return 'High';
        if (priority === 2) return 'Medium';
        return 'Low';
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const handleStatusUpdate = async (newStatus) => {
        if (isUpdating) return;
        
        setIsUpdating(true);
        setUpdateMessage(null);
        
        try {
            const response = await axios.patch(route('emergency.update', emergency.id), {
                status: newStatus,
            });
            if (response.data.success) {
                setStatus(newStatus);
                setUpdateMessage({
                    type: 'success',
                    text: `Emergency marked as ${newStatus} successfully!`,
                });
                // Clear message after 3 seconds
                setTimeout(() => setUpdateMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            setUpdateMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to update status. Please try again.',
            });
            setTimeout(() => setUpdateMessage(null), 5000);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendEmail = () => {
        if (!emergency.user.email) return;
        
        const subject = encodeURIComponent(`Re: Emergency - ${emergency.title}`);
        const body = encodeURIComponent(
            `Hello ${emergency.user.name},\n\n` +
            `I am responding to your emergency request:\n\n` +
            `Emergency Type: ${getEmergencyTypeLabel(emergency.type)}\n` +
            `Title: ${emergency.title}\n` +
            `Description: ${emergency.description}\n` +
            `Priority: ${getPriorityLabel(emergency.priority)}\n` +
            `${emergency.address ? `Location: ${emergency.address}\n` : ''}` +
            `${emergency.latitude && emergency.longitude ? `Coordinates: ${emergency.latitude}, ${emergency.longitude}\n` : ''}\n` +
            `Please let me know how I can help.\n\n` +
            `Best regards`
        );
        
        window.location.href = `mailto:${emergency.user.email}?subject=${subject}&body=${body}`;
    };

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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white">Emergency Details</h2>
                                <p className="text-sm text-cyan-100/80 mt-1">{getEmergencyTypeLabel(emergency.type)}</p>
                            </div>
                        </div>
                        <Link
                            href={route('emergency.index')}
                            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-medium text-sm cursor-pointer"
                        >
                            Back to Emergencies
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Emergency: ${emergency.title}`} />

            <div className="py-8">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        {/* Success/Error Message */}
                        {updateMessage && (
                            <div className={`rounded-xl p-4 border-2 ${
                                updateMessage.type === 'success'
                                    ? 'bg-green-50 border-green-200 text-green-800'
                                    : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                                <div className="flex items-center gap-2">
                                    {updateMessage.type === 'success' ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                    <span className="font-medium">{updateMessage.text}</span>
                                </div>
                            </div>
                        )}

                        {/* Status Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`px-4 py-2 rounded-xl border-2 font-semibold ${getPriorityColor(emergency.priority)}`}>
                                        {getPriorityLabel(emergency.priority)} Priority
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl font-semibold ${
                                        status === 'active' 
                                            ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                                            : status === 'resolved'
                                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                            : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                                    }`}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </div>
                                </div>
                                {status === 'active' && canResolve && (
                                    <button
                                        onClick={() => handleStatusUpdate('resolved')}
                                        disabled={isUpdating}
                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Mark as Resolved</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Main Details Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className={`bg-gradient-to-r ${getEmergencyTypeColor(emergency.type)} p-6`}>
                                <h3 className="text-2xl font-bold text-white">{emergency.title}</h3>
                                <p className="text-white/90 mt-2 text-sm">Created {formatTime(emergency.created_at)}</p>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {/* Description */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Description</h4>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{emergency.description}</p>
                                </div>

                                {/* Location */}
                                {emergency.latitude && emergency.longitude && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Location</h4>
                                        <div className="space-y-3">
                                            {emergency.address && (
                                                <div className="flex items-start gap-3">
                                                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-gray-700 font-medium">{emergency.address}</p>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            Coordinates: {emergency.latitude}, {emergency.longitude}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Embedded Google Maps */}
                                            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                                <iframe
                                                    width="100%"
                                                    height="400"
                                                    style={{ border: 0 }}
                                                    loading="lazy"
                                                    allowFullScreen
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    src={`https://www.google.com/maps?q=${emergency.latitude},${emergency.longitude}&hl=en&z=15&output=embed`}
                                                ></iframe>
                                            </div>
                                            
                                            {emergency.google_maps_url && (
                                                <a
                                                    href={emergency.google_maps_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm cursor-pointer"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    Open in Google Maps (Full View)
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Requester Information */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Requester Information</h4>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600 font-medium">Name:</span>
                                            <span className="text-gray-900">{emergency.user.name}</span>
                                        </div>
                                        {emergency.user.email && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600 font-medium">Email:</span>
                                                <a href={`mailto:${emergency.user.email}`} className="text-blue-600 hover:text-blue-700 cursor-pointer">
                                                    {emergency.user.email}
                                                </a>
                                            </div>
                                        )}
                                        {emergency.user.phone && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600 font-medium">Phone:</span>
                                                <a href={`tel:${emergency.user.phone}`} className="text-blue-600 hover:text-blue-700 cursor-pointer">
                                                    {emergency.user.phone}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            {emergency.user.phone && (
                                <a
                                    href={`tel:${emergency.user.phone}`}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-center shadow-lg hover:shadow-xl cursor-pointer"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        Call Requester
                                    </div>
                                </a>
                            )}
                            {emergency.user.email && (
                                <button
                                    onClick={handleSendEmail}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-center shadow-lg hover:shadow-xl cursor-pointer"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Send Email
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

