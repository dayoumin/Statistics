import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, BarChart3, TrendingUp, Zap, Target, Settings } from "lucide-react"

export default function AnalysisPage() {
  const analysisCategories = [
    {
      title: "Basic Statistics",
      description: "Fundamental statistical tests and descriptive statistics",
      icon: Calculator,
      tests: [
        { name: "Descriptive Statistics", description: "Mean, median, SD, etc.", difficulty: "Beginner" },
        { name: "One-sample t-test", description: "Compare sample mean to population", difficulty: "Beginner" },
        { name: "Two-sample t-test", description: "Compare means of two groups", difficulty: "Beginner" },
        { name: "Paired t-test", description: "Compare before/after measurements", difficulty: "Beginner" },
      ]
    },
    {
      title: "ANOVA & Post-hoc",
      description: "Analysis of variance and multiple comparisons",
      icon: BarChart3,
      tests: [
        { name: "One-way ANOVA", description: "Compare multiple group means", difficulty: "Intermediate" },
        { name: "Two-way ANOVA", description: "Two factors analysis", difficulty: "Advanced" },
        { name: "Tukey HSD", description: "Post-hoc multiple comparisons", difficulty: "Intermediate" },
        { name: "Games-Howell", description: "Unequal variances post-hoc", difficulty: "Advanced" },
      ]
    },
    {
      title: "Regression Analysis",
      description: "Linear and non-linear relationship modeling",
      icon: TrendingUp,
      tests: [
        { name: "Simple Linear Regression", description: "Single predictor model", difficulty: "Intermediate" },
        { name: "Multiple Regression", description: "Multiple predictors", difficulty: "Advanced" },
        { name: "Polynomial Regression", description: "Non-linear relationships", difficulty: "Advanced" },
        { name: "Logistic Regression", description: "Binary outcome prediction", difficulty: "Expert" },
      ]
    },
    {
      title: "Non-parametric Tests",
      description: "Distribution-free statistical methods",
      icon: Zap,
      tests: [
        { name: "Mann-Whitney U", description: "Non-parametric two-sample test", difficulty: "Intermediate" },
        { name: "Wilcoxon Signed-rank", description: "Non-parametric paired test", difficulty: "Intermediate" },
        { name: "Kruskal-Wallis", description: "Non-parametric ANOVA", difficulty: "Advanced" },
        { name: "Dunn's Test", description: "Post-hoc for Kruskal-Wallis", difficulty: "Advanced" },
      ]
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "Intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "Advanced": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "Expert": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statistical Analysis</h1>
        <p className="text-muted-foreground">
          Choose from professional-grade statistical tests and analyses.
        </p>
      </div>

      <div className="grid gap-6">
        {analysisCategories.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <category.icon className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {category.tests.map((test, testIndex) => (
                  <div key={testIndex} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{test.name}</span>
                        <Badge variant="outline" className={getDifficultyColor(test.difficulty)}>
                          {test.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Run Test
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Start Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>New to statistical analysis? Start here.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto font-semibold">1</div>
              <h4 className="font-medium">Upload Data</h4>
              <p className="text-sm text-muted-foreground">Start with your dataset in CSV format</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto font-semibold">2</div>
              <h4 className="font-medium">Choose Test</h4>
              <p className="text-sm text-muted-foreground">Select appropriate statistical analysis</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto font-semibold">3</div>
              <h4 className="font-medium">Interpret Results</h4>
              <p className="text-sm text-muted-foreground">Review results and generate reports</p>
            </div>
          </div>
          <div className="flex justify-center">
            <Button>Get Started</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}