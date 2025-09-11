import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Calculator, Database, FileText } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Statistical Analysis Platform
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Professional-grade statistical analysis tool designed for researchers, 
          data scientists, and statisticians. Perform comprehensive statistical 
          tests with ease and precision.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="text-center">
          <CardHeader>
            <Calculator className="h-10 w-10 mx-auto text-primary" />
            <CardTitle>Basic Statistics</CardTitle>
            <CardDescription>
              t-tests, ANOVA, correlation analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/analysis">
              <Button variant="outline" className="w-full">
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <BarChart3 className="h-10 w-10 mx-auto text-primary" />
            <CardTitle>Advanced Analysis</CardTitle>
            <CardDescription>
              Post-hoc tests, regression, power analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/analysis">
              <Button variant="outline" className="w-full">
                Explore
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Database className="h-10 w-10 mx-auto text-primary" />
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Import, clean, and validate datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/data">
              <Button variant="outline" className="w-full">
                Upload Data
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <FileText className="h-10 w-10 mx-auto text-primary" />
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              Generate publication-ready reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
        <p className="text-muted-foreground mb-4">
          Ready to begin your statistical analysis? Follow these simple steps:
        </p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Upload your dataset or use sample data</li>
          <li>Choose your statistical test</li>
          <li>Review assumptions and results</li>
          <li>Generate comprehensive reports</li>
        </ol>
        <Link href="/analysis">
          <Button className="mt-4">Start Analysis</Button>
        </Link>
      </div>
    </div>
  );
}
