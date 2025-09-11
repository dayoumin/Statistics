'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ScatterPlotProps {
  xData: number[]
  yData: number[]
  regression?: {
    slope: number
    intercept: number
    r_squared: number
  }
  title?: string
  xLabel?: string
  yLabel?: string
}

export default function ScatterPlot({ 
  xData, 
  yData, 
  regression,
  title = 'Scatter Plot',
  xLabel = 'X',
  yLabel = 'Y'
}: ScatterPlotProps) {
  
  // Prepare scatter data
  const scatterData = xData.map((x, i) => ({ x, y: yData[i] }))
  
  const datasets: any[] = [
    {
      label: 'Data Points',
      data: scatterData,
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
      pointRadius: 5,
      pointHoverRadius: 7
    }
  ]
  
  // Add regression line if provided
  if (regression) {
    const minX = Math.min(...xData)
    const maxX = Math.max(...xData)
    const regressionLine = [
      { x: minX, y: regression.slope * minX + regression.intercept },
      { x: maxX, y: regression.slope * maxX + regression.intercept }
    ]
    
    datasets.push({
      label: `y = ${regression.slope.toFixed(3)}x + ${regression.intercept.toFixed(3)}`,
      data: regressionLine,
      type: 'line',
      backgroundColor: 'transparent',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 2,
      pointRadius: 0,
      fill: false
    })
  }
  
  const chartData = {
    datasets
  }
  
  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.parsed
            return `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xLabel
        },
        type: 'linear',
        position: 'bottom'
      },
      y: {
        title: {
          display: true,
          text: yLabel
        }
      }
    }
  }
  
  return (
    <div className="w-full h-96 bg-white p-4 rounded-lg shadow">
      <Scatter data={chartData} options={options} />
      
      {/* Regression Statistics */}
      {regression && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="font-semibold text-gray-700 mb-2">Regression Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Equation:</span>
              <p className="font-mono">y = {regression.slope.toFixed(3)}x + {regression.intercept.toFixed(3)}</p>
            </div>
            <div>
              <span className="text-gray-600">R²:</span>
              <p className="font-semibold">{(regression.r_squared * 100).toFixed(2)}%</p>
            </div>
            <div>
              <span className="text-gray-600">Correlation:</span>
              <p className="font-semibold">{Math.sqrt(regression.r_squared).toFixed(3)}</p>
            </div>
            <div>
              <span className="text-gray-600">Sample Size:</span>
              <p className="font-semibold">{xData.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}