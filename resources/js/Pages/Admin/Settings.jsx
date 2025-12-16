import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from '@/bootstrap';

export default function AdminSettings() {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isToggling, setIsToggling] = useState(false);

    useEffect(() => {
        fetchMaintenanceStatus();
    }, []);

    const fetchMaintenanceStatus = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(route('admin.maintenance.status'));
            if (response.data.success) {
                setMaintenanceMode(response.data.maintenance_mode);
            }
        } catch (error) {
            console.error('Error fetching maintenance status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleMaintenance = async () => {
        setIsToggling(true);
        try {
            const response = await axios.post(route('admin.maintenance.toggle'));
            if (response.data.success) {
                setMaintenanceMode(response.data.maintenance_mode);
            }
        } catch (error) {
            console.error('Error toggling maintenance mode:', error);
            alert('Failed to toggle maintenance mode. Please try again.');
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-600 via-slate-600 to-zinc-600 p-6 shadow-xl">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white blur-3xl"></div>
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-lg">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white">System Settings</h2>
                                <p className="text-sm text-white/80 mt-1">Manage system configuration</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.dashboard')}
                            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-medium text-sm cursor-pointer"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="System Settings" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Maintenance Mode</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {maintenanceMode 
                                        ? 'System is currently under maintenance. Users will see a maintenance message.'
                                        : 'System is running normally. Enable maintenance mode to perform updates.'}
                                </p>
                            </div>
                            <button
                                onClick={handleToggleMaintenance}
                                disabled={isToggling || isLoading}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer ${
                                    maintenanceMode ? 'bg-orange-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        {maintenanceMode && (
                            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-sm text-orange-800">
                                    ⚠️ Maintenance mode is active. Regular users will not be able to access the system.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

