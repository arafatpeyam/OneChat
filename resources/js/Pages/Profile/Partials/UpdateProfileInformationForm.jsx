import InputError from '@/components/InputError';
import InputLabel from '@/components/InputLabel';
import PrimaryButton from '@/components/PrimaryButton';
import TextInput from '@/components/TextInput';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage, router } from '@inertiajs/react';
import { useRef, useState, useEffect } from 'react';

const CITY_OPTIONS = [
    'Bagerhat',
    'Bandarban',
    'Barisal',
    'Barguna',
    'Bhola',
    'Bogra',
    'Brahmanbaria',
    'Chandpur',
    'Chapai Nawabganj',
    'Chittagong',
    'Chuadanga',
    'Comilla',
    "Cox's Bazar",
    'Dhaka',
    'Dinajpur',
    'Faridpur',
    'Feni',
    'Gaibandha',
    'Gazipur',
    'Gopalganj',
    'Habiganj',
    'Jamalpur',
    'Jashore',
    'Jessore',
    'Jhalokati',
    'Jhenaidah',
    'Joypurhat',
    'Khagrachhari',
    'Khulna',
    'Kishoreganj',
    'Kurigram',
    'Kushtia',
    'Lakshmipur',
    'Lalmonirhat',
    'Madaripur',
    'Magura',
    'Manikganj',
    'Meherpur',
    'Moulvibazar',
    'Munshiganj',
    'Mymensingh',
    'Naogaon',
    'Narail',
    'Narayanganj',
    'Narsingdi',
    'Natore',
    'Netrokona',
    'Nilphamari',
    'Noakhali',
    'Pabna',
    'Panchagarh',
    'Patuakhali',
    'Pirojpur',
    'Rajshahi',
    'Rangamati',
    'Rangpur',
    'Saidpur',
    'Satkhira',
    'Shariatpur',
    'Sherpur',
    'Sirajganj',
    'Sunamganj',
    'Sylhet',
    'Tangail',
    'Thakurgaon',
];

const DONOR_OPTIONS = [
    { value: 'yes', label: 'Yes, I can donate' },
    { value: 'no', label: 'No, not right now' },
];

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const fileInputRef = useRef(null);
    
    // Helper function to get image URL
    const getImageUrl = (imagePath, addCacheBust = false) => {
        if (!imagePath) return null;
        let url;
        if (imagePath.startsWith('http')) {
            url = imagePath;
        } else if (imagePath.startsWith('/storage/')) {
            url = imagePath;
        } else {
            url = `/storage/${imagePath}`;
        }
        // Add cache busting parameter only when explicitly requested (e.g., after upload)
        if (addCacheBust) {
            return url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
        }
        return url;
    };

    const [imagePreview, setImagePreview] = useState(getImageUrl(user.image, false));

    // Update preview when user image changes (after successful update)
    useEffect(() => {
        // Only update if we don't have a file selected (to avoid resetting when user selects new file)
        if (!(data.image instanceof File)) {
            if (user.image) {
                const imageUrl = getImageUrl(user.image, false); // No cache busting for initial load
                // Remove cache busting from current preview for comparison
                const currentPreviewBase = imagePreview?.split('?')[0]?.split('&')[0];
                const newImageBase = imageUrl?.split('?')[0]?.split('&')[0];
                // Only update if the base path changed
                if (currentPreviewBase !== newImageBase) {
                    setImagePreview(imageUrl);
                }
            } else if (imagePreview) {
                // If user has no image but we have a preview, clear it
                setImagePreview(null);
            }
        }
    }, [user.image]); // Watch user.image for changes

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
            donor: user.donor || 'no', // Default to 'no' if not set (required field)
        });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size must be less than 2MB');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

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
        // Reset to user's current image if exists, otherwise null
        const imageUrl = getImageUrl(user.image);
        setImagePreview(imageUrl);
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

        // Check if there's an image file to upload
        const imageFile = data.image instanceof File ? data.image : null;
        const hasImageFile = !!imageFile;
        
        // Prepare all form data with trimmed values and ensure required fields are present
        // Update form data state with all values first
        const updatedFormData = {
            name: trimmedName,
            email: trimmedEmail,
            phone: (data.phone || '').trim() || null,
            address: (data.address || '').trim() || null,
            about: (data.about || '').trim() || null,
            city: (data.city || '').trim() || null,
            state: (data.state || '').trim() || null,
            zip: (data.zip || '').trim() || null,
            birth_date: data.birth_date || null,
            gender: data.gender || null,
            occupation: (data.occupation || '').trim() || null,
            hobbies: (data.hobbies || '').trim() || null,
            blood_group: data.blood_group || null,
            donor: (data.donor && data.donor !== '') ? data.donor : 'no', // Ensure donor is always set (required field)
            image: imageFile || undefined, // Keep image file if it exists
        };

        // Update form data state first
        setData(updatedFormData);

        // Use router.patch directly with the prepared data to ensure all fields are included
        router.patch(route('profile.update'), updatedFormData, {
            forceFormData: hasImageFile, // Use FormData when there's an image
            preserveScroll: true,
            onSuccess: (page) => {
                // Reset image input after successful upload
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                
                // Reset image in form data first (keep other fields)
                setData('image', undefined);
                
                // Get updated user from the page props (refreshed by HandleInertiaRequests)
                const updatedUser = page.props.auth?.user;
                
                // Update preview with the new image from the server response
                // Add cache busting to force browser to reload the new image
                if (updatedUser?.image) {
                    const newImageUrl = getImageUrl(updatedUser.image, true); // Add cache busting
                    setImagePreview(newImageUrl);
                    console.log('Image updated successfully:', newImageUrl);
                } else {
                    // If no image, show placeholder
                    setImagePreview(null);
                }
            },
            onError: (errors) => {
                console.error('Profile update errors:', errors);
                console.error('Form data being sent:', updatedFormData);
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 via-teal-100 to-blue-100 shadow-md">
                        <svg className="h-6 w-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 bg-clip-text text-transparent">
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-100 via-teal-100 to-blue-100">
                            <svg className="h-5 w-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <InputLabel htmlFor="image" value="Profile Avatar (Single Upload)" />
                            <div className="flex items-start gap-6">
                                {/* Image Preview */}
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md bg-gray-100 flex items-center justify-center">
                                        {imagePreview ? (
                                            <img
                                                key={imagePreview} // Force re-render when image changes
                                                src={imagePreview}
                                                alt="Profile avatar"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback if image fails to load
                                                    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0ea5e9&color=fff&size=128`;
                                                    if (e.target.src !== fallbackUrl) {
                                                        e.target.src = fallbackUrl;
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-teal-600 text-white text-3xl font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    {data.image instanceof File && (
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors cursor-pointer z-10"
                                            title="Remove new image"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

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
                                            // Ensure only single file upload
                                        />
                                        <label
                                            htmlFor="image"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-cyan-400 cursor-pointer transition-all duration-200 group"
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <svg className="w-10 h-10 mb-3 text-gray-400 group-hover:text-cyan-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="mb-2 text-sm text-gray-500">
                                                    <span className="font-semibold text-cyan-600 group-hover:text-cyan-700">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500">PNG, JPG, GIF or WEBP (MAX. 2MB)</p>
                                            </div>
                                        </label>
                                    </div>
                                    <InputError className="mt-2" message={errors.image} />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Upload a single profile picture. Maximum file size: 2MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Information Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-cyan-100">
                            <svg className="h-5 w-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                        {/* Donor Field */}
                        <div className="space-y-2">
                            <InputLabel htmlFor="donor" value="Blood Donor" />
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.313 0-2.5.402-3.5 1.086A4.002 4.002 0 005 13a4 4 0 006.2 3.356L12 16l.8.356A4 4 0 0019 13a4.002 4.002 0 00-3.5-3.914A5.977 5.977 0 0012 8z" />
                                    </svg>
                                </div>
                                <Select
                                    id="donor"
                                    className="pl-12"
                                    value={data.donor}
                                    onChange={(e) => setData('donor', e.target.value)}
                                    required
                                >
                                    <option value="">Select donor preference</option>
                                    {DONOR_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <InputError className="mt-1" message={errors.donor} />
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
                            <Select
                                id="city"
                                value={data.city}
                                onChange={(e) => setData('city', e.target.value)}
                                required
                            >
                                <option value="">Select your city</option>
                                {CITY_OPTIONS.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </Select>
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
