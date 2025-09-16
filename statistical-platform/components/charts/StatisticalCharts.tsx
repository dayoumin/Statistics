'use client'

import { memo, useMemo } from 'react'
import { PlotlyChart } from './PlotlyChart'
import { ColumnStatistics } from '@/types/smart-flow'

interface HistogramChartProps {
  data: number[]
  title: string
  xLabel?: string
}

export const HistogramChart = memo(function HistogramChart({
  data,
  title,
  xLabel = 'Value'
}: HistogramChartProps) {
  const plotData = useMemo(() => [{
    x: data,
    type: 'histogram' as const,
    marker: {
      color: 'hsl(var(--primary))',
      opacity: 0.7
    },
    nbinsx: 20
  }], [data])

  const layout = {
    title: {
      text: title,
      font: { size: 14 }
    },
    xaxis: { title: xLabel },
    yaxis: { title: '빈도' },
    showlegend: false,
    height: 300
  }

  return <PlotlyChart data={plotData} layout={layout} />
})

interface BoxPlotChartProps {
  data: number[] | { [key: string]: number[] }
  title: string
  orientation?: 'v' | 'h'
}

export const BoxPlotChart = memo(function BoxPlotChart({
  data,
  title,
  orientation = 'v'
}: BoxPlotChartProps) {
  const plotData = useMemo(() => {
    if (Array.isArray(data)) {
      return [{
        y: orientation === 'v' ? data : undefined,
        x: orientation === 'h' ? data : undefined,
        type: 'box' as const,
        name: title,
        marker: { color: 'hsl(var(--primary))' },
        boxmean: true
      }]
    } else {
      return Object.entries(data).map(([name, values]) => ({
        y: orientation === 'v' ? values : undefined,
        x: orientation === 'h' ? values : undefined,
        type: 'box' as const,
        name,
        boxmean: true
      }))
    }
  }, [data, title, orientation])

  const layout = {
    title: {
      text: title,
      font: { size: 14 }
    },
    showlegend: !Array.isArray(data),
    height: 350
  }

  return <PlotlyChart data={plotData} layout={layout} />
})

interface BarChartProps {
  categories: string[]
  values: number[]
  title: string
  orientation?: 'v' | 'h'
}

export const BarChart = memo(function BarChart({
  categories,
  values,
  title,
  orientation = 'v'
}: BarChartProps) {
  const plotData = useMemo(() => [{
    x: orientation === 'v' ? categories : values,
    y: orientation === 'v' ? values : categories,
    type: 'bar' as const,
    marker: {
      color: 'hsl(var(--primary))',
      opacity: 0.8
    },
    text: values.map(v => v.toString()),
    textposition: 'auto',
    orientation
  }], [categories, values, orientation])

  const layout = {
    title: {
      text: title,
      font: { size: 14 }
    },
    xaxis: orientation === 'v' ? { title: '카테고리' } : { title: '값' },
    yaxis: orientation === 'v' ? { title: '빈도' } : { title: '카테고리' },
    showlegend: false,
    height: 300
  }

  return <PlotlyChart data={plotData} layout={layout} />
})

interface ScatterPlotProps {
  xData: number[]
  yData: number[]
  title: string
  xLabel?: string
  yLabel?: string
  showTrendline?: boolean
}

export const ScatterPlot = memo(function ScatterPlot({
  xData,
  yData,
  title,
  xLabel = 'X',
  yLabel = 'Y',
  showTrendline = false
}: ScatterPlotProps) {
  const plotData = useMemo(() => {
    const traces: any[] = [{
      x: xData,
      y: yData,
      mode: 'markers',
      type: 'scatter',
      name: '데이터',
      marker: {
        color: 'hsl(var(--primary))',
        size: 8,
        opacity: 0.6
      }
    }]

    if (showTrendline && xData.length > 1) {
      // Simple linear regression for trendline
      const n = xData.length
      const sumX = xData.reduce((a, b) => a + b, 0)
      const sumY = yData.reduce((a, b) => a + b, 0)
      const sumXY = xData.reduce((sum, x, i) => sum + x * yData[i], 0)
      const sumX2 = xData.reduce((sum, x) => sum + x * x, 0)

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
      const intercept = (sumY - slope * sumX) / n

      const xMin = Math.min(...xData)
      const xMax = Math.max(...xData)

      traces.push({
        x: [xMin, xMax],
        y: [slope * xMin + intercept, slope * xMax + intercept],
        mode: 'lines',
        type: 'scatter',
        name: '추세선',
        line: {
          color: 'hsl(var(--destructive))',
          width: 2,
          dash: 'dash'
        }
      })
    }

    return traces
  }, [xData, yData, showTrendline])

  const layout = {
    title: {
      text: title,
      font: { size: 14 }
    },
    xaxis: { title: xLabel },
    yaxis: { title: yLabel },
    showlegend: showTrendline,
    height: 400
  }

  return <PlotlyChart data={plotData} layout={layout} />
})

interface HeatmapChartProps {
  data: number[][]
  xLabels: string[]
  yLabels: string[]
  title: string
}

export const HeatmapChart = memo(function HeatmapChart({
  data,
  xLabels,
  yLabels,
  title
}: HeatmapChartProps) {
  const plotData = useMemo(() => [{
    z: data,
    x: xLabels,
    y: yLabels,
    type: 'heatmap' as const,
    colorscale: 'RdBu',
    reversescale: true,
    showscale: true,
    text: data.map(row => row.map(val => val.toFixed(2))),
    texttemplate: '%{text}',
    textfont: {
      size: 10
    }
  }], [data, xLabels, yLabels])

  const layout = {
    title: {
      text: title,
      font: { size: 14 }
    },
    height: 400,
    xaxis: {
      side: 'bottom'
    }
  }

  return <PlotlyChart data={plotData} layout={layout} />
})

// Utility function to prepare data for statistical charts
export function prepareColumnStatisticsChart(stats: ColumnStatistics) {
  if (stats.type === 'numeric' && stats.mean !== undefined) {
    return {
      type: 'box',
      data: {
        mean: stats.mean,
        median: stats.median || 0,
        q1: stats.q1 || 0,
        q3: stats.q3 || 0,
        min: stats.min || 0,
        max: stats.max || 0,
        outliers: stats.outliers || []
      }
    }
  } else if (stats.type === 'categorical' && stats.topCategories) {
    return {
      type: 'bar',
      data: {
        categories: stats.topCategories.map(c => c.value),
        values: stats.topCategories.map(c => c.count)
      }
    }
  }
  return null
}