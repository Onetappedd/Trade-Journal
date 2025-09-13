"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { showSuccess, showError, showWarning, showInfo } from "@/lib/notifications"
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
import { FormField, FormActions, SubmitButton, DangerZone } from "@/components/form-field"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
    email: "john.doe@example.com",
    bio: "Professional trader with 10+ years of experience in equity markets and risk management.",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
    showSuccess("Profile Updated", "Your profile information has been saved successfully.")
    setIsEditing({ ...isEditing, profile: false })
    setIsSubmitting(false)
  }

  const handleSaveSecurity = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    showSuccess("Security Settings Updated", "Your password and security settings have been updated.")
    setIsEditing({ ...isEditing, security: false })
    setIsSubmitting(false)
  }

  const handleExportData = (type: string) => {
    showInfo("Export Started", `Your ${type} export is being prepared. You'll receive an email when it's ready.`)
    setTimeout(() => {
      showSuccess("Export Complete", `Your ${type} has been exported successfully.`)
    }, 3000)
  }

  const handleResetTrades = () => {
    setShowResetDialog(true)
  }

  const handleDeleteAccount = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmReset = () => {
    setShowResetDialog(false)
    showWarning("Reset Initiated", "All trading data has been scheduled for deletion.")
  }

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false)
    showError("Account Deletion", "Please contact support to complete account deletion.")
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-white tracking-tight">RiskR</span>
              </div>

              <nav className="hidden lg:flex items-center space-x-8">
                <a href="/dashboard" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                  Dashboard
                </a>
                <a href="/analytics" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                  Analytics
                </a>
                <a href="/import" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                  Import Trades
                </a>
                <a href="/trades" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                  Trade History
                </a>
                <a href="/settings" className="text-emerald-400 font-medium border-b-2 border-emerald-400 pb-4">
                  Settings
                </a>
              </nav>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search trades, symbols..."
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 w-48 lg:w-64"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800 h-9 w-9 p-0"
              >
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800 h-9 w-9 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

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
                              onResetTrades={handleResetTrades}
                              onDeleteAccount={handleDeleteAccount}
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
                    onResetTrades={handleResetTrades}
                    onDeleteAccount={handleDeleteAccount}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset All Trading Data"
        description="This will permanently delete all your trades, analytics, and performance history. This action cannot be undone."
        confirmText="Reset Data"
        variant="destructive"
        onConfirm={handleConfirmReset}
      />

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Account"
        description="This will permanently delete your account and all associated data. This action cannot be undone and you will lose access immediately."
        confirmText="Delete Account"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
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
        <FormField
          id="firstName"
          label="First Name"
          value={formData.firstName}
          onChange={(value) => handleFieldChange("firstName", value)}
          onBlur={() => validateField("firstName", formData.firstName)}
          disabled={!isEditing.profile}
          required
          error={formErrors.firstName}
        />

        <FormField
          id="lastName"
          label="Last Name"
          value={formData.lastName}
          onChange={(value) => handleFieldChange("lastName", value)}
          onBlur={() => validateField("lastName", formData.lastName)}
          disabled={!isEditing.profile}
          required
          error={formErrors.lastName}
        />

        <FormField
          id="username"
          label="Username"
          value={formData.username}
          onChange={(value) => handleFieldChange("username", value)}
          onBlur={() => validateField("username", formData.username)}
          disabled={!isEditing.profile}
          required
          error={formErrors.username}
          helperText="Must be at least 3 characters"
        />

        <FormField
          id="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => handleFieldChange("email", value)}
          onBlur={() => validateField("email", formData.email)}
          disabled={!isEditing.profile}
          required
          error={formErrors.email}
        />

        <div className="sm:col-span-2">
          <FormField
            id="bio"
            label="Bio"
            type="textarea"
            value={formData.bio}
            onChange={(value) => handleFieldChange("bio", value)}
            disabled={!isEditing.profile}
            helperText="Tell others about your trading experience"
          />
        </div>
      </div>

      {isEditing.profile && (
        <FormActions>
          <SubmitButton variant="secondary" onClick={() => setIsEditing({ ...isEditing, profile: false })}>
            Cancel
          </SubmitButton>
          <SubmitButton
            variant="primary"
            onClick={onSave}
            loading={isSubmitting}
            disabled={Object.keys(formErrors).some((key) => formErrors[key])}
          >
            Save Changes
          </SubmitButton>
        </FormActions>
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
          <FormField
            id="currentPassword"
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={(value) => handleFieldChange("currentPassword", value)}
            disabled={!isEditing.security}
            required
            error={formErrors.currentPassword}
            placeholder="Enter current password"
          />

          <FormField
            id="newPassword"
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={(value) => handleFieldChange("newPassword", value)}
            onBlur={() => validateField("newPassword", formData.newPassword)}
            disabled={!isEditing.security}
            required
            error={formErrors.newPassword}
            helperText="Must be at least 8 characters"
            placeholder="Enter new password"
          />

          <FormField
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(value) => handleFieldChange("confirmPassword", value)}
            onBlur={() => validateField("confirmPassword", formData.confirmPassword)}
            disabled={!isEditing.security}
            required
            error={formErrors.confirmPassword}
            placeholder="Confirm new password"
          />
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

      {/* Active Sessions */}
      <div className="pt-6 border-t border-slate-800/50">
        <h3 className="text-lg font-semibold text-white mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {[
            { device: "MacBook Pro", location: "New York, US", current: true, time: "Current session" },
            { device: "iPhone 14", location: "New York, US", current: false, time: "2 hours ago" },
            { device: "Chrome Browser", location: "London, UK", current: false, time: "1 day ago" },
          ].map((session, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 space-y-2 sm:space-y-0"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{session.device}</span>
                  {session.current && (
                    <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-800/50 text-xs">Current</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-400">
                  {session.location} • {session.time}
                </p>
              </div>
              {!session.current && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/20 self-start sm:self-center"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isEditing.security && (
        <FormActions>
          <SubmitButton variant="secondary" onClick={() => setIsEditing({ ...isEditing, security: false })}>
            Cancel
          </SubmitButton>
          <SubmitButton
            variant="primary"
            onClick={onSave}
            loading={isSubmitting}
            disabled={Object.keys(formErrors).some((key) => formErrors[key])}
          >
            Update Security Settings
          </SubmitButton>
        </FormActions>
      )}
    </div>
  )
}

function DataSection({ onExport, onResetTrades, onDeleteAccount }: any) {
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

      {/* Reset Data */}
      <DangerZone
        title="Reset Trading Data"
        description="Permanently delete all your trading history and start fresh. This action cannot be undone."
      >
        <Button onClick={onResetTrades} variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="h-4 w-4 mr-2" />
          Reset All Trades
        </Button>
      </DangerZone>

      {/* Delete Account */}
      <DangerZone
        title="Delete Account"
        description="Permanently delete your account and all associated data. This action cannot be undone."
      >
        <Button onClick={onDeleteAccount} variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </DangerZone>
    </div>
  )
}
