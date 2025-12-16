import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmergencyPanel from '@/components/EmergencyPanel';
import { Head } from '@inertiajs/react';

export default function EmergencyIndex({ activeEmergencies = [], nearbyEmergencies = [] }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-500 to-blue-600 p-6 shadow-xl">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white blur-3xl"></div>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg ring-2 ring-white/30">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white">Emergency Platform</h2>
                                <p className="text-sm text-cyan-100/80 mt-1">Get help when you need it most</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Emergency Platform" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <EmergencyPanel 
                        activeEmergencies={activeEmergencies}
                        nearbyEmergencies={nearbyEmergencies}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

