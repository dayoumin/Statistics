import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Database, Download, Eye, Settings } from "lucide-react"

export default function DataPage() {
  const sampleDatasets = [
    {
      name: "Fisheries CPUE Data",
      description: "Catch per unit effort data for fisheries analysis",
      format: "CSV",
      size: "156 KB",
      rows: 1234,
      columns: 8,
      status: "Active"
    },
    {
      name: "Clinical Trial Results",
      description: "Medical research data with treatment groups",
      format: "CSV", 
      size: "89 KB",
      rows: 450,
      columns: 12,
      status: "Processed"
    },
    {
      name: "Survey Responses",
      description: "Customer satisfaction survey data",
      format: "CSV",
      size: "203 KB", 
      rows: 2156,
      columns: 15,
      status: "Active"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "Processed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "Error": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Management</h1>
          <p className="text-muted-foreground">
            Upload, manage, and validate your datasets for statistical analysis.
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Dataset
        </Button>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Dataset
          </CardTitle>
          <CardDescription>
            Drag and drop your CSV files or click to browse. Maximum file size: 50MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Drop your files here</p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports CSV, TSV, and Excel files
            </p>
            <Button variant="outline">Browse Files</Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Datasets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Your Datasets
          </CardTitle>
          <CardDescription>
            Manage and analyze your uploaded datasets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sampleDatasets.map((dataset, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{dataset.name}</h4>
                      <Badge variant="outline" className={getStatusColor(dataset.status)}>
                        {dataset.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{dataset.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{dataset.format}</span>
                      <span>{dataset.size}</span>
                      <span>{dataset.rows.toLocaleString()} rows</span>
                      <span>{dataset.columns} columns</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    Analyze
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Validation */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data Validation</CardTitle>
            <CardDescription>
              Ensure your data meets statistical analysis requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Missing value detection</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Outlier identification</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Data type verification</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Normality testing</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supported Formats</CardTitle>
            <CardDescription>
              File formats accepted by the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">CSV (Comma Separated Values)</span>
              <Badge variant="outline">Recommended</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">TSV (Tab Separated Values)</span>
              <Badge variant="outline">Supported</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Excel (.xlsx)</span>
              <Badge variant="outline">Supported</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Excel (.xls)</span>
              <Badge variant="outline">Legacy</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}