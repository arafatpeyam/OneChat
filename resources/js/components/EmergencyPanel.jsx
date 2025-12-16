import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import axios from '@/bootstrap';
import { Transition } from '@headlessui/react';

export default function EmergencyPanel({ activeEmergencies = [], nearbyEmergencies = [] }) {
    // Open form by default on emergency page
    const [isOpen, setIsOpen] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [location, setLocation] = useState({ latitude: null, longitude: null, address: null });
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [formData, setFormData] = useState({
        type: 'other',
        title: '',
        description: '',
        priority: null,
    });
    const [errors, setErrors] = useState({});
    const mapRef = useRef(null);

    // Get user's current location
    const getCurrentLocation = () => {
        setIsGettingLocation(true);
        setErrors({});

        if (!navigator.geolocation) {
            setErrors({ location: 'Geolocation is not supported by your browser' });
            setIsGettingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude, address: null });

                // Reverse geocode to get address
                try {
                    const response = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}`
                    );
                    const data = await response.json();
                    if (data.results && data.results.length > 0) {
                        setLocation({
                            latitude,
                            longitude,
                            address: data.results[0].formatted_address,
                        });
                    } else {
                        setLocation({ latitude, longitude, address: `${latitude}, ${longitude}` });
                    }
                } catch (error) {
                    console.error('Error getting address:', error);
                    setLocation({ latitude, longitude, address: `${latitude}, ${longitude}` });
                }

                setIsGettingLocation(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                setErrors({
                    location: error.message === 'User denied Geolocation' 
                        ? 'Location access denied. Please enable location in your browser settings.'
                        : 'Failed to get your location. Please try again.',
                });
                setIsGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    // Auto-priority based on type
    useEffect(() => {
        const priorityMap = {
            fire: 4,
            medical: 4,
            accident: 4,
            crime: 4,
            harassment: 3,
            natural_disaster: 4,
            other: 2,
        };
        setFormData(prev => ({ ...prev, priority: priorityMap[formData.type] || 2 }));
    }, [formData.type]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!formData.title.trim()) {
            setErrors({ title: 'Title is required' });
            return;
        }

        if (!formData.description.trim()) {
            setErrors({ description: 'Description is required' });
            return;
        }

        if (!location.latitude || !location.longitude) {
            setErrors({ location: 'Please get your current location first' });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.post(route('emergency.store'), {
                ...formData,
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address,
            });

            if (response.data.success) {
                // Reset form
                setFormData({
                    type: 'other',
                    title: '',
                    description: '',
                    priority: null,
                });
                setLocation({ latitude: null, longitude: null, address: null });
                setIsOpen(false);
                
                // Reload page to show new emergency
                router.reload();
            }
        } catch (error) {
            console.error('Error sending emergency request:', error);
            setErrors({
                submit: error.response?.data?.message || 'Failed to send emergency request. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update emergency status
    const updateStatus = async (emergencyId, status) => {
        try {
            const response = await axios.patch(route('emergency.update', emergencyId), { status });
            if (response.data.success) {
                router.reload();
            }
        } catch (error) {
            console.error('Error updating emergency status:', error);
            alert('Failed to update emergency status');
        }
    };

    const emergencyTypes = [
        { value: 'fire', label: '🔥 Fire', color: 'red' },
        { value: 'medical', label: '🏥 Medical', color: 'red' },
        { value: 'accident', label: '🚗 Accident', color: 'orange' },
        { value: 'crime', label: '🚨 Crime', color: 'red' },
        { value: 'harassment', label: '⚠️ Harassment', color: 'orange' },
        { value: 'natural_disaster', label: '🌪️ Natural Disaster', color: 'red' },
        { value: 'other', label: '🆘 Other', color: 'gray' },
    ];

    const priorityLabels = {
        1: { label: 'Low', color: 'green' },
        2: { label: 'Medium', color: 'yellow' },
        3: { label: 'High', color: 'orange' },
        4: { label: 'Critical', color: 'red' },
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-cyan-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 rounded-full p-2">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Emergency Request Form</h3>
                            <p className="text-sm text-cyan-100">Get help when you need it most</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                    >
                        {isOpen ? 'Close Form' : 'Request Help'}
                    </button>
                </div>
            </div>

            <div className="px-6 py-4 bg-cyan-50 border-b border-cyan-100 text-sm text-cyan-900">
                Only your friends can view your emergency status and you will only see active emergencies from friends. Invite trusted people so you can assist each other faster.
            </div>

            {/* Emergency Form */}
            <Transition
                show={isOpen}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 max-h-0"
                enterTo="opacity-100 max-h-screen"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 max-h-screen"
                leaveTo="opacity-0 max-h-0"
            >
                <div className="p-6 border-b border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Emergency Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Emergency Type *
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                required
                            >
                                {emergencyTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Brief description of the emergency"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                required
                            />
                            {errors.title && <p className="mt-1 text-sm text-cyan-600">{errors.title}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Provide more details about the emergency..."
                                rows="4"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                required
                            />
                            {errors.description && <p className="mt-1 text-sm text-cyan-600">{errors.description}</p>}
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your Location *
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={getCurrentLocation}
                                    disabled={isGettingLocation}
                                    className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isGettingLocation ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Getting Location...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>Get My Location</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            {location.address && (
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">
                                        <strong>📍 Location:</strong> {location.address}
                                    </p>
                                    {location.latitude && location.longitude && (
                                        <a
                                            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-green-600 hover:text-green-700 underline mt-1 inline-block"
                                        >
                                            View on Google Maps →
                                        </a>
                                    )}
                                </div>
                            )}
                            {errors.location && <p className="mt-1 text-sm text-cyan-600">{errors.location}</p>}
                        </div>

                        {/* Priority Display */}
                        {formData.priority && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <strong>Priority:</strong>{' '}
                                    <span className={`font-semibold text-${priorityLabels[formData.priority].color}-600`}>
                                        {priorityLabels[formData.priority].label}
                                    </span>
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !location.latitude}
                            className="w-full bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 hover:from-cyan-700 hover:via-teal-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                        >
                            {isSubmitting ? 'Sending Emergency Request...' : '🚨 Send Emergency Request'}
                        </button>

                        {errors.submit && <p className="text-sm text-cyan-600 text-center">{errors.submit}</p>}
                    </form>
                </div>
            </Transition>

            {/* Active Emergencies */}
            {activeEmergencies.length > 0 && (
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Active Emergencies</h3>
                    <div className="space-y-3">
                        {activeEmergencies.map((emergency) => (
                            <div
                                key={emergency.id}
                                className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold bg-${priorityLabels[emergency.priority]?.color || 'gray'}-500 text-white`}>
                                                {priorityLabels[emergency.priority]?.label || 'Unknown'}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900">{emergency.title}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{emergency.description}</p>
                                        {emergency.google_maps_url && (
                                            <a
                                                href={emergency.google_maps_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-cyan-600 hover:text-cyan-700 underline"
                                            >
                                                📍 {emergency.formatted_location} →
                                            </a>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">{emergency.time_ago}</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => updateStatus(emergency.id, 'resolved')}
                                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-all"
                                        >
                                            Resolve
                                        </button>
                                        <button
                                            onClick={() => updateStatus(emergency.id, 'cancelled')}
                                            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Nearby Emergencies */}
            {nearbyEmergencies.length > 0 && (
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearby Emergencies</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {nearbyEmergencies.map((emergency) => (
                            <div
                                key={emergency.id}
                                className="p-4 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold bg-${priorityLabels[emergency.priority]?.color || 'gray'}-500 text-white`}>
                                                {priorityLabels[emergency.priority]?.label || 'Unknown'}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900">{emergency.title}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">{emergency.description}</p>
                                        <p className="text-xs text-gray-500 mb-2">
                                            <strong>From:</strong> {emergency.user?.name}
                                            {emergency.user?.phone && ` (${emergency.user.phone})`}
                                        </p>
                                        {emergency.google_maps_url && (
                                            <a
                                                href={emergency.google_maps_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-teal-600 hover:text-teal-700 underline"
                                            >
                                                📍 {emergency.formatted_location} →
                                            </a>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">{emergency.time_ago}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeEmergencies.length === 0 && nearbyEmergencies.length === 0 && !isOpen && (
                <div className="p-6 text-center text-gray-500">
                    <p>No active emergencies. Click "Request Help" to send an emergency request.</p>
                </div>
            )}
        </div>
    );
}

