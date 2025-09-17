/**
 * Calculate Pearson correlation coefficient between two numeric arrays
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0

  // Use single-pass algorithm for efficiency
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0

  for (let i = 0; i < n; i++) {
    sumX += x[i]
    sumY += y[i]
    sumXY += x[i] * y[i]
    sumX2 += x[i] * x[i]
    sumY2 += y[i] * y[i]
  }

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Calculate correlation matrix for multiple numeric columns
 * Optimized version with caching to avoid redundant parsing
 */
export function calculateCorrelationMatrix(
  data: any[],
  columnNames: string[]
): { matrix: number[][], labels: string[] } {
  // Pre-parse all columns once to avoid redundant computation
  const columnDataCache = new Map<string, number[]>()

  for (const columnName of columnNames) {
    columnDataCache.set(
      columnName,
      getNumericColumnData(data, columnName)
    )
  }

  const matrix: number[][] = []

  for (let i = 0; i < columnNames.length; i++) {
    const row: number[] = []
    const xData = columnDataCache.get(columnNames[i]) || []

    for (let j = 0; j < columnNames.length; j++) {
      if (i === j) {
        row.push(1)
      } else {
        const yData = columnDataCache.get(columnNames[j]) || []
        row.push(calculateCorrelation(xData, yData))
      }
    }
    matrix.push(row)
  }

  return { matrix, labels: columnNames }
}

/**
 * Extract numeric data from a column with null/undefined handling
 */
export function getNumericColumnData(data: any[], columnName: string): number[] {
  if (!data || !columnName) return []

  return data
    .map(row => row?.[columnName])
    .filter(value => value !== null && value !== undefined)
    .map(value => parseFloat(value))
    .filter(value => !isNaN(value) && isFinite(value))
}