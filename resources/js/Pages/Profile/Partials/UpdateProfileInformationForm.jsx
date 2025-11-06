import InputError from '@/components/InputError';
import InputLabel from '@/components/InputLabel';
import PrimaryButton from '@/components/PrimaryButton';
import TextInput from '@/components/TextInput';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage, router } from '@inertiajs/react';
import { useRef, useState, useEffect } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(
        user.image ? (user.image.startsWith('http') ? user.image : `/storage/${user.image}`) : null
    );

    // Update preview when user image changes (after successful update)
    useEffect(() => {
        if (user.image && !imagePreview) {
            setImagePreview(user.image.startsWith('http') ? user.image : `/storage/${user.image}`);
        }
    }, [user.image]);

    // Format birth_date for date input
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            image: undefined, // Start with undefined, only set when file is selected
            address: user.address || '',
            about: user.about || '',
            city: user.city || '',
            state: user.state || '',
            zip: user.zip || '',
            birth_date: formatDateForInput(user.birth_date),
            gender: user.gender || '',
            occupation: user.occupation || '',
            hobbies: user.hobbies || '',
            blood_group: user.blood_group || '',
        });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setData('image', undefined);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit = (e) => {
        e.preventDefault();

        // Ensure name and email are not empty (trim whitespace)
        const trimmedName = (data.name || '').trim();
        const trimmedEmail = (data.email || '').trim();

        if (!trimmedName || !trimmedEmail) {
            // This shouldn't happen if fields are filled, but add safety check
            console.error('Name or email is empty:', { name: trimmedName, email: trimmedEmail });
            return;
        }

        // Check if there's an image file to upload - capture it BEFORE any setData calls
        const imageFile = data.image instanceof File ? data.image : null;
        const hasImageFile = !!imageFile;
        
        // Debug log
        console.log('Submitting form:', {
            hasImage: hasImageFile,
            imageType: imageFile ? typeof imageFile : 'none',
            imageIsFile: imageFile instanceof File,
            imageName: imageFile ? imageFile.name : 'none',
            imageSize: imageFile ? imageFile.size : 0,
        });

        // Update form data with trimmed values
        // Update all fields at once to ensure consistency
        const updatedData = {
            name: trimmedName,
            email: trimmedEmail,
            phone: (data.phone || '').trim() || '',
            address: (data.address || '').trim() || '',
            about: (data.about || '').trim() || '',
            city: (data.city || '').trim() || '',
            state: (data.state || '').trim() || '',
            zip: (data.zip || '').trim() || '',
            birth_date: data.birth_date || '',
            gender: data.gender || '',
            occupation: (data.occupation || '').trim() || '',
            hobbies: (data.hobbies || '').trim() || '',
            blood_group: data.blood_group || '',
        };

        // Update form data state (for UI updates)
        setData(updatedData);

        // Prepare the data to send - include image file if it exists
        const dataToSend = { ...updatedData };
        if (hasImageFile) {
            dataToSend.image = imageFile;
        }

        // Use router.patch directly to ensure image is included in the request
        // This gives us full control over what gets sent
        router.patch(route('profile.update'), dataToSend, {
            forceFormData: hasImageFile, // Only use FormData when there's an image
            preserveScroll: true,
            onSuccess: () => {
                // Update form data state to reflect successful submission
                setData(updatedData);
                // Reset image input after successful upload
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                // Reset image in form data
                setData('image', undefined);
            },
            onError: (errors) => {
                console.error('Profile update errors:', errors);
                console.error('Has image file:', hasImageFile);
                if (imageFile) {
                    console.error('Image file details:', {
                        name: imageFile.name,
                        size: imageFile.size,
                        type: imageFile.type,
                    });
                }
            },
        });
    };

    return (
        <section className={className}>
            {/* Modern Header */}
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-md">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Profile Information
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Update your account's profile information and email address.
                        </p>
                    </div>
                </div>
            </header>

            <form onSubmit={submit} className="space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100">
                            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="name" value="Full Name" />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="name"
                                    className="pl-12"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    isFocused
                                    autoComplete="name"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <InputError className="mt-1" message={errors.name} />
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="email" value="Email Address" />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="pl-12"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                    placeholder="Enter your email address"
                                />
                            </div>
                            <InputError className="mt-1" message={errors.email} />
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="phone" value="Phone Number" />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="phone"
                                    type="tel"
                                    className="pl-12"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    autoComplete="tel"
                                    placeholder="Enter your phone number"
                                />
                            </div>
                            <InputError className="mt-1" message={errors.phone} />
                        </div>

                        {/* Profile Image Upload */}
                        <div className="space-y-2 md:col-span-2">
                            <InputLabel htmlFor="image" value="Profile Image" />
                            <div className="flex items-start gap-6">
                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                                            <img
                                                src={imagePreview}
                                                alt="Profile preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Upload Area */}
                                <div className="flex-1">
                                    <div className="relative">
                                        <input
                                            ref={fileInputRef}
                                            id="image"
                                            type="file"
                                            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="image"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-indigo-400 cursor-pointer transition-all duration-200 group"
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <svg className="w-10 h-10 mb-3 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="mb-2 text-sm text-gray-500">
                                                    <span className="font-semibold text-indigo-600 group-hover:text-indigo-700">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500">PNG, JPG, GIF or WEBP (MAX. 2MB)</p>
                                            </div>
                                        </label>
                                    </div>
                                    <InputError className="mt-2" message={errors.image} />
                                    {!imagePreview && user.image && (
                                        <p className="mt-2 text-xs text-gray-500">
                                            Current image: {user.image.startsWith('http') ? user.image : `/storage/${user.image}`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Information Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Birth Date Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="birth_date" value="Date of Birth" />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="birth_date"
                                    type="date"
                                    className="pl-12"
                                    value={data.birth_date}
                                    onChange={(e) => setData('birth_date', e.target.value)}
                                />
                            </div>
                            <InputError className="mt-1" message={errors.birth_date} />
                        </div>

                        {/* Gender Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="gender" value="Gender" />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </div>
                                <Select
                                    id="gender"
                                    className="pl-12"
                                    value={data.gender}
                                    onChange={(e) => setData('gender', e.target.value)}
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </Select>
                            </div>
                            <InputError className="mt-1" message={errors.gender} />
                        </div>

                        {/* Blood Group Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="blood_group" value="Blood Group" />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <Select
                                    id="blood_group"
                                    className="pl-12"
                                    value={data.blood_group}
                                    onChange={(e) => setData('blood_group', e.target.value)}
                                >
                                    <option value="">Select blood group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </Select>
                            </div>
                            <InputError className="mt-1" message={errors.blood_group} />
                        </div>
                    </div>

                    {/* About Field */}
                    <div className="space-y-2">
                        <InputLabel htmlFor="about" value="About Me" />
                        <Textarea
                            id="about"
                            rows={4}
                            value={data.about}
                            onChange={(e) => setData('about', e.target.value)}
                            placeholder="Tell us about yourself..."
                        />
                        <InputError className="mt-1" message={errors.about} />
                    </div>
                </div>

                {/* Location Information Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100">
                            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Address Field */}
                        <div className="space-y-2 md:col-span-2">
                            <InputLabel htmlFor="address" value="Street Address" />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="address"
                                    className="pl-12"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Enter your street address"
                                />
                            </div>
                            <InputError className="mt-1" message={errors.address} />
                        </div>

                        {/* City Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="city" value="City" />
                            <TextInput
                                id="city"
                                value={data.city}
                                onChange={(e) => setData('city', e.target.value)}
                                placeholder="Enter your city"
                            />
                            <InputError className="mt-1" message={errors.city} />
                        </div>

                        {/* State Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="state" value="State" />
                            <TextInput
                                id="state"
                                value={data.state}
                                onChange={(e) => setData('state', e.target.value)}
                                placeholder="Enter your state"
                            />
                            <InputError className="mt-1" message={errors.state} />
                        </div>

                        {/* ZIP Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="zip" value="ZIP Code" />
                            <TextInput
                                id="zip"
                                value={data.zip}
                                onChange={(e) => setData('zip', e.target.value)}
                                placeholder="Enter ZIP code"
                            />
                            <InputError className="mt-1" message={errors.zip} />
                        </div>
                    </div>
                </div>

                {/* Professional Information Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100">
                            <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Occupation Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="occupation" value="Occupation" />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="occupation"
                                    className="pl-12"
                                    value={data.occupation}
                                    onChange={(e) => setData('occupation', e.target.value)}
                                    placeholder="Enter your occupation"
                                />
                            </div>
                            <InputError className="mt-1" message={errors.occupation} />
                        </div>

                        {/* Hobbies Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="hobbies" value="Hobbies" />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="hobbies"
                                    className="pl-12"
                                    value={data.hobbies}
                                    onChange={(e) => setData('hobbies', e.target.value)}
                                    placeholder="e.g., Reading, Swimming, Photography"
                                />
                            </div>
                            <InputError className="mt-1" message={errors.hobbies} />
                        </div>
                    </div>
                </div>

                {/* Email Verification Notice */}
                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-amber-800 mb-1">
                                    Your email address is unverified.
                                </p>
                                <p className="text-sm text-amber-700">
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="font-semibold underline hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded transition-colors"
                                    >
                                        Click here to re-send the verification email.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        A new verification link has been sent to your email address.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center gap-4 pt-4">
                    <PrimaryButton disabled={processing} className="min-w-[120px]">
                        {processing ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save Changes
                            </span>
                        )}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-out duration-300"
                        enterFrom="opacity-0 translate-x-[-10px]"
                        enterTo="opacity-100 translate-x-0"
                        leave="transition ease-in duration-200"
                        leaveFrom="opacity-100 translate-x-0"
                        leaveTo="opacity-0 translate-x-[-10px]"
                    >
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved successfully!
                        </div>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
