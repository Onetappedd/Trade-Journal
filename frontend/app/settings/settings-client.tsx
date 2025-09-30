"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  BarChart3,
  Settings,
  Bell,
  Search,
  User,
  Camera,
  Trash2,
  Shield,
  Palette,
  Globe,
  Download,
  Upload,
  X,
  Edit3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Smartphone,
  Monitor,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  Save,
  LogOut,
  CreditCard,
  Database,
  FileText,
} from "lucide-react"
import { useAuth } from "@/providers/auth-provider"

interface ProfileData {
  id: string
  email: string
  firstName: string
  lastName: string
  username: string
  bio: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

interface SecurityData {
  twoFactorEnabled: boolean
  sessions: Array<{
    id: string
    device: string
    location: string
    lastActive: string
    current: boolean
  }>
}

interface DataStats {
  totalTrades: number
  lastExport: string | null
  accountCreated: string
}

export default function SettingsPageClient() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState({
    profile: false,
    security: false,
    preferences: false,
  })

  const [activeSection, setActiveSection] = useState<string | null>("profile")
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [securityData, setSecurityData] = useState<SecurityData | null>(null)
  const [dataStats, setDataStats] = useState<DataStats | null>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    bio: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [preferences, setPreferences] = useState({
    theme: "dark",
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      profilePublic: false,
      showTrades: false,
    },
  })

  const [sessions] = useState([
    {
      id: "1",
      device: "MacBook Pro",
      location: "San Francisco, CA",
      lastActive: "2 hours ago",
      current: true,
    },
    {
      id: "2",
      device: "iPhone 15 Pro",
      location: "San Francisco, CA",
      lastActive: "1 day ago",
      current: false,
    },
    {
      id: "3",
      device: "Chrome on Windows",
      location: "New York, NY",
      lastActive: "3 days ago",
      current: false,
    },
  ])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Load data when component mounts
  useEffect(() => {
    loadProfileData()
    loadSecurityData()
    loadDataStats()
  }, [])

  const loadProfileData = async () => {
    try {
      const response = await fetch('/api/settings/profile')
      const result = await response.json()
      
      if (result.success) {
        setProfileData(result.data)
        setFormData({
          firstName: result.data.firstName || '',
          lastName: result.data.lastName || '',
          username: result.data.username || '',
          email: result.data.email || user?.email || '',
          bio: result.data.bio || '',
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        // If no profile exists, use user data from auth
        setFormData({
          firstName: '',
          lastName: '',
          username: '',
          email: user?.email || '',
          bio: '',
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }
    } catch (error) {
      console.error('Failed to load profile data:', error)
      // Fallback to user data from auth
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        email: user?.email || '',
        bio: '',
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }
  }

  const loadSecurityData = async () => {
    try {
      const response = await fetch('/api/settings/security')
      const result = await response.json()
      
      if (result.success) {
        setSecurityData(result.data)
      }
    } catch (error) {
      console.error('Failed to load security data:', error)
    }
  }

  const loadDataStats = async () => {
    try {
      const response = await fetch('/api/settings/data')
      const result = await response.json()
      
      if (result.success) {
        setDataStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load data stats:', error)
    }
  }

  const sections = [
    { id: "profile", label: "Profile & Account", icon: User },
    { id: "security", label: "Security & Privacy", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data Management", icon: Database },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
  ]

  const handleSave = async (section: string) => {
    setLoading(true)
    try {
      if (section === 'profile') {
        const response = await fetch('/api/settings/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            bio: formData.bio,
          }),
        })
        
        const result = await response.json()
        
        if (result.success) {
          setProfileData(result.data)
          setIsEditing({ ...isEditing, [section]: false })
          toast({
            title: "Profile updated",
            description: "Your profile has been updated successfully.",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update profile",
            variant: "destructive",
          })
        }
      } else if (section === 'security') {
        if (formData.newPassword !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "New passwords do not match",
            variant: "destructive",
          })
          return
        }

        const response = await fetch('/api/settings/security', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          }),
        })
        
        const result = await response.json()
        
        if (result.success) {
          setIsEditing({ ...isEditing, [section]: false })
          setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" })
          toast({
            title: "Password updated",
            description: "Your password has been updated successfully.",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update password",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = (section: string) => {
    setIsEditing({ ...isEditing, [section]: false })
    // Reset form data to original values
    if (section === 'profile' && profileData) {
      setFormData({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        username: profileData.username,
        email: profileData.email,
        bio: profileData.bio,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } else if (section === 'security') {
      setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" })
    }
  }

  const handleExportData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'export' }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        // In a real implementation, you would download the file
        // For now, we'll just show a success message
        toast({
          title: "Export completed",
          description: result.message,
        })
      } else {
        toast({
          title: "Export failed",
          description: result.error || "Failed to export data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetTrades = async () => {
    if (!confirm('Are you sure you want to reset all trading data? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/settings/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset_trades' }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Trades reset",
          description: result.message,
          variant: "destructive",
        })
        // Reload data stats
        loadDataStats()
      } else {
        toast({
          title: "Reset failed",
          description: result.error || "Failed to reset trades",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Reset error:', error)
      toast({
        title: "Reset failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.')) {
      return
    }

    if (!confirm('This is your final warning. Are you absolutely sure you want to delete your account?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/settings/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete_account' }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Account deletion initiated",
          description: result.message,
          variant: "destructive",
        })
        // Redirect to home page or logout
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      } else {
        toast({
          title: "Deletion failed",
          description: result.error || "Failed to delete account",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Deletion failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setUploadingAvatar(true)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/settings/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Update profile data with new avatar URL
        setProfileData(prev => prev ? { ...prev, avatarUrl: result.data.avatarUrl } : null)
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully.",
        })
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload avatar",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings/security', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Session revoked",
          description: "The session has been revoked successfully.",
        })
        // Reload security data
        loadSecurityData()
      } else {
        toast({
          title: "Revoke failed",
          description: result.error || "Failed to revoke session",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Session revoke error:', error)
      toast({
        title: "Revoke failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderProfileSection = () => (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile & Account
          </CardTitle>
          {!isEditing.profile ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing({ ...isEditing, profile: true })}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancel("profile")}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave("profile")}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {profileData?.avatarUrl ? (
              <img 
                src={profileData.avatarUrl} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-600"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                <User className="h-8 w-8 text-slate-400" />
              </div>
            )}
            {isEditing.profile && (
              <div className="absolute -bottom-1 -right-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                  disabled={uploadingAvatar}
                />
                <label htmlFor="avatar-upload">
                  <Button
                    size="sm"
                    className="rounded-full w-8 h-8 p-0 cursor-pointer"
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </label>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              @{formData.username || 'username'}
            </h3>
            {formData.bio && (
              <p className="text-slate-400 text-sm mt-1">{formData.bio}</p>
            )}
            {profileData && (
              <p className="text-xs text-slate-500 mt-2">
                Member since {new Date(profileData.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <Separator className="bg-slate-800" />

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-slate-300">
              First Name
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              disabled={!isEditing.profile}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-slate-300">
              Last Name
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              disabled={!isEditing.profile}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div>
            <Label htmlFor="username" className="text-slate-300">
              Username
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={!isEditing.profile}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-slate-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing.profile}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bio" className="text-slate-300">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            disabled={!isEditing.profile}
            className="bg-slate-800 border-slate-700 text-white"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderSecuritySection = () => (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          {!isEditing.security ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing({ ...isEditing, security: true })}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancel("security")}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave("security")}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className={`h-5 w-5 ${securityData?.twoFactorEnabled ? 'text-green-400' : 'text-slate-400'}`} />
            <div>
              <h3 className="text-white font-medium">Two-Factor Authentication</h3>
              <p className="text-slate-400 text-sm">
                {securityData?.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
              </p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={securityData?.twoFactorEnabled ? "bg-green-900/50 text-green-400" : "bg-slate-700 text-slate-400"}
          >
            {securityData?.twoFactorEnabled ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Active
              </>
            ) : (
              'Disabled'
            )}
          </Badge>
        </div>

        {/* Change Password */}
        <div className="space-y-4">
          <h3 className="text-white font-medium">Change Password</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="currentPassword" className="text-slate-300">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  disabled={!isEditing.security}
                  className="bg-slate-800 border-slate-700 text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                >
                  {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="newPassword" className="text-slate-300">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  disabled={!isEditing.security}
                  className="bg-slate-800 border-slate-700 text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                >
                  {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-slate-300">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={!isEditing.security}
                  className="bg-slate-800 border-slate-700 text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                >
                  {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-800" />

        {/* Active Sessions */}
        <div>
          <h3 className="text-white font-medium mb-4">Active Sessions</h3>
          <div className="space-y-3">
            {securityData?.sessions?.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {session.device.includes("iPhone") || session.device.includes("Mobile") ? (
                    <Smartphone className="h-5 w-5 text-slate-400" />
                  ) : session.device.includes("MacBook") || session.device.includes("Mac") ? (
                    <Monitor className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Monitor className="h-5 w-5 text-slate-400" />
                  )}
                  <div>
                    <p className="text-white font-medium">{session.device}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="h-3 w-3" />
                      {session.location}
                      <Clock className="h-3 w-3 ml-2" />
                      {session.lastActive}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.current && (
                    <Badge variant="secondary" className="bg-green-900/50 text-green-400">
                      Current
                    </Badge>
                  )}
                  {!session.current && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={loading}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-slate-400">
                <Shield className="h-8 w-8 mx-auto mb-2" />
                <p>No active sessions found</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderDataSection = () => (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Statistics */}
        {dataStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h4 className="text-white font-medium mb-1">Total Trades</h4>
              <p className="text-2xl font-bold text-green-400">{dataStats.totalTrades}</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h4 className="text-white font-medium mb-1">Account Created</h4>
              <p className="text-sm text-slate-400">
                {new Date(dataStats.accountCreated).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h4 className="text-white font-medium mb-1">Last Export</h4>
              <p className="text-sm text-slate-400">
                {dataStats.lastExport ? new Date(dataStats.lastExport).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        )}

        {/* Export Data */}
        <div className="space-y-4">
          <h3 className="text-white font-medium">Export Your Data</h3>
          <p className="text-slate-400 text-sm">
            Download a copy of your trading data and account information.
          </p>
          <Button 
            onClick={handleExportData} 
            className="w-full sm:w-auto"
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Exporting...' : 'Export All Data'}
          </Button>
        </div>

        <Separator className="bg-slate-800" />

        {/* Danger Zone */}
        <div className="space-y-4">
          <h3 className="text-red-400 font-medium flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
              <h4 className="text-red-400 font-medium mb-2">Reset Trading Data</h4>
              <p className="text-slate-400 text-sm mb-3">
                This will permanently delete all your trades, positions, and trading history. This action cannot be undone.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleResetTrades}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loading ? 'Resetting...' : 'Reset All Trading Data'}
              </Button>
            </div>

            <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
              <h4 className="text-red-400 font-medium mb-2">Delete Account</h4>
              <p className="text-slate-400 text-sm mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loading ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderPreferencesSection = () => (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-white font-medium">Theme</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300">Dark Mode</p>
              <p className="text-slate-400 text-sm">Use dark theme for the application</p>
            </div>
            <Switch 
              checked={preferences.theme === 'dark'} 
              onCheckedChange={(checked) => setPreferences({...preferences, theme: checked ? 'dark' : 'light'})}
            />
          </div>
        </div>

        <Separator className="bg-slate-800" />

        <div className="space-y-4">
          <h3 className="text-white font-medium">Privacy</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300">Public Profile</p>
                <p className="text-slate-400 text-sm">Make your profile visible to other users</p>
              </div>
              <Switch 
                checked={preferences.privacy.profilePublic} 
                onCheckedChange={(checked) => setPreferences({
                  ...preferences, 
                  privacy: {...preferences.privacy, profilePublic: checked}
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300">Show Trades</p>
                <p className="text-slate-400 text-sm">Display your trading activity publicly</p>
              </div>
              <Switch 
                checked={preferences.privacy.showTrades} 
                onCheckedChange={(checked) => setPreferences({
                  ...preferences, 
                  privacy: {...preferences.privacy, showTrades: checked}
                })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderNotificationsSection = () => (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-white font-medium">Email Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300">Trade Alerts</p>
                <p className="text-slate-400 text-sm">Get notified about trade executions</p>
              </div>
              <Switch 
                checked={preferences.notifications.email} 
                onCheckedChange={(checked) => setPreferences({
                  ...preferences, 
                  notifications: {...preferences.notifications, email: checked}
                })}
              />
            </div>
          </div>
        </div>

        <Separator className="bg-slate-800" />

        <div className="space-y-4">
          <h3 className="text-white font-medium">Push Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300">Browser Notifications</p>
                <p className="text-slate-400 text-sm">Receive notifications in your browser</p>
              </div>
              <Switch 
                checked={preferences.notifications.push} 
                onCheckedChange={(checked) => setPreferences({
                  ...preferences, 
                  notifications: {...preferences.notifications, push: checked}
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300">SMS Notifications</p>
                <p className="text-slate-400 text-sm">Receive text message alerts</p>
              </div>
              <Switch 
                checked={preferences.notifications.sms} 
                onCheckedChange={(checked) => setPreferences({
                  ...preferences, 
                  notifications: {...preferences.notifications, sms: checked}
                })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderBillingSection = () => (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Billing & Plans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium text-white mb-2">Free Plan</h3>
          <p className="text-slate-400 mb-4">You're currently on the free plan with unlimited trades.</p>
          <Button variant="outline" disabled>
            Upgrade to Pro
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection()
      case "security":
        return renderSecuritySection()
      case "preferences":
        return renderPreferencesSection()
      case "notifications":
        return renderNotificationsSection()
      case "data":
        return renderDataSection()
      case "billing":
        return renderBillingSection()
      default:
        return (
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardContent className="p-8 text-center">
              <div className="text-slate-400">
                <Settings className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Coming Soon</h3>
                <p className="text-slate-400">This section is under development.</p>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100 mb-2">Settings</h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation - Desktop */}
          {!isMobile && (
            <div className="lg:w-64 flex-shrink-0">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? "bg-slate-800 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <div className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                    className="w-full flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800/50 rounded-lg text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </div>
                    {activeSection === section.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  )
}
