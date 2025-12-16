import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from '@/bootstrap';

export default function BloodRequests() {
    const { auth } = usePage().props;
    const currentUser = auth?.user;
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRequest, setEditingRequest] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [filters, setFilters] = useState({
        my_requests: false,
        status: '',
        blood_group: '',
        city: '',
    });
    const [mapZooms, setMapZooms] = useState({}); // Track zoom level for each map by request ID

    useEffect(() => {
        fetchRequests();
    }, [filters]);

    // Handle Ctrl + Scroll zoom for maps
    useEffect(() => {
        const handleWheel = (e) => {
            // Check if Ctrl (or Cmd on Mac) is pressed
            if (e.ctrlKey || e.metaKey) {
                // Find the map container under the cursor
                const mapContainers = document.querySelectorAll('[data-map-container]');
                for (const container of mapContainers) {
                    const rect = container.getBoundingClientRect();
                    const x = e.clientX;
                    const y = e.clientY;
                    
                    // Check if mouse is over this map container (including the iframe area)
                    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                        e.preventDefault();
                        e.stopPropagation();
                        const requestId = parseInt(container.getAttribute('data-request-id'));
                        if (requestId) {
                            const delta = e.deltaY > 0 ? -1 : 1; // Scroll down = zoom out, scroll up = zoom in
                            setMapZooms(prev => ({
                                ...prev,
                                [requestId]: Math.max(1, Math.min(20, (prev[requestId] || 16) + delta))
                            }));
                        }
                        return false;
                    }
                }
            }
        };

        // Use capture phase to catch the event before it bubbles, and make sure it's not passive
        document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
        
        return () => {
            document.removeEventListener('wheel', handleWheel, { capture: true });
        };
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.my_requests) params.append('my_requests', '1');
            if (filters.status) params.append('status', filters.status);
            if (filters.blood_group) params.append('blood_group', filters.blood_group);
            if (filters.city) params.append('city', filters.city);

            const response = await axios.get(`/api/blood-donors/requests?${params.toString()}`);
            if (response.data.success) {
                setRequests(response.data.requests.data || []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditRequest = (request) => {
        setEditingRequest(request);
        setEditFormData({
            blood_group: request.blood_group,
            units_needed: request.units_needed,
            urgency: request.urgency,
            patient_name: request.patient_name,
            hospital_name: request.hospital_name,
            hospital_address: request.hospital_address,
            city: request.city,
            state: request.state,
            contact_phone: request.contact_phone,
            contact_email: request.contact_email || '',
            needed_by_date: request.needed_by_date,
            needed_by_time: request.needed_by_time?.substring(0, 5) || '',
            additional_info: request.additional_info,
        });
    };

    const handleUpdateRequest = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`/api/blood-donors/requests/${editingRequest.id}`, editFormData);
            if (response.data.success) {
                setEditingRequest(null);
                setEditFormData({});
                fetchRequests();
            }
        } catch (error) {
            console.error('Failed to update request:', error.response?.data?.error || error.response?.data?.errors || error.message);
        }
    };

    const handleCancelRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to cancel this blood request? This action cannot be undone.')) {
            return;
        }
        try {
            const response = await axios.put(`/api/blood-donors/requests/${requestId}`, { status: 'cancelled' });
            if (response.data.success) {
                setEditingRequest(null);
                setEditFormData({});
                fetchRequests();
            }
        } catch (error) {
            console.error('Failed to cancel request:', error.response?.data?.error || error.message);
        }
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'critical':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'urgent':
                return 'bg-orange-100 text-orange-800 border-orange-300';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-300';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'fulfilled':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800 border-gray-300';
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hour = '0', minute = '0'] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hour, 10));
        date.setMinutes(parseInt(minute, 10));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const getMapEmbedUrl = (request) => {
        const zoom = mapZooms[request.id] || 16; // Default zoom is 16, or use stored zoom
        if (request.latitude && request.longitude) {
            return `https://www.google.com/maps?q=${request.latitude},${request.longitude}&hl=en&z=${zoom}&output=embed`;
        }
        const fullAddress = `${request.hospital_address || ''}, ${request.city || ''}, ${request.state || ''}, Bangladesh`.trim();
        if (fullAddress.replace(/[,\s]/g, '') === '') {
            return null;
        }
        return `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&hl=en&z=${zoom}&output=embed`;
    };

    const getMapLink = (request) => {
        if (request.latitude && request.longitude) {
            return `https://www.google.com/maps?q=${request.latitude},${request.longitude}&z=17`;
        }
        const fullAddress = `${request.hospital_address || ''}, ${request.city || ''}, ${request.state || ''}, Bangladesh`.trim();
        if (fullAddress.replace(/[,\s]/g, '') === '') {
            return null;
        }
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Blood Requests" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Blood Requests</h1>
                                <p className="mt-2 text-gray-600">View all blood donation requests</p>
                            </div>
                            <Link
                                href={route('blood-donation.index') + '?showForm=true'}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-md"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                New Request
                            </Link>
                        </div>
                    </div>

                    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                        <strong>Friends only:</strong> You can view, edit, or manage blood requests created by you or your accepted friends. Add friends to keep track of more requests.
                    </div>

                    {/* Filters */}
                    <div className="mb-6 rounded-xl border-2 border-gray-200 bg-white p-6">
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Filter
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="fulfilled">Fulfilled</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Blood Group
                                </label>
                                <select
                                    value={filters.blood_group}
                                    onChange={(e) => setFilters({ ...filters, blood_group: e.target.value })}
                                    className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                >
                                    <option value="">All Blood Groups</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={filters.city}
                                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                                    placeholder="Filter by city"
                                    className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                />
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.my_requests}
                                        onChange={(e) => setFilters({ ...filters, my_requests: e.target.checked })}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">My Requests Only</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Requests List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                            <p className="mt-4 text-gray-600">Loading requests...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 rounded-xl border-2 border-gray-200 bg-white">
                            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">No requests found</h3>
                            <p className="mt-2 text-gray-600">No blood requests match your filters.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <div
                                    key={request.id}
                                    className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getUrgencyColor(request.urgency)}`}>
                                                    {request.urgency.toUpperCase()}
                                                </span>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                                                    {request.status.toUpperCase()}
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-300">
                                                    {request.blood_group}
                                                </span>
                                                    <span className="text-sm text-gray-500">
                                                        {request.units_needed} unit{request.units_needed > 1 ? 's' : ''} needed
                                                    </span>
                                                </div>
                                                
                                                {/* Edit Button - Top Right */}
                                                {currentUser && request.user_id === currentUser.id && (
                                                    <button
                                                        onClick={() => handleEditRequest(request)}
                                                        className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs font-semibold flex-shrink-0"
                                                    >
                                                        Edit Request
                                                    </button>
                                                )}
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                                {request.hospital_name}
                                            </h3>

                                            <div className="flex flex-col md:flex-row gap-4 items-start">
                                                {/* Patient Details Section */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="space-y-1 text-sm text-gray-600">
                                                        <div className="flex items-start gap-2">
                                                            <svg className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            <span><strong>Patient:</strong> {request.patient_name}</span>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <svg className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span><strong>Need by:</strong> {formatDate(request.needed_by_date)} at {formatTime(request.needed_by_time)}</span>
                                                        </div>
                                                        {request.additional_info && (
                                                            <div className="flex items-start gap-2">
                                                                <svg className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                <span><strong>Details:</strong> {request.additional_info}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Address Section */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                                                        <svg className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span><strong>Location:</strong> {request.hospital_address}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2 text-sm text-gray-600">
                                                        <svg className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        <span><strong>Contact:</strong> {request.contact_phone}</span>
                                                    </div>
                                                </div>

                                                {/* Map Section */}
                                                {getMapEmbedUrl(request) && (
                                                    <div 
                                                        className="flex-1 min-w-0 group relative" 
                                                        data-map-container 
                                                        data-request-id={request.id}
                                                    >
                                                        <div className="rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm relative" style={{ height: '120px' }}>
                                                            <iframe
                                                                width="100%"
                                                                height="100%"
                                                                style={{ border: 0 }}
                                                                loading="lazy"
                                                                allowFullScreen
                                                                referrerPolicy="no-referrer-when-downgrade"
                                                                src={getMapEmbedUrl(request)}
                                                                title={`Map of ${request.hospital_name}`}
                                                            ></iframe>
                                                            {/* Zoom instruction overlay - only show on hover and allow clicks through */}
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                                    Use ctrl + scroll to zoom the map
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Requested By Section */}
                                                <div className="flex-1 min-w-0 text-right">
                                                    <p className="text-sm text-gray-700 mb-2">
                                                        <strong>Requested by:</strong>
                                                    </p>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {request.user?.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatDate(request.created_at)}
                                                    </p>
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

            {/* Edit Request Modal */}
            {editingRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 rounded-t-2xl bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-white">Edit Blood Request</h2>
                                <button
                                    onClick={() => {
                                        setEditingRequest(null);
                                        setEditFormData({});
                                    }}
                                    className="rounded-lg p-2 text-white hover:bg-white/20 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateRequest} className="p-6 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Blood Group <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={editFormData.blood_group}
                                        onChange={(e) => setEditFormData({ ...editFormData, blood_group: e.target.value })}
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                        required
                                    >
                                        <option value="">Select Blood Group</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Units Needed <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={editFormData.units_needed}
                                        onChange={(e) => setEditFormData({ ...editFormData, units_needed: e.target.value })}
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Urgency <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={editFormData.urgency}
                                        onChange={(e) => setEditFormData({ ...editFormData, urgency: e.target.value })}
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                        required
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Patient Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.patient_name}
                                        onChange={(e) => setEditFormData({ ...editFormData, patient_name: e.target.value })}
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Hospital Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.hospital_name}
                                        onChange={(e) => setEditFormData({ ...editFormData, hospital_name: e.target.value })}
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Hospital Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.hospital_address}
                                        onChange={(e) => setEditFormData({ ...editFormData, hospital_address: e.target.value })}
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        City <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.city}
                                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        State <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.state}
                                        onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Contact Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.contact_phone}
                                        onChange={(e) => setEditFormData({ ...editFormData, contact_phone: e.target.value })}
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        value={editFormData.contact_email}
                                        onChange={(e) => setEditFormData({ ...editFormData, contact_email: e.target.value })}
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Needed By Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={editFormData.needed_by_date}
                                        onChange={(e) => setEditFormData({ ...editFormData, needed_by_date: e.target.value })}
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Needed By Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={editFormData.needed_by_time}
                                        onChange={(e) => setEditFormData({ ...editFormData, needed_by_time: e.target.value })}
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Additional Information / Blood Need Details <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={editFormData.additional_info}
                                        onChange={(e) => setEditFormData({ ...editFormData, additional_info: e.target.value })}
                                        rows="2"
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:border-red-400"
                                        placeholder="Describe the blood need, patient condition, or special requirements..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => handleCancelRequest(editingRequest.id)}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                                >
                                    Cancel Request
                                </button>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingRequest(null);
                                            setEditFormData({});
                                        }}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-colors font-semibold shadow-lg"
                                    >
                                        Update Request
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

