import InputError from '@/components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        city: '',
        birth_date: '',
        gender: '',
        blood_group: '',
        donor: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <GuestLayout>
            <Head title="Register" />
            <style>{`
                input[type="date"]::-webkit-calendar-picker-indicator {
                    opacity: 0.6;
                    cursor: pointer;
                }
                input[type="date"]:invalid::-webkit-datetime-edit {
                    color: #9CA3AF;
                }
                input[type="date"]:valid::-webkit-datetime-edit {
                    color: #111827;
                }
                select option:not([value=""]) {
                    color: #111827;
                }
            `}</style>

            <div className="flex flex-col items-center justify-center min-h-[60vh] py-4">
                <div className="w-full max-w-md">
                    {/* Main Form Card */}
                    <div className="bg-white border border-gray-300 rounded-sm px-10 py-5 mb-3">
                        <form onSubmit={submit} className="space-y-3">
                            {/* Required Fields */}
                            <div>
                                <input
                                    id="name"
                                    type="text"
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-sm px-3 py-2.5 w-full focus:outline-none focus:border-gray-400 text-gray-900 placeholder-gray-400"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Full Name *"
                                    required
                                    autoFocus
                                    autoComplete="name"
                                    style={{ color: '#111827' }}
                                />
                                <InputError message={errors.name} className="mt-1 text-xs" />
                            </div>

                            <div>
                                <input
                                    id="email"
                                    type="email"
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-sm px-3 py-2.5 w-full focus:outline-none focus:border-gray-400 text-gray-900 placeholder-gray-400"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Email *"
                                    required
                                    autoComplete="username"
                                    style={{ color: '#111827' }}
                                />
                                <InputError message={errors.email} className="mt-1 text-xs" />
                            </div>

                            <div>
                                <input
                                    id="password"
                                    type="password"
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-sm px-3 py-2.5 w-full focus:outline-none focus:border-gray-400 text-gray-900 placeholder-gray-400"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Password *"
                                    required
                                    autoComplete="new-password"
                                    style={{ color: '#111827' }}
                                />
                                <InputError message={errors.password} className="mt-1 text-xs" />
                            </div>

                            <div>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-sm px-3 py-2.5 w-full focus:outline-none focus:border-gray-400 text-gray-900 placeholder-gray-400"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Confirm Password *"
                                    required
                                    autoComplete="new-password"
                                    style={{ color: '#111827' }}
                                />
                                <InputError message={errors.password_confirmation} className="mt-1 text-xs" />
                            </div>

                            {/* Personal Information */}
                            <div>
                                <input
                                    id="phone"
                                    type="tel"
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-sm px-3 py-2.5 w-full focus:outline-none focus:border-gray-400 text-gray-900 placeholder-gray-400"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="Phone Number *"
                                    required
                                    autoComplete="tel"
                                    style={{ color: '#111827' }}
                                />
                                <InputError message={errors.phone} className="mt-1 text-xs" />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                                <input
                                                    id="birth_date"
                                                    type="date"
                                                    className="bg-gray-50 border border-gray-300 text-sm rounded-sm px-3 py-2.5 w-full focus:outline-none focus:border-gray-400"
                                                    value={data.birth_date}
                                                    onChange={(e) => setData('birth_date', e.target.value)}
                                                    required
                                                    style={{ 
                                                        color: data.birth_date ? '#111827' : '#9CA3AF',
                                                        colorScheme: 'light'
                                                    }}
                                                />
                                    <p className="text-xs text-gray-400 mt-1">Date of Birth *</p>
                                    <InputError message={errors.birth_date} className="mt-1 text-xs" />
                                </div>
                                <select
                                    id="gender"
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-sm px-3 py-2.5 w-full focus:outline-none focus:border-gray-400 text-gray-400"
                                    value={data.gender}
                                    onChange={(e) => setData('gender', e.target.value)}
                                    required
                                    style={{ color: data.gender ? '#111827' : '#9CA3AF' }}
                                >
                                    <option value="" style={{ color: '#9CA3AF' }}>Gender *</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    id="blood_group"
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-sm px-3 py-2.5 w-full focus:outline-none focus:border-gray-400 text-gray-400"
                                    value={data.blood_group}
                                    onChange={(e) => setData('blood_group', e.target.value)}
                                    required
                                    style={{ color: data.blood_group ? '#111827' : '#9CA3AF' }}
                                >
                                    <option value="" style={{ color: '#9CA3AF' }}>Blood Group *</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                                <InputError message={errors.blood_group} className="mt-1 text-xs" />
                            </div>

                            <div>
                                <select
                                    id="donor"
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-sm px-3 py-2.5 w-full focus:outline-none focus:border-gray-400 text-gray-400"
                                    value={data.donor}
                                    onChange={(e) => setData('donor', e.target.value)}
                                    required
                                    style={{ color: data.donor ? '#111827' : '#9CA3AF' }}
                                >
                                    <option value="" style={{ color: '#9CA3AF' }}>Donor *</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                                <InputError message={errors.donor} className="mt-1 text-xs" />
                            </div>

                            {/* Location Information */}
                            <div>
                                <select
                                    id="city"
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-sm px-3 py-2.5 w-full focus:outline-none focus:border-gray-400 text-gray-400"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    required
                                    style={{ color: data.city ? '#111827' : '#9CA3AF' }}
                                >
                                    <option value="" style={{ color: '#9CA3AF' }}>Select City *</option>
                                    <option value="Bagerhat">Bagerhat</option>
                                    <option value="Bandarban">Bandarban</option>
                                    <option value="Barisal">Barisal</option>
                                    <option value="Barguna">Barguna</option>
                                    <option value="Bhola">Bhola</option>
                                    <option value="Bogra">Bogra</option>
                                    <option value="Brahmanbaria">Brahmanbaria</option>
                                    <option value="Chandpur">Chandpur</option>
                                    <option value="Chapai Nawabganj">Chapai Nawabganj</option>
                                    <option value="Chittagong">Chittagong</option>
                                    <option value="Chuadanga">Chuadanga</option>
                                    <option value="Comilla">Comilla</option>
                                    <option value="Cox's Bazar">Cox's Bazar</option>
                                    <option value="Dhaka">Dhaka</option>
                                    <option value="Dinajpur">Dinajpur</option>
                                    <option value="Faridpur">Faridpur</option>
                                    <option value="Feni">Feni</option>
                                    <option value="Gaibandha">Gaibandha</option>
                                    <option value="Gazipur">Gazipur</option>
                                    <option value="Gopalganj">Gopalganj</option>
                                    <option value="Habiganj">Habiganj</option>
                                    <option value="Jamalpur">Jamalpur</option>
                                    <option value="Jashore">Jashore</option>
                                    <option value="Jessore">Jessore</option>
                                    <option value="Jhalokati">Jhalokati</option>
                                    <option value="Jhenaidah">Jhenaidah</option>
                                    <option value="Joypurhat">Joypurhat</option>
                                    <option value="Khagrachhari">Khagrachhari</option>
                                    <option value="Khulna">Khulna</option>
                                    <option value="Kishoreganj">Kishoreganj</option>
                                    <option value="Kurigram">Kurigram</option>
                                    <option value="Kushtia">Kushtia</option>
                                    <option value="Lakshmipur">Lakshmipur</option>
                                    <option value="Lalmonirhat">Lalmonirhat</option>
                                    <option value="Madaripur">Madaripur</option>
                                    <option value="Magura">Magura</option>
                                    <option value="Manikganj">Manikganj</option>
                                    <option value="Meherpur">Meherpur</option>
                                    <option value="Moulvibazar">Moulvibazar</option>
                                    <option value="Munshiganj">Munshiganj</option>
                                    <option value="Mymensingh">Mymensingh</option>
                                    <option value="Naogaon">Naogaon</option>
                                    <option value="Narail">Narail</option>
                                    <option value="Narayanganj">Narayanganj</option>
                                    <option value="Narsingdi">Narsingdi</option>
                                    <option value="Natore">Natore</option>
                                    <option value="Netrokona">Netrokona</option>
                                    <option value="Nilphamari">Nilphamari</option>
                                    <option value="Noakhali">Noakhali</option>
                                    <option value="Pabna">Pabna</option>
                                    <option value="Panchagarh">Panchagarh</option>
                                    <option value="Patuakhali">Patuakhali</option>
                                    <option value="Pirojpur">Pirojpur</option>
                                    <option value="Rajshahi">Rajshahi</option>
                                    <option value="Rangamati">Rangamati</option>
                                    <option value="Rangpur">Rangpur</option>
                                    <option value="Saidpur">Saidpur</option>
                                    <option value="Satkhira">Satkhira</option>
                                    <option value="Shariatpur">Shariatpur</option>
                                    <option value="Sherpur">Sherpur</option>
                                    <option value="Sirajganj">Sirajganj</option>
                                    <option value="Sunamganj">Sunamganj</option>
                                    <option value="Sylhet">Sylhet</option>
                                    <option value="Tangail">Tangail</option>
                                    <option value="Thakurgaon">Thakurgaon</option>
                                </select>
                                <InputError message={errors.city} className="mt-1 text-xs" />
                            </div>

                            {/* Submit Button */}
                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm py-1.5 px-4 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {processing ? 'Signing up...' : 'Sign up'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Login Link Card */}
                    <div className="bg-white border border-gray-300 rounded-sm px-10 py-4 text-center">
                        <p className="text-sm text-gray-900">
                            Have an account?{' '}
                            <Link
                                href={route('login')}
                                className="text-blue-500 font-semibold hover:text-blue-600"
                            >
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
