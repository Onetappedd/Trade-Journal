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

export default function SettingsPageClient() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState({
    profile: false,
    security: false,
    preferences: false,
  })

  const [activeSection, setActiveSection] = useState<string | null>("profile")
  const [isMobile, setIsMobile] = useState(false)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

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

  const sections = [
    { id: "profile", label: "Profile & Account", icon: User },
    { id: "security", label: "Security & Privacy", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data Management", icon: Database },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
  ]

  const handleSave = (section: string) => {
    setIsEditing({ ...isEditing, [section]: false })
    toast({
      title: "Settings saved",
      description: "Your changes have been saved successfully.",
    })
  }

  const handleCancel = (section: string) => {
    setIsEditing({ ...isEditing, [section]: false })
    // Reset form data if needed
  }

  const handleExportData = () => {
    toast({
      title: "Export started",
      description: "Your data export will be ready shortly. You'll receive an email when it's complete.",
    })
  }

  const handleResetTrades = () => {
    toast({
      title: "Reset trades",
      description: "All trading data has been reset. This action cannot be undone.",
      variant: "destructive",
    })
  }

  const handleDeleteAccount = () => {
    toast({
      title: "Account deletion",
      description: "Account deletion initiated. You'll receive a confirmation email.",
      variant: "destructive",
    })
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
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
              <User className="h-8 w-8 text-slate-400" />
            </div>
            {isEditing.profile && (
              <Button
                size="sm"
                className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {formData.firstName} {formData.lastName}
            </h3>
            <p className="text-slate-400">@{formData.username}</p>
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
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-green-400" />
            <div>
              <h3 className="text-white font-medium">Two-Factor Authentication</h3>
              <p className="text-slate-400 text-sm">Enabled</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-900/50 text-green-400">
            <Check className="h-3 w-3 mr-1" />
            Active
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
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {session.device.includes("iPhone") ? (
                    <Smartphone className="h-5 w-5 text-slate-400" />
                  ) : session.device.includes("MacBook") ? (
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
                    <Button variant="ghost" size="sm">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
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
        {/* Export Data */}
        <div className="space-y-4">
          <h3 className="text-white font-medium">Export Your Data</h3>
          <p className="text-slate-400 text-sm">
            Download a copy of your trading data and account information.
          </p>
          <Button onClick={handleExportData} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export All Data
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
              <Button variant="destructive" onClick={handleResetTrades}>
                <Trash2 className="h-4 w-4 mr-2" />
                Reset All Trading Data
              </Button>
            </div>

            <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
              <h4 className="text-red-400 font-medium mb-2">Delete Account</h4>
              <p className="text-slate-400 text-sm mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
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
      case "data":
        return renderDataSection()
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
