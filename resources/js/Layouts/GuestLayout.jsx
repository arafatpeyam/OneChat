import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-cyan-600 via-teal-500 to-blue-600 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8">
                <Link href="/" className="group">
                    <div className="flex items-center space-x-3">
                        <div>
                            <h1 className="text-2xl font-medium bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 bg-clip-text text-transparent group-hover:from-cyan-700 group-hover:via-teal-600 group-hover:to-blue-700 transition-all duration-200" style={{
                                WebkitTextStroke: '1px white',
                                textStroke: '1px white'
                            }}>
                                OneChat
                            </h1>
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
