"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"
import { useAuth } from "@/providers/auth-provider"

export default function SettingsPage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState({
    profile: false,
    security: false,
    preferences: false,
  })

  const [activeSection, setActiveSection] = useState<string | null>("profile")
  const [isMobile, setIsMobile] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    username: "johndoe_trader",
    email: user?.email || "john.doe@example.com",
    bio: "Professional trader with 10+ years of experience in equity markets and risk management.",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const settingsItems = [
    { id: "profile", label: "Profile & Account", icon: User },
    { id: "security", label: "Security & Privacy", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data Management", icon: RefreshCw },
    { id: "billing", label: "Billing & Plans", icon: Globe },
  ]

  const validateField = (field: string, value: string) => {
    const errors: Record<string, string> = {}

    switch (field) {
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Please enter a valid email address"
        }
        break
      case "username":
        if (value && value.length < 3) {
          errors.username = "Username must be at least 3 characters"
        }
        break
      case "newPassword":
        if (value && value.length < 8) {
          errors.newPassword = "Password must be at least 8 characters"
        }
        break
      case "confirmPassword":
        if (value && value !== formData.newPassword) {
          errors.confirmPassword = "Passwords do not match"
        }
        break
    }

    setFormErrors((prev) => ({ ...prev, ...errors }))
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSaveProfile = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    })
    setIsEditing({ ...isEditing, profile: false })
    setIsSubmitting(false)
  }

  const handleSaveSecurity = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    toast({
      title: "Security Settings Updated",
      description: "Your password and security settings have been updated.",
    })
    setIsEditing({ ...isEditing, security: false })
    setIsSubmitting(false)
  }

  const handleExportData = (type: string) => {
    toast({
      title: "Export Started",
      description: `Your ${type} export is being prepared. You'll receive an email when it's ready.`,
    })
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Your ${type} has been exported successfully.`,
      })
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-slate-400 text-sm sm:text-base">Manage your account preferences and security settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Settings Navigation - Desktop Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <Card className="bg-slate-900/50 border-slate-800/50 sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white">Settings Menu</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {settingsItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        item.id === "profile"
                          ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/50"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.label}</span>
                    </a>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <div className="lg:hidden">
              <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white">Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {settingsItems.map((item) => (
                    <div key={item.id}>
                      <button
                        onClick={() => setActiveSection(activeSection === item.id ? null : item.id)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-800/50"
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {activeSection === item.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {/* Mobile Content Sections */}
                      {activeSection === item.id && (
                        <div className="mt-4 pl-4">
                          {item.id === "profile" && (
                            <ProfileSection
                              isEditing={isEditing}
                              setIsEditing={setIsEditing}
                              onSave={handleSaveProfile}
                              formData={formData}
                              formErrors={formErrors}
                              handleFieldChange={handleFieldChange}
                              validateField={validateField}
                              isSubmitting={isSubmitting}
                            />
                          )}
                          {item.id === "security" && (
                            <SecuritySection
                              isEditing={isEditing}
                              setIsEditing={setIsEditing}
                              onSave={handleSaveSecurity}
                              formData={formData}
                              formErrors={formErrors}
                              handleFieldChange={handleFieldChange}
                              validateField={validateField}
                              isSubmitting={isSubmitting}
                            />
                          )}
                          {item.id === "data" && (
                            <DataSection
                              onExport={handleExportData}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Desktop Content Sections */}
            <div className="hidden lg:block space-y-8">
              {/* Profile & Account */}
              <Card className="bg-slate-900/50 border-slate-800/50" id="profile">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-white flex items-center">
                      <User className="h-5 w-5 mr-2 text-emerald-400" />
                      Profile & Account
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing({ ...isEditing, profile: !isEditing.profile })}
                      className="text-slate-400 hover:text-white h-8 w-8 p-0"
                    >
                      {isEditing.profile ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ProfileSection
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    onSave={handleSaveProfile}
                    formData={formData}
                    formErrors={formErrors}
                    handleFieldChange={handleFieldChange}
                    validateField={validateField}
                    isSubmitting={isSubmitting}
                  />
                </CardContent>
              </Card>

              {/* Security & Privacy */}
              <Card className="bg-slate-900/50 border-slate-800/50" id="security">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-white flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-emerald-400" />
                      Security & Privacy
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing({ ...isEditing, security: !isEditing.security })}
                      className="text-slate-400 hover:text-white h-8 w-8 p-0"
                    >
                      {isEditing.security ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <SecuritySection
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    onSave={handleSaveSecurity}
                    formData={formData}
                    formErrors={formErrors}
                    handleFieldChange={handleFieldChange}
                    validateField={validateField}
                    isSubmitting={isSubmitting}
                  />
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card className="bg-slate-900/50 border-slate-800/50" id="data">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-white flex items-center">
                    <RefreshCw className="h-5 w-5 mr-2 text-emerald-400" />
                    Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DataSection
                    onExport={handleExportData}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ProfileSection({
  isEditing,
  setIsEditing,
  onSave,
  formData,
  formErrors,
  handleFieldChange,
  validateField,
  isSubmitting,
}: any) {
  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="relative self-start">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl sm:text-2xl">JD</span>
          </div>
          {isEditing.profile && (
            <button className="absolute -bottom-1 -right-1 h-8 w-8 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center transition-colors">
              <Camera className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">John Doe</h3>
          <p className="text-slate-400">Professional Trader</p>
          {isEditing.profile && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload New Photo
            </Button>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleFieldChange("firstName", e.target.value)}
            onBlur={() => validateField("firstName", formData.firstName)}
            disabled={!isEditing.profile}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
          {formErrors.firstName && (
            <p className="text-sm text-red-400">{formErrors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleFieldChange("lastName", e.target.value)}
            onBlur={() => validateField("lastName", formData.lastName)}
            disabled={!isEditing.profile}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
          {formErrors.lastName && (
            <p className="text-sm text-red-400">{formErrors.lastName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => handleFieldChange("username", e.target.value)}
            onBlur={() => validateField("username", formData.username)}
            disabled={!isEditing.profile}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
          {formErrors.username && (
            <p className="text-sm text-red-400">{formErrors.username}</p>
          )}
          <p className="text-sm text-slate-400">Must be at least 3 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            onBlur={() => validateField("email", formData.email)}
            disabled={!isEditing.profile}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
          {formErrors.email && (
            <p className="text-sm text-red-400">{formErrors.email}</p>
          )}
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleFieldChange("bio", e.target.value)}
            disabled={!isEditing.profile}
            className="bg-slate-800/50 border-slate-700 text-white"
            rows={3}
          />
          <p className="text-sm text-slate-400">Tell others about your trading experience</p>
        </div>
      </div>

      {isEditing.profile && (
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsEditing({ ...isEditing, profile: false })}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isSubmitting || Object.keys(formErrors).some((key) => formErrors[key])}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  )
}

function SecuritySection({
  isEditing,
  setIsEditing,
  onSave,
  formData,
  formErrors,
  handleFieldChange,
  validateField,
  isSubmitting,
}: any) {
  return (
    <div className="space-y-6">
      {/* Password Change */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => handleFieldChange("currentPassword", e.target.value)}
              disabled={!isEditing.security}
              className="bg-slate-800/50 border-slate-700 text-white"
              placeholder="Enter current password"
            />
            {formErrors.currentPassword && (
              <p className="text-sm text-red-400">{formErrors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => handleFieldChange("newPassword", e.target.value)}
              onBlur={() => validateField("newPassword", formData.newPassword)}
              disabled={!isEditing.security}
              className="bg-slate-800/50 border-slate-700 text-white"
              placeholder="Enter new password"
            />
            {formErrors.newPassword && (
              <p className="text-sm text-red-400">{formErrors.newPassword}</p>
            )}
            <p className="text-sm text-slate-400">Must be at least 8 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
              onBlur={() => validateField("confirmPassword", formData.confirmPassword)}
              disabled={!isEditing.security}
              className="bg-slate-800/50 border-slate-700 text-white"
              placeholder="Confirm new password"
            />
            {formErrors.confirmPassword && (
              <p className="text-sm text-red-400">{formErrors.confirmPassword}</p>
            )}
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="pt-6 border-t border-slate-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-slate-400">Add an extra layer of security to your account</p>
          </div>
          <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-800/50 text-xs">Enabled</Badge>
        </div>
        <Button
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent w-full sm:w-auto"
        >
          <Shield className="h-4 w-4 mr-2" />
          Manage 2FA Settings
        </Button>
      </div>

      {isEditing.security && (
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsEditing({ ...isEditing, security: false })}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isSubmitting || Object.keys(formErrors).some((key) => formErrors[key])}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? "Updating..." : "Update Security Settings"}
          </Button>
        </div>
      )}
    </div>
  )
}

function DataSection({ onExport }: any) {
  return (
    <div className="space-y-6">
      {/* Export Data */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Export Your Data</h3>
        <p className="text-slate-400 mb-4">Download a copy of all your trading data and account information.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={() => onExport("trades")}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent h-12"
          >
            <Download className="h-4 w-4 mr-2" />
            Export All Trades
          </Button>
          <Button
            onClick={() => onExport("account data")}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent h-12"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Account Data
          </Button>
        </div>
      </div>
    </div>
  )
}
