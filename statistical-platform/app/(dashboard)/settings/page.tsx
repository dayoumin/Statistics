import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Settings, User, Bell, Shield, Palette, Download, HelpCircle } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and application settings.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <p className="text-sm text-muted-foreground">Dr. Research Scientist</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm text-muted-foreground">researcher@university.edu</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Institution</label>
                <p className="text-sm text-muted-foreground">Marine Research Institute</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Badge variant="outline">Senior Researcher</Badge>
              </div>
            </div>
            <Separator />
            <Button variant="outline">Edit Profile</Button>
          </CardContent>
        </Card>

        {/* Analysis Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Analysis Preferences
            </CardTitle>
            <CardDescription>
              Configure default settings for statistical analyses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Significance Level</label>
                <p className="text-sm text-muted-foreground">α = 0.05</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confidence Interval</label>
                <p className="text-sm text-muted-foreground">95%</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Multiple Comparisons</label>
                <p className="text-sm text-muted-foreground">Bonferroni Correction</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Effect Size Reporting</label>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Enabled</Badge>
              </div>
            </div>
            <Separator />
            <Button variant="outline">Configure Analysis Settings</Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Theme</label>
                <p className="text-sm text-muted-foreground">System (Auto)</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color Scheme</label>
                <p className="text-sm text-muted-foreground">Neutral</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chart Style</label>
                <p className="text-sm text-muted-foreground">Professional</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Font Size</label>
                <p className="text-sm text-muted-foreground">Medium</p>
              </div>
            </div>
            <Separator />
            <Button variant="outline">Customize Appearance</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Control how you receive notifications and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Analysis Completion</p>
                  <p className="text-xs text-muted-foreground">Get notified when analyses finish</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">On</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Data Upload Errors</p>
                  <p className="text-xs text-muted-foreground">Alert for data validation issues</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">On</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Weekly Summary</p>
                  <p className="text-xs text-muted-foreground">Analysis activity summary</p>
                </div>
                <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Off</Badge>
              </div>
            </div>
            <Separator />
            <Button variant="outline">Manage Notifications</Button>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
            <CardDescription>
              Manage your account security and data privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Two-Factor Authentication</label>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Enabled</Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Encryption</label>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">AES-256</Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Timeout</label>
                <p className="text-sm text-muted-foreground">24 hours</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Retention</label>
                <p className="text-sm text-muted-foreground">2 years</p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button variant="outline">Security Settings</Button>
              <Button variant="outline">Privacy Policy</Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Export
            </CardTitle>
            <CardDescription>
              Export your data and analysis results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Export All Datasets</span>
                <Button variant="outline" size="sm">Download</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Export Analysis Results</span>
                <Button variant="outline" size="sm">Download</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Export Account Data</span>
                <Button variant="outline" size="sm">Request</Button>
              </div>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Export requests may take up to 24 hours to process. You will receive an email when ready.
            </p>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Help & Support
            </CardTitle>
            <CardDescription>
              Get assistance and learn about platform features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Button variant="outline" className="justify-start">
                User Documentation
              </Button>
              <Button variant="outline" className="justify-start">
                Video Tutorials
              </Button>
              <Button variant="outline" className="justify-start">
                Statistical Guide
              </Button>
              <Button variant="outline" className="justify-start">
                Contact Support
              </Button>
            </div>
            <Separator />
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Version 1.0.0</p>
              <p className="text-xs text-muted-foreground">
                Professional Statistical Analysis Platform
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}