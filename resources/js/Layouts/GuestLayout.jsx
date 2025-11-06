import ApplicationLogo from '@/components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8">
                <Link href="/" className="group">
                    <div className="flex items-center space-x-3">
                        <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-xl">
                            <ApplicationLogo className="h-10 w-10 fill-current text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">One Chat</h1>
                            <p className="text-sm text-gray-600">Connect with your world</p>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg px-8 py-10 shadow-2xl ring-1 ring-black/5 transition-all duration-300 hover:shadow-3xl sm:px-10">
                {children}
            </div>
        </div>
    );
}
