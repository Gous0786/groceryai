import React, { useState, useEffect } from 'react'
import { X, User, Mail, Phone, MapPin, Calendar, Edit2, Save, Camera } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface ProfileProps {
  isOpen: boolean
  onClose: () => void
}

interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  address?: string
  avatar_url?: string
  created_at: string
}

const Profile: React.FC<ProfileProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useApp()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: ''
  })

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Disable body scroll
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '0px'
    } else {
      // Re-enable body scroll
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = '0px'
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = '0px'
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile()
    }
  }, [isOpen, user])

  const fetchProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get user profile from auth.users metadata
      const { data: authUser, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        toast.error('Failed to fetch profile')
        return
      }

      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        full_name: authUser.user?.user_metadata?.full_name || '',
        phone: authUser.user?.user_metadata?.phone || '',
        address: authUser.user?.user_metadata?.address || '',
        avatar_url: authUser.user?.user_metadata?.avatar_url || '',
        created_at: authUser.user?.created_at || ''
      }

      setProfile(userProfile)
      setFormData({
        full_name: userProfile.full_name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    // Validate required fields for orders
    if (!formData.phone.trim() || formData.phone.trim().length < 10) {
      toast.error('Please enter a valid phone number (at least 10 digits)')
      return
    }

    if (!formData.address.trim() || formData.address.trim().length < 10) {
      toast.error('Please enter a complete delivery address (at least 10 characters)')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim()
        }
      })

      if (error) {
        toast.error('Failed to update profile')
        return
      }

      toast.success('Profile updated successfully!')
      setIsEditing(false)
      await fetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isProfileComplete = profile?.phone && profile?.address && 
                           profile.phone.length >= 10 && profile.address.length >= 10

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base">Loading profile...</p>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 sm:p-2 shadow-lg border hover:bg-gray-50 transition-colors">
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                  </button>
                </div>
                <h3 className="mt-4 text-lg sm:text-xl font-semibold text-gray-800">
                  {profile.full_name || 'User'}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">{profile.email}</p>
                
                {/* Profile Completion Status */}
                <div className="mt-3">
                  {isProfileComplete ? (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      ✓ Profile Complete - Ready for Orders
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                      ⚠ Complete profile to place orders
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-800">Personal Information</h4>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-1 sm:space-x-2 text-green-500 hover:text-green-600 transition-colors text-sm sm:text-base"
                  >
                    <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Full Name */}
                  <div className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">Full Name</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-gray-800 text-sm sm:text-base">{profile.full_name || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">Email</span>
                    </div>
                    <p className="text-gray-800 text-sm sm:text-base">{profile.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Phone - Required for Orders */}
                  <div className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">
                        Phone Number *
                        <span className="text-xs text-green-600 ml-1">(Required for orders)</span>
                      </span>
                    </div>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="Enter your phone number (10+ digits)"
                        required
                      />
                    ) : (
                      <p className="text-gray-800 text-sm sm:text-base">
                        {profile.phone || (
                          <span className="text-red-500 italic">Required for placing orders</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Address - Required for Orders */}
                  <div className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">
                        Delivery Address *
                        <span className="text-xs text-green-600 ml-1">(Required for orders)</span>
                      </span>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                        rows={3}
                        placeholder="Enter your complete delivery address (street, area, city, pincode)"
                        required
                      />
                    ) : (
                      <p className="text-gray-800 text-sm sm:text-base">
                        {profile.address || (
                          <span className="text-red-500 italic">Required for placing orders</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Member Since */}
                  <div className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">Member Since</span>
                    </div>
                    <p className="text-gray-800 text-sm sm:text-base">{formatDate(profile.created_at)}</p>
                  </div>
                </div>

                {/* Save Button */}
                {isEditing && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-green-500 text-white py-2 sm:py-3 px-4 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                )}

                {/* Profile Completion Notice */}
                {!isProfileComplete && !isEditing && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h5 className="font-semibold text-yellow-800 mb-2">Complete Your Profile</h5>
                    <p className="text-yellow-700 text-sm mb-3">
                      To place orders, please add your phone number and delivery address. 
                      This information will be automatically used for all future orders.
                    </p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors text-sm"
                    >
                      Complete Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm sm:text-base">Failed to load profile</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t flex-shrink-0">
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500 text-white py-2 sm:py-3 px-4 rounded-md hover:bg-red-600 transition-colors text-sm sm:text-base"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile