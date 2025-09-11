import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, FileText, TrendingUp, Activity, Database } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your statistical analysis projects and data.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datasets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Active datasets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyses Run</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96.8%</div>
            <p className="text-xs text-muted-foreground">Analysis completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>
              Your latest statistical analysis projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Fisheries CPUE Analysis</p>
                <p className="text-xs text-muted-foreground">von Bertalanffy growth model</p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Clinical Trial Results</p>
                <p className="text-xs text-muted-foreground">Two-way ANOVA with post-hoc</p>
              </div>
              <Badge variant="secondary">Completed</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Market Research</p>
                <p className="text-xs text-muted-foreground">Correlation analysis</p>
              </div>
              <Badge variant="outline">Draft</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common statistical tests and analyses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm">Run t-test</span>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm">ANOVA analysis</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm">Regression analysis</span>
            </div>
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-sm">Upload new dataset</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}