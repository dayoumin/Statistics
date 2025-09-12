'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Play,
  Loader2,
  Info,
  Download
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { 
  subscribeToPyodide, 
  getPyodideState,
  loadPyodideRuntime,
  type PyodideState 
} from '@/lib/pyodide-runtime-loader'
import * as stats from '@/lib/pyodide-statistics'
import { PyodideStatusCard } from './pyodide-status-card'
import { generateQuickReport } from '@/lib/pdf-report-service'

interface PyodideAnalysisPanelProps {
  datasetId: string
  testType: string
}

export function PyodideAnalysisPanel({ datasetId, testType }: PyodideAnalysisPanelProps) {
  const { datasets } = useAppStore()
  const [pyodideState, setPyodideState] = useState<PyodideState>(getPyodideState())
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [groupColumn, setGroupColumn] = useState<string>('')
  const [postHocTest, setPostHocTest] = useState<'none' | 'tukey' | 'bonferroni' | 'games-howell'>('none')
  const [result, setResult] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const dataset = datasets.find(d => d.id === datasetId)
  
  // Pyodide 상태 구독
  useEffect(() => {
    const unsubscribe = subscribeToPyodide(setPyodideState)
    return unsubscribe  // unsubscribe는 이미 함수를 반환함
  }, [])
  
  if (!dataset) {
    return <Alert variant="destructive">Dataset not found</Alert>
  }
  
  if (!dataset.data || dataset.data.length === 0) {
    return <Alert variant="destructive">Dataset has no data</Alert>
  }
  
  const columnNames = Object.keys(dataset.data[0] || {})
  
  const numericColumns = columnNames.filter(col => {
    const values = dataset.data.map((row: any) => row[col])
    return values.some((val: any) => !isNaN(parseFloat(val)))
  })
  
  const runAnalysis = async () => {
    if (pyodideState.status !== 'ready') {
      setError('Please load the statistics engine first')
      return
    }
    
    setIsRunning(true)
    setError(null)
    setResult(null)
    
    try {
      let analysisResult: any = null
      
      switch (testType) {
        case '기술통계량':
        case 'Descriptive Statistics': {
          if (selectedColumns.length === 0) {
            throw new Error('Please select at least one column')
          }
          
          const results: any = {}
          for (const col of selectedColumns) {
            const values = dataset.data
              .map((row: any) => parseFloat(row[col]))
              .filter((val: number) => !isNaN(val))
            
            if (values.length > 0) {
              results[col] = await stats.calculateDescriptiveStats(values)
            }
          }
          analysisResult = results
          break
        }
        
        case '일표본 t-검정':
        case 'One-sample t-test': {
          if (selectedColumns.length !== 1) {
            throw new Error('Please select one column')
          }
          
          const values = dataset.data
            .map((row: any) => parseFloat(row[selectedColumns[0]]))
            .filter((val: number) => !isNaN(val))
          
          // TODO: Add UI for population mean input
          const populationMean = 0 // Default value
          analysisResult = await stats.oneSampleTTest(values, populationMean)
          break
        }
        
        case '독립표본 t-검정':
        case 'Independent t-test': {
          if (selectedColumns.length !== 1 || !groupColumn) {
            throw new Error('Please select one value column and one group column')
          }
          
          const groups = new Map<string, number[]>()
          dataset.data.forEach((row: any) => {
            const group = row[groupColumn]
            const value = parseFloat(row[selectedColumns[0]])
            
            if (!isNaN(value)) {
              if (!groups.has(group)) {
                groups.set(group, [])
              }
              groups.get(group)!.push(value)
            }
          })
          
          const groupArray = Array.from(groups.values())
          if (groupArray.length !== 2) {
            throw new Error('T-test requires exactly 2 groups')
          }
          
          analysisResult = await stats.twoSampleTTest(groupArray[0], groupArray[1])
          break
        }
        
        case '대응표본 t-검정':
        case 'Paired t-test': {
          if (selectedColumns.length !== 2) {
            throw new Error('Please select exactly two columns for paired comparison')
          }
          
          const before: number[] = []
          const after: number[] = []
          
          dataset.data.forEach((row: any) => {
            const val1 = parseFloat(row[selectedColumns[0]])
            const val2 = parseFloat(row[selectedColumns[1]])
            
            if (!isNaN(val1) && !isNaN(val2)) {
              before.push(val1)
              after.push(val2)
            }
          })
          
          analysisResult = await stats.pairedTTest(before, after)
          break
        }
        
        case '일원분산분석':
        case 'One-way ANOVA': {
          if (selectedColumns.length !== 1 || !groupColumn) {
            throw new Error('Please select one value column and one group column')
          }
          
          const groups = new Map<string, number[]>()
          dataset.data.forEach((row: any) => {
            const group = row[groupColumn]
            const value = parseFloat(row[selectedColumns[0]])
            
            if (!isNaN(value)) {
              if (!groups.has(group)) {
                groups.set(group, [])
              }
              groups.get(group)!.push(value)
            }
          })
          
          const groupArray = Array.from(groups.values())
          const groupNames = Array.from(groups.keys())
          
          if (groupArray.length < 2) {
            throw new Error('ANOVA requires at least 2 groups')
          }
          
          analysisResult = await stats.oneWayANOVA(groupArray, groupNames, postHocTest)
          break
        }
        
        case '상관분석':
        case 'Correlation': {
          if (selectedColumns.length !== 2) {
            throw new Error('Please select exactly two columns')
          }
          
          const xValues: number[] = []
          const yValues: number[] = []
          
          dataset.data.forEach((row: any) => {
            const x = parseFloat(row[selectedColumns[0]])
            const y = parseFloat(row[selectedColumns[1]])
            
            if (!isNaN(x) && !isNaN(y)) {
              xValues.push(x)
              yValues.push(y)
            }
          })
          
          analysisResult = await stats.correlationAnalysis(xValues, yValues)
          break
        }
        
        case '단순선형회귀':
        case 'Simple Linear Regression': {
          if (selectedColumns.length !== 2) {
            throw new Error('Please select two columns (X and Y)')
          }
          
          const xValues: number[] = []
          const yValues: number[] = []
          
          dataset.data.forEach((row: any) => {
            const x = parseFloat(row[selectedColumns[0]])
            const y = parseFloat(row[selectedColumns[1]])
            
            if (!isNaN(x) && !isNaN(y)) {
              xValues.push(x)
              yValues.push(y)
            }
          })
          
          analysisResult = await stats.simpleLinearRegression(xValues, yValues)
          break
        }
        
        case 'Mann-Whitney U 검정':
        case 'Mann-Whitney U Test': {
          if (selectedColumns.length !== 1 || !groupColumn) {
            throw new Error('Please select one value column and one group column')
          }
          
          const groups = new Map<string, number[]>()
          dataset.data.forEach((row: any) => {
            const group = row[groupColumn]
            const value = parseFloat(row[selectedColumns[0]])
            
            if (!isNaN(value)) {
              if (!groups.has(group)) {
                groups.set(group, [])
              }
              groups.get(group)!.push(value)
            }
          })
          
          const groupArray = Array.from(groups.values())
          if (groupArray.length !== 2) {
            throw new Error('Mann-Whitney U test requires exactly 2 groups')
          }
          
          analysisResult = await stats.mannWhitneyU(groupArray[0], groupArray[1])
          break
        }
        
        case 'Kruskal-Wallis 검정':
        case 'Kruskal-Wallis Test': {
          if (selectedColumns.length !== 1 || !groupColumn) {
            throw new Error('Please select one value column and one group column')
          }
          
          const groups = new Map<string, number[]>()
          dataset.data.forEach((row: any) => {
            const group = row[groupColumn]
            const value = parseFloat(row[selectedColumns[0]])
            
            if (!isNaN(value)) {
              if (!groups.has(group)) {
                groups.set(group, [])
              }
              groups.get(group)!.push(value)
            }
          })
          
          const groupArray = Array.from(groups.values())
          const groupNames = Array.from(groups.keys())
          
          if (groupArray.length < 2) {
            throw new Error('Kruskal-Wallis test requires at least 2 groups')
          }
          
          analysisResult = await stats.kruskalWallis(groupArray, groupNames)
          break
        }
        
        case 'Wilcoxon 부호순위검정':
        case 'Wilcoxon Signed-rank Test': {
          if (selectedColumns.length !== 2) {
            throw new Error('Please select exactly two columns for paired comparison')
          }
          
          const x: number[] = []
          const y: number[] = []
          
          dataset.data.forEach((row: any) => {
            const val1 = parseFloat(row[selectedColumns[0]])
            const val2 = parseFloat(row[selectedColumns[1]])
            
            if (!isNaN(val1) && !isNaN(val2)) {
              x.push(val1)
              y.push(val2)
            }
          })
          
          analysisResult = await stats.wilcoxonSignedRank(x, y)
          break
        }
        
        default:
          throw new Error(`Test type "${testType}" is not yet implemented`)
      }
      
      setResult(analysisResult)
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis')
    } finally {
      setIsRunning(false)
    }
  }
  
  const downloadReport = async () => {
    if (!result || !dataset) return
    
    try {
      await generateQuickReport(
        testType,
        result,
        dataset.name || 'Dataset'
      )
    } catch (err) {
      console.error('Failed to generate PDF report:', err)
      setError('Failed to generate PDF report')
    }
  }
  
  const renderResults = () => {
    if (!result) return null
    
    // 기술통계량 결과
    if (testType === '기술통계량' || testType === 'Descriptive Statistics') {
      return (
        <div className="space-y-4">
          {Object.entries(result).map(([colName, stats]: [string, any]) => (
            <Card key={colName}>
              <CardHeader>
                <CardTitle className="text-lg">{colName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Mean</p>
                    <p className="font-mono font-semibold">{stats.mean.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Median</p>
                    <p className="font-mono font-semibold">{stats.median.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Std Dev</p>
                    <p className="font-mono font-semibold">{stats.std.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Min</p>
                    <p className="font-mono font-semibold">{stats.min.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Max</p>
                    <p className="font-mono font-semibold">{stats.max.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Skewness</p>
                    <p className="font-mono font-semibold">{stats.skewness.toFixed(4)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }
    
    // 통계 검정 결과
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{result.testName}</CardTitle>
              <CardDescription>{result.interpretation}</CardDescription>
            </div>
            <Button onClick={downloadReport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              PDF Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Test Statistic</p>
                <p className="font-mono font-semibold text-lg">
                  {typeof result.statistic === 'number' 
                    ? result.statistic.toFixed(4) 
                    : result.statistic}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">p-value</p>
                <p className={`font-mono font-semibold text-lg ${
                  result.pValue < 0.05 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {result.pValue.toFixed(4)}
                </p>
              </div>
              {result.effectSize !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground">Effect Size</p>
                  <p className="font-mono font-semibold">{result.effectSize.toFixed(4)}</p>
                </div>
              )}
              {result.degreesOfFreedom !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground">Degrees of Freedom</p>
                  <p className="font-mono font-semibold">{result.degreesOfFreedom}</p>
                </div>
              )}
            </div>
            
            {result.groups && (
              <div>
                <h4 className="font-semibold mb-2">Group Statistics</h4>
                <div className="space-y-2">
                  {result.groups.map((group: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">{group.name}</span>
                      <div className="flex gap-4 text-sm">
                        <span>n={group.n}</span>
                        <span>Mean={group.mean?.toFixed(2) || group.median?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {result.postHoc && (
              <div>
                <h4 className="font-semibold mb-2">Post-hoc Test Results</h4>
                <p className="text-sm text-muted-foreground mb-2">{result.postHoc.testName}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Group 1</th>
                        <th className="text-left p-2">Group 2</th>
                        <th className="text-left p-2">p-value</th>
                        <th className="text-left p-2">Significant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.postHoc.comparisons.map((comp: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{comp.group1}</td>
                          <td className="p-2">{comp.group2}</td>
                          <td className="p-2 font-mono">{comp.pValue.toFixed(4)}</td>
                          <td className="p-2">
                            {comp.significant ? (
                              <Badge variant="default" className="bg-green-600">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <Alert className={result.isSignificant ? 'border-green-600' : 'border-orange-600'}>
              <Info className="h-4 w-4" />
              <AlertTitle>Result</AlertTitle>
              <AlertDescription>
                {result.isSignificant 
                  ? 'The result is statistically significant (p < 0.05)'
                  : 'The result is not statistically significant (p ≥ 0.05)'}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Pyodide 상태 카드 */}
      <PyodideStatusCard 
        pyodideState={pyodideState}
        onStartLoading={loadPyodideRuntime}
      />
      
      {/* 분석 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Analysis</CardTitle>
          <CardDescription>
            Select columns for {testType} analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Select Columns:</p>
            <div className="flex flex-wrap gap-2">
              {numericColumns.map(col => (
                <Button
                  key={col}
                  variant={selectedColumns.includes(col) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (selectedColumns.includes(col)) {
                      setSelectedColumns(selectedColumns.filter(c => c !== col))
                    } else {
                      setSelectedColumns([...selectedColumns, col])
                    }
                  }}
                  disabled={pyodideState.status !== 'ready'}
                >
                  {col}
                </Button>
              ))}
            </div>
          </div>
          
          {(testType.includes('t-검정') || testType.includes('t-test') ||
            testType.includes('ANOVA') || testType.includes('분산분석') ||
            testType.includes('Mann-Whitney') || testType.includes('Kruskal-Wallis')) && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Group Column:</p>
                <Select value={groupColumn} onValueChange={setGroupColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columnNames.filter(col => !numericColumns.includes(col)).map(col => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {(testType.includes('ANOVA') || testType.includes('분산분석')) && (
                <div>
                  <p className="text-sm font-medium mb-2">Post-hoc Test (if significant):</p>
                  <Select value={postHocTest} onValueChange={(value: any) => setPostHocTest(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select post-hoc test" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="tukey">Tukey HSD</SelectItem>
                      <SelectItem value="bonferroni">Bonferroni</SelectItem>
                      <SelectItem value="games-howell">Games-Howell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          
          <Button 
            onClick={runAnalysis} 
            disabled={isRunning || selectedColumns.length === 0 || pyodideState.status !== 'ready'}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Analysis...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* 결과 표시 */}
      {result && renderResults()}
    </div>
  )
}