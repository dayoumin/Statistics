"use client"

import { useMemo } from "react"
import { ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BoxplotProps {
  data: Array<{ group: string; value: number }>
  title?: string
  xAxisLabel?: string
  yAxisLabel?: string
  colors?: string[]
}

interface BoxplotSummary {
  group: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean: number
  outliers: number[]
  color: string
}

function calculateBoxplotStats(values: number[]): Omit<BoxplotSummary, 'group' | 'color'> {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  
  if (n === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0, mean: 0, outliers: [] }
  }
  
  const min = sorted[0]
  const max = sorted[n - 1]
  const mean = values.reduce((sum, val) => sum + val, 0) / n
  
  // Calculate quartiles
  const q1 = sorted[Math.floor(n * 0.25)]
  const median = n % 2 === 0 
    ? (sorted[Math.floor(n / 2) - 1] + sorted[Math.floor(n / 2)]) / 2
    : sorted[Math.floor(n / 2)]
  const q3 = sorted[Math.floor(n * 0.75)]
  
  // Calculate outliers (values beyond 1.5 * IQR from quartiles)
  const iqr = q3 - q1
  const lowerFence = q1 - 1.5 * iqr
  const upperFence = q3 + 1.5 * iqr
  const outliers = values.filter(val => val < lowerFence || val > upperFence)
  
  return { min, q1, median, q3, max, mean, outliers }
}

const CustomBoxplot = ({ payload, x, y, width, height }: any) => {
  if (!payload || !payload.payload) return null
  
  const { min, q1, median, q3, max, color } = payload.payload
  const boxWidth = width * 0.6
  const boxX = x - boxWidth / 2
  const whiskerX = x
  
  // Scale values to chart coordinates
  const scale = (value: number) => {
    const dataMin = Math.min(...payload.payload.allValues)
    const dataMax = Math.max(...payload.payload.allValues)
    return y + height - ((value - dataMin) / (dataMax - dataMin)) * height
  }
  
  return (
    <g>
      {/* Whiskers */}
      <line 
        x1={whiskerX} y1={scale(min)} 
        x2={whiskerX} y2={scale(q1)} 
        stroke={color} strokeWidth={2}
      />
      <line 
        x1={whiskerX} y1={scale(q3)} 
        x2={whiskerX} y2={scale(max)} 
        stroke={color} strokeWidth={2}
      />
      
      {/* Whisker caps */}
      <line 
        x1={whiskerX - boxWidth/4} y1={scale(min)} 
        x2={whiskerX + boxWidth/4} y2={scale(min)} 
        stroke={color} strokeWidth={2}
      />
      <line 
        x1={whiskerX - boxWidth/4} y1={scale(max)} 
        x2={whiskerX + boxWidth/4} y2={scale(max)} 
        stroke={color} strokeWidth={2}
      />
      
      {/* Box */}
      <rect
        x={boxX}
        y={scale(q3)}
        width={boxWidth}
        height={scale(q1) - scale(q3)}
        fill={color}
        fillOpacity={0.3}
        stroke={color}
        strokeWidth={2}
      />
      
      {/* Median line */}
      <line
        x1={boxX}
        y1={scale(median)}
        x2={boxX + boxWidth}
        y2={scale(median)}
        stroke={color}
        strokeWidth={3}
      />
    </g>
  )
}

export function Boxplot({ 
  data, 
  title = "그룹별 박스플롯", 
  xAxisLabel = "그룹",
  yAxisLabel = "값",
  colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1"]
}: BoxplotProps) {
  
  const boxplotData = useMemo(() => {
    if (data.length === 0) return []
    
    // Group data by group
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.group]) acc[item.group] = []
      acc[item.group].push(item.value)
      return acc
    }, {} as Record<string, number[]>)
    
    // Calculate boxplot statistics for each group
    return Object.entries(grouped).map(([group, values], index) => {
      const stats = calculateBoxplotStats(values)
      return {
        group,
        ...stats,
        color: colors[index % colors.length],
        allValues: values // for scaling in custom component
      }
    })
  }, [data, colors])
  
  if (boxplotData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>데이터가 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            그룹별 데이터를 선택해주세요
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          그룹별 분포 비교 ({boxplotData.length}개 그룹, n = {data.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={boxplotData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="group" 
                label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]) return null
                  
                  const data = payload[0].payload as BoxplotSummary
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <h4 className="font-medium">{data.group}</h4>
                      <div className="text-sm space-y-1">
                        <div>최대값: {data.max.toFixed(3)}</div>
                        <div>Q3: {data.q3.toFixed(3)}</div>
                        <div>중앙값: {data.median.toFixed(3)}</div>
                        <div>평균: {data.mean.toFixed(3)}</div>
                        <div>Q1: {data.q1.toFixed(3)}</div>
                        <div>최소값: {data.min.toFixed(3)}</div>
                        {data.outliers.length > 0 && (
                          <div>이상치: {data.outliers.length}개</div>
                        )}
                      </div>
                    </div>
                  )
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">그룹별 통계 요약</h4>
          <div className="grid gap-2 text-sm max-h-32 overflow-y-auto">
            {boxplotData.map((group) => (
              <div key={group.group} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="font-medium">{group.group}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  평균: {group.mean.toFixed(2)}, 중앙값: {group.median.toFixed(2)}
                  {group.outliers.length > 0 && `, 이상치: ${group.outliers.length}개`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}