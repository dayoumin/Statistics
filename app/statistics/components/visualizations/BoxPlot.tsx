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
import { Chart } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface BoxPlotProps {
  data: {
    [groupName: string]: number[]
  }
  title?: string
  yLabel?: string
}

export default function BoxPlot({ data, title = 'Box Plot', yLabel = 'Values' }: BoxPlotProps) {
  // Calculate box plot statistics for each group
  const calculateBoxStats = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    const n = sorted.length
    
    const q1 = sorted[Math.floor(n * 0.25)]
    const median = n % 2 === 0 
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
      : sorted[Math.floor(n / 2)]
    const q3 = sorted[Math.floor(n * 0.75)]
    const iqr = q3 - q1
    
    const min = Math.max(sorted[0], q1 - 1.5 * iqr)
    const max = Math.min(sorted[n - 1], q3 + 1.5 * iqr)
    
    const outliers = values.filter(v => v < min || v > max)
    
    return { min, q1, median, q3, max, outliers }
  }
  
  const groups = Object.keys(data)
  const boxStats = groups.map(group => ({
    group,
    ...calculateBoxStats(data[group])
  }))
  
  // Prepare data for Chart.js (using custom drawing)
  const chartData = {
    labels: groups,
    datasets: [
      {
        label: 'Min',
        data: boxStats.map(s => s.min),
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        pointRadius: 0
      },
      {
        label: 'Q1',
        data: boxStats.map(s => s.q1),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2
      },
      {
        label: 'Median',
        data: boxStats.map(s => s.median),
        backgroundColor: 'rgba(255, 99, 132, 1)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 3,
        pointRadius: 0,
        type: 'line' as const
      },
      {
        label: 'Q3',
        data: boxStats.map(s => s.q3),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2
      },
      {
        label: 'Max',
        data: boxStats.map(s => s.max),
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        pointRadius: 0
      }
    ]
  }
  
  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false
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
            const index = context.dataIndex
            const stats = boxStats[index]
            return [
              `Min: ${stats.min.toFixed(2)}`,
              `Q1: ${stats.q1.toFixed(2)}`,
              `Median: ${stats.median.toFixed(2)}`,
              `Q3: ${stats.q3.toFixed(2)}`,
              `Max: ${stats.max.toFixed(2)}`,
              `Outliers: ${stats.outliers.length}`
            ]
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: yLabel
        }
      },
      x: {
        title: {
          display: true,
          text: 'Groups'
        }
      }
    }
  }
  
  return (
    <div className="w-full h-96 bg-white p-4 rounded-lg shadow">
      <Chart type='line' data={chartData} options={options} />
      
      {/* Statistics Summary */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {boxStats.map((stats, index) => (
          <div key={index} className="border rounded p-2">
            <h4 className="font-semibold text-gray-700">{stats.group}</h4>
            <div className="grid grid-cols-2 gap-1 mt-1 text-gray-600">
              <span>Min:</span> <span>{stats.min.toFixed(2)}</span>
              <span>Q1:</span> <span>{stats.q1.toFixed(2)}</span>
              <span>Median:</span> <span className="font-medium">{stats.median.toFixed(2)}</span>
              <span>Q3:</span> <span>{stats.q3.toFixed(2)}</span>
              <span>Max:</span> <span>{stats.max.toFixed(2)}</span>
              <span>Outliers:</span> <span>{stats.outliers.length}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}