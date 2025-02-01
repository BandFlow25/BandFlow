//src\app\(auth)\profile-setup\page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { createUserProfile, getUserProfile } from '@/lib/services/firebase/auth';

const INSTRUMENTS = [
  'Vocals', 'Guitar', 'Bass', 'Drums', 'Keys',
  'Percussion', 'Saxophone', 'Trumpet', 'Other'
];

export default function ProfileSetup() {
  const { user, isLoading, setProfile } = useAuth(); // Access setProfile from AuthProvider
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isInitialSetup, setIsInitialSetup] = useState(true);
  const [formData, setFormData] = useState({
    displayName: '',
    fullName: '',
    postcode: '',
    avatar: ''
  });

  useEffect(() => {
    async function loadProfile() {
 
  
      if (isLoading) return; // Prevent execution while loading
  
      if (!user) {
        console.warn("No user found. Redirecting to login.");
        router.push('/login');
        return;
      }
  
      try {
        const profile = await getUserProfile(user.uid);
   
  
        if (profile) {
          setFormData({
            displayName: profile.displayName || '',
            fullName: profile.fullName || '',
            postcode: profile.postcode || '',
            avatar: profile.avatar || '',
          });
          setSelectedInstruments(profile.instruments || []);
          setIsInitialSetup(
            !profile.displayName ||
            !profile.fullName ||
            !profile.postcode ||
            profile.instruments.length === 0
          );
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setError("Failed to load profile data");
      }
    }
  
    loadProfile();
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.displayName.trim()) {
      errors.displayName = 'Display Name is required';
    }
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }
    if (!formData.postcode.trim()) {
      errors.postcode = 'Postcode Area is required';
    }
    if (selectedInstruments.length === 0) {
      errors.instruments = 'Please select at least one instrument';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

 // In your profile-setup page's submit handler
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;

  setIsSaving(true);
  setError('');

  try {
    await createUserProfile(user, {
      displayName: formData.displayName,
      fullName: formData.fullName,
      postcode: formData.postcode,
      instruments: selectedInstruments,
      avatar: formData.avatar,
      hasProfile: true,
    });

    // Get and update profile state
    const refreshedProfile = await getUserProfile(user.uid);
    if (refreshedProfile) {
      setProfile(refreshedProfile);
    }

    // Check for pending invite
    const pendingInvite = localStorage.getItem('pendingInvite');
    if (pendingInvite) {
      router.push(`/process-invite/${pendingInvite}`);
    } else {
      router.push('/home');
    }
  } catch (error: any) {
    setError(error.message || 'Failed to update profile');
  } finally {
    setIsSaving(false);
  }
};


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };


  return (
    <main className="min-h-screen flex flex-col bg-gray-900 p-4">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold text-white mb-8 text-center">
          {isInitialSetup ? 'Complete Your Profile' : 'Edit Profile'}
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              {/* {formData.avatar ? (
                <img 
                  src={formData.avatar} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" />
              )} */}
            </div>
            <button
              type="button"
              className="text-orange-500 text-sm hover:text-orange-400 transition-colors"
            >
              Upload photo
            </button>
          </div>

          {/* Basic Info */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-200 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className={`w-full bg-gray-800 border ${validationErrors.displayName ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-2 text-white`}
              placeholder="Band Flow display name?"
              required
            />
            {validationErrors.displayName && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.displayName}</p>
            )}
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-200 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full bg-gray-800 border ${validationErrors.fullName ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-2 text-white`}
              placeholder="Your full name"
              required
            />
            {validationErrors.fullName && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
            )}
          </div>

          {/* Instruments */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              What do you play? *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INSTRUMENTS.map((instrument) => (
                <button
                  key={instrument}
                  type="button"
                  onClick={() => {
                    setSelectedInstruments(prev =>
                      prev.includes(instrument)
                        ? prev.filter(i => i !== instrument)
                        : [...prev, instrument]
                    );
                    if (validationErrors.instruments) {
                      setValidationErrors(prev => ({
                        ...prev,
                        instruments: ''
                      }));
                    }
                  }}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors
                    ${selectedInstruments.includes(instrument)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  {instrument}
                </button>
              ))}
            </div>
            {validationErrors.instruments && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.instruments}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor="postcode" className="block text-sm font-medium text-gray-200 mb-1">
              Postcode Area *
            </label>
            <input
              type="text"
              id="postcode"
              name="postcode"
              value={formData.postcode}
              onChange={handleChange}
              className={`w-full bg-gray-800 border ${validationErrors.postcode ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-2 text-white`}
              placeholder="e.g., SW1"
              required
            />
            {validationErrors.postcode && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.postcode}</p>
            )}
          </div>

          <div className="flex gap-4">
            {!isInitialSetup && (
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className={`${isInitialSetup ? 'w-full' : 'flex-1'} bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors`}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : (isInitialSetup ? 'Complete Profile' : 'Save Changes')}
            </button>
          </div>

          {isInitialSetup && (
            <p className="mt-4 text-center text-sm text-gray-400">
              Profile setup is required to continue
            </p>
          )}
        </form>
      </div>
    </main>
  );
}