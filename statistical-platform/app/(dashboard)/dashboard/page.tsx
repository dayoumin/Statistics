import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart3, FileText, TrendingUp, Activity, Database, AlertCircle, CheckCircle2 } from "lucide-react"

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

      {/* Activity Overview with Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Recent Projects</TabsTrigger>
          <TabsTrigger value="analyses">Running Analyses</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="space-y-4">
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
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20 h-2" />
                      <span className="text-xs text-muted-foreground">85%</span>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Clinical Trial Results</p>
                    <p className="text-xs text-muted-foreground">Two-way ANOVA with post-hoc</p>
                    <div className="flex items-center gap-2">
                      <Progress value={100} className="w-20 h-2" />
                      <span className="text-xs text-muted-foreground">100%</span>
                    </div>
                  </div>
                  <Badge variant="secondary">Completed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Market Research</p>
                    <p className="text-xs text-muted-foreground">Correlation analysis</p>
                    <div className="flex items-center gap-2">
                      <Progress value={15} className="w-20 h-2" />
                      <span className="text-xs text-muted-foreground">15%</span>
                    </div>
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
                <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-sm">Run t-test</span>
                </div>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-sm">ANOVA analysis</span>
                </div>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm">Regression analysis</span>
                </div>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-sm">Upload new dataset</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analyses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Running Analyses</CardTitle>
              <CardDescription>
                Currently processing statistical computations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Multiple Regression Analysis</p>
                    <p className="text-xs text-muted-foreground">Dataset: clinical_trial_data.csv</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={67} className="w-24 h-2" />
                    <span className="text-xs text-muted-foreground">67%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Kruskal-Wallis Test</p>
                    <p className="text-xs text-muted-foreground">Dataset: survey_responses.csv</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={23} className="w-24 h-2" />
                    <span className="text-xs text-muted-foreground">23%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Analysis Completed</AlertTitle>
              <AlertDescription>
                Your ANOVA analysis for the fisheries dataset has completed successfully. 
                Results are ready for review.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Data Validation Warning</AlertTitle>
              <AlertDescription>
                The uploaded dataset &quot;market_data.csv&quot; contains missing values that may affect analysis results.
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}