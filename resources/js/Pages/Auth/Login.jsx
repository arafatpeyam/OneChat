import Checkbox from '@/components/Checkbox';
import InputError from '@/components/InputError';
import InputLabel from '@/components/InputLabel';
import PrimaryButton from '@/components/PrimaryButton';
import TextInput from '@/components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Login({ status, canResetPassword, csrf_token }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    // Refresh CSRF token when component mounts or when page becomes visible
    useEffect(() => {
        const refreshToken = () => {
            // Update meta tag if csrf_token is provided
            if (csrf_token) {
                const metaTag = document.head.querySelector('meta[name="csrf-token"]');
                if (metaTag) {
                    metaTag.setAttribute('content', csrf_token);
                }
            }
        };

        refreshToken();

        // Refresh token when page becomes visible (user comes back to tab)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                refreshToken();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [csrf_token]);

    const submit = (e) => {
        e.preventDefault();

        // Inertia.js automatically handles CSRF tokens from the meta tag
        // Just ensure the meta tag is updated if we have a fresh token from props
        if (csrf_token) {
            const metaTag = document.head.querySelector('meta[name="csrf-token"]');
            if (metaTag) {
                metaTag.setAttribute('content', csrf_token);
            }
        }

        post(route('login'), {
            onFinish: () => reset('password'),
            onError: (errors) => {
                // Handle 419 CSRF token expired error
                // Check various error formats that Inertia might return
                const has419Error = 
                    (errors?.message && (errors.message.includes('419') || errors.message.includes('CSRF') || errors.message.includes('expired'))) ||
                    (typeof errors === 'string' && errors.includes('419')) ||
                    (errors?.props?.errors?.message && errors.props.errors.message.includes('419'));
                
                if (has419Error) {
                    // Reload page to get fresh CSRF token
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            },
            onSuccess: () => {
                // Clear any stored form data on success
                reset();
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Sign in to your account to continue
                </p>
            </div>

            {status && (
                <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 text-sm font-medium text-green-800">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <InputLabel htmlFor="email" value="Email address" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-2 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <InputLabel htmlFor="password" value="Password" />
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-sm font-medium text-cyan-600 hover:text-cyan-500 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-2 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="flex items-center">
                    <Checkbox
                        name="remember"
                        checked={data.remember}
                        onChange={(e) =>
                            setData('remember', e.target.checked)
                        }
                    />
                    <label className="ml-2 block text-sm text-gray-700 cursor-pointer">
                        Remember me
                    </label>
                </div>

                <div className="pt-4">
                    <PrimaryButton 
                        className="w-full justify-center text-base font-semibold py-3" 
                        disabled={processing}
                    >
                        {processing ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            'Sign in'
                        )}
                    </PrimaryButton>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link
                            href={route('register')}
                            className="font-semibold text-cyan-600 hover:text-cyan-500 transition-colors"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </form>
        </GuestLayout>
    );
}
