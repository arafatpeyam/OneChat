import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from '@/bootstrap';

export default function FindDonors() {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchBloodGroup, setSearchBloodGroup] = useState('');
    const [searchCity, setSearchCity] = useState('');
    const [filteredDonors, setFilteredDonors] = useState([]);

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    useEffect(() => {
        fetchDonors();
    }, []);

    const fetchDonors = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchBloodGroup) params.append('blood_group', searchBloodGroup);
            if (searchCity) params.append('city', searchCity);
            
            const response = await axios.get(`/api/blood-donors?${params.toString()}`);
            if (response.data.success) {
                const fetchedDonors = response.data.donors;
                setDonors(fetchedDonors);
                setFilteredDonors(fetchedDonors);
            }
        } catch (error) {
            console.error('Error fetching donors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchDonors();
    };

    const handleClear = () => {
        setSearchBloodGroup('');
        setSearchCity('');
        fetchDonors();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Find Blood Donors</h2>
                        <p className="text-gray-600 mt-1">Search for available blood donors by blood group and city</p>
                    </div>
                </div>
            }
        >
            <Head title="Find Blood Donors" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-6 text-sm text-cyan-900">
                        <strong>Friend visibility:</strong> You only see blood donors who are in your friend list (plus your own profile). Add friends to discover more available donors.
                    </div>

                    {/* Search Filters */}
                    <div className="bg-white rounded-xl shadow-lg border border-cyan-200 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Blood Group Filter */}
                            <div>
                                <label htmlFor="blood_group" className="block text-sm font-medium text-gray-700 mb-2">
                                    Blood Group
                                </label>
                                <select
                                    id="blood_group"
                                    value={searchBloodGroup}
                                    onChange={(e) => setSearchBloodGroup(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    <option value="">All Blood Groups</option>
                                    {bloodGroups.map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>

                            {/* City Filter */}
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                    City
                                </label>
                                <input
                                    type="text"
                                    id="city"
                                    value={searchCity}
                                    onChange={(e) => setSearchCity(e.target.value)}
                                    placeholder="Enter city name"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleSearch}
                                    className="flex-1 bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 hover:from-cyan-700 hover:via-teal-600 hover:to-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg"
                                >
                                    Search
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2.5 rounded-lg transition-all"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    {loading ? (
                        <div className="bg-white rounded-xl shadow-lg border border-cyan-200 p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading donors...</p>
                        </div>
                    ) : filteredDonors.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-lg border border-cyan-200 p-12 text-center">
                            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Donors Found</h3>
                            <p className="text-gray-500">
                                {searchBloodGroup || searchCity 
                                    ? 'Try adjusting your search filters'
                                    : 'No blood donors are currently available'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDonors.map((donor) => (
                                <div
                                    key={donor.id}
                                    className="bg-white rounded-xl shadow-lg border border-cyan-200 p-6 hover:shadow-xl transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                {donor.user_name}
                                            </h3>
                                            <p className="text-sm text-gray-500">{donor.user_email}</p>
                                        </div>
                                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                                            {donor.blood_group}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-sm">{donor.city || 'City not specified'}</span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span className="text-sm">{donor.contact_phone || 'Phone not available'}</span>
                                        </div>
                                        {donor.next_available_date && (
                                            <div className="flex items-center text-gray-600">
                                                <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-sm">Available from: {new Date(donor.next_available_date).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            donor.is_available 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {donor.is_available ? 'Available' : 'Not Available'}
                                        </span>
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

