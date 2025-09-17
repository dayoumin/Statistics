"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  Bell,
  Shield,
  Palette,
  Download, 
  HelpCircle, 
  Save,
  RefreshCw,
  CheckCircle2,
  BarChart3
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTheme } from "next-themes"
import { toast } from "sonner"

export default function SettingsPage() {
  const { preferences, updatePreferences } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Local state for form values
  const [localPreferences, setLocalPreferences] = useState(preferences)
  const [profileData, setProfileData] = useState({
    name: "Dr. Research Scientist",
    email: "researcher@university.edu",
    institution: "Marine Research Institute",
    role: "Senior Researcher"
  })

  useEffect(() => {
    setLocalPreferences(preferences)
  }, [preferences])

  useEffect(() => {
    const hasChanged = JSON.stringify(localPreferences) !== JSON.stringify(preferences)
    setHasChanges(hasChanged)
  }, [localPreferences, preferences])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      updatePreferences(localPreferences)
      setHasChanges(false)
      toast.success("Settings saved successfully!", {
        description: "Your preferences have been updated."
      })
    } catch (_error) {
      toast.error("Failed to save settings", {
        description: "Please try again later."
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetSettings = () => {
    const defaultPreferences = {
      defaultSignificanceLevel: 0.05,
      defaultConfidenceLevel: 95,
      multipleComparisonsCorrection: 'bonferroni' as const,
      effectSizeReporting: true,
      chartStyle: 'professional' as const,
      notifications: {
        analysisCompletion: true,
        dataUploadErrors: true,
        weeklySummary: false
      }
    }
    setLocalPreferences(defaultPreferences)
    toast.info("Settings reset to defaults", {
      description: "Don't forget to save your changes."
    })
  }

  const handleExportData = (type: 'datasets' | 'results' | 'account') => {
    toast.info(`Preparing ${type} export...`, {
      description: "You will receive an email when the export is ready."
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and application settings.
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleResetSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* Analysis Settings */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistical Analysis Preferences
              </CardTitle>
              <CardDescription>
                Configure default settings for your statistical analyses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="significanceLevel">Default Significance Level (α)</Label>
                  <Select 
                    value={localPreferences.defaultSignificanceLevel.toString()} 
                    onValueChange={(value) => setLocalPreferences(prev => ({
                      ...prev, 
                      defaultSignificanceLevel: parseFloat(value)
                    }))}
                  >
                    <SelectTrigger id="significanceLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.01">0.01 (99% confidence)</SelectItem>
                      <SelectItem value="0.05">0.05 (95% confidence)</SelectItem>
                      <SelectItem value="0.10">0.10 (90% confidence)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidenceLevel">Default Confidence Level</Label>
                  <Select 
                    value={localPreferences.defaultConfidenceLevel.toString()} 
                    onValueChange={(value) => setLocalPreferences(prev => ({
                      ...prev, 
                      defaultConfidenceLevel: parseInt(value)
                    }))}
                  >
                    <SelectTrigger id="confidenceLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90%</SelectItem>
                      <SelectItem value="95">95%</SelectItem>
                      <SelectItem value="99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="multipleComparisons">Multiple Comparisons Correction</Label>
                  <Select 
                    value={localPreferences.multipleComparisonsCorrection} 
                    onValueChange={(value: 'bonferroni' | 'holm' | 'fdr' | 'none') => 
                      setLocalPreferences(prev => ({
                        ...prev, 
                        multipleComparisonsCorrection: value
                      }))
                    }
                  >
                    <SelectTrigger id="multipleComparisons">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bonferroni">Bonferroni Correction</SelectItem>
                      <SelectItem value="holm">Holm-Bonferroni</SelectItem>
                      <SelectItem value="fdr">False Discovery Rate (FDR)</SelectItem>
                      <SelectItem value="none">No Correction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chartStyle">Chart Style</Label>
                  <Select 
                    value={localPreferences.chartStyle} 
                    onValueChange={(value: 'professional' | 'minimal' | 'colorful') => 
                      setLocalPreferences(prev => ({
                        ...prev, 
                        chartStyle: value
                      }))
                    }
                  >
                    <SelectTrigger id="chartStyle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="colorful">Colorful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Effect Size Reporting</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically calculate and display effect sizes (Cohen&apos;s d, eta-squared, etc.)
                  </p>
                </div>
                <Switch
                  checked={localPreferences.effectSizeReporting}
                  onCheckedChange={(checked) => 
                    setLocalPreferences(prev => ({
                      ...prev, 
                      effectSizeReporting: checked
                    }))
                  }
                />
              </div>

              {localPreferences.multipleComparisonsCorrection !== 'none' && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Multiple comparisons correction is enabled. This will automatically adjust p-values 
                    for ANOVA post-hoc tests and other multiple comparison scenarios.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System (Auto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chartStyleDisplay">Chart Style</Label>
                  <div className="p-3 border rounded-md">
                    <p className="text-sm font-medium capitalize">
                      {localPreferences.chartStyle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {localPreferences.chartStyle === 'professional' && "Clean, publication-ready charts"}
                      {localPreferences.chartStyle === 'minimal' && "Simple, distraction-free visuals"}
                      {localPreferences.chartStyle === 'colorful' && "Vibrant, engaging presentations"}
                    </p>
                  </div>
                </div>
              </div>
              
              <Alert>
                <Palette className="h-4 w-4" />
                <AlertDescription>
                  Theme changes apply immediately. Chart style changes will be reflected in new analyses.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Control how you receive notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Analysis Completion</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when statistical analyses finish processing
                    </p>
                  </div>
                  <Switch
                    checked={localPreferences.notifications.analysisCompletion}
                    onCheckedChange={(checked) => 
                      setLocalPreferences(prev => ({
                        ...prev, 
                        notifications: { ...prev.notifications, analysisCompletion: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Data Upload Errors</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert for data validation issues and upload failures
                    </p>
                  </div>
                  <Switch
                    checked={localPreferences.notifications.dataUploadErrors}
                    onCheckedChange={(checked) => 
                      setLocalPreferences(prev => ({
                        ...prev, 
                        notifications: { ...prev.notifications, dataUploadErrors: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Weekly Summary</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly analysis activity summaries via email
                    </p>
                  </div>
                  <Switch
                    checked={localPreferences.notifications.weeklySummary}
                    onCheckedChange={(checked) => 
                      setLocalPreferences(prev => ({
                        ...prev, 
                        notifications: { ...prev.notifications, weeklySummary: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Manage your personal information and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    value={profileData.institution}
                    onChange={(e) => setProfileData(prev => ({ ...prev, institution: e.target.value }))}
                    placeholder="Enter your institution"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profileData.role}
                    onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="Enter your role"
                  />
                </div>
              </div>

              <Separator />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Enabled
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Session Timeout</p>
                      <p className="text-sm text-muted-foreground">Automatic logout after inactivity</p>
                    </div>
                    <Badge variant="outline">24 hours</Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Change Password</Button>
                    <Button variant="outline" size="sm">Manage 2FA</Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Export & Management
              </CardTitle>
              <CardDescription>
                Export your data and manage your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Export All Datasets</p>
                    <p className="text-sm text-muted-foreground">Download all uploaded datasets as CSV files</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportData('datasets')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Export Analysis Results</p>
                    <p className="text-sm text-muted-foreground">Download all statistical analysis results and reports</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportData('results')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Export Account Data</p>
                    <p className="text-sm text-muted-foreground">Complete data export including profile and settings</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportData('account')}>
                    <Download className="h-4 w-4 mr-2" />
                    Request
                  </Button>
                </div>
              </div>

              <Separator />

              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription>
                  Export requests may take up to 24 hours to process. You will receive an email notification when your data is ready for download.
                </AlertDescription>
              </Alert>

              <div className="text-center space-y-2 pt-4">
                <p className="text-sm font-medium">Statistical Analysis Platform</p>
                <p className="text-xs text-muted-foreground">Version 1.0.0</p>
                <p className="text-xs text-muted-foreground">
                  Professional statistical analysis software with SciPy integration
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}