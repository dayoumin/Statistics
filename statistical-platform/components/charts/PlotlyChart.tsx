'use client'

import dynamic from 'next/dynamic'
import { memo } from 'react'

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js').then(mod => mod.default || mod) as any, {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center">차트 로딩중...</div>
}) as any

interface PlotlyChartProps {
  data: any[]
  layout?: any
  config?: any
  className?: string
}

export const PlotlyChart = memo(function PlotlyChart({
  data,
  layout = {},
  config = {},
  className = ''
}: PlotlyChartProps) {
  const defaultLayout = {
    autosize: true,
    margin: { t: 40, r: 40, b: 40, l: 50 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: 'system-ui, -apple-system, sans-serif',
      size: 12,
      color: 'hsl(var(--foreground))'
    },
    xaxis: {
      gridcolor: 'hsl(var(--border))',
      zerolinecolor: 'hsl(var(--border))'
    },
    yaxis: {
      gridcolor: 'hsl(var(--border))',
      zerolinecolor: 'hsl(var(--border))'
    },
    ...layout
  }

  const defaultConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: 'chart',
      height: 600,
      width: 800,
      scale: 2
    },
    ...config
  }

  return (
    <div className={`w-full ${className}`}>
      <Plot
        data={data}
        layout={defaultLayout}
        config={defaultConfig}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  )
})