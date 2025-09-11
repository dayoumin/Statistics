"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Download, TrendingUp } from "lucide-react"

interface AnalysisResult {
  type: string
  method: string
  testValue?: number
  column?: string
  columns?: string[]
  results: Record<string, unknown>
  timestamp: Date
}

interface AnalysisResultsDisplayProps {
  results: AnalysisResult | null
}

export function AnalysisResultsDisplay({ results }: AnalysisResultsDisplayProps) {
  if (!results) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          분석 결과
        </CardTitle>
        <CardDescription>
          {results.method} | {results.timestamp.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(results, null, 2)}
          </pre>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              결과 다운로드
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              시각화 보기
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}