'use client'

import React from 'react'
import { PyodideAnalysisPanel } from './pyodide-analysis-panel'

interface StatisticalAnalysisRuntimeProps {
  datasetId: string
  testType: string
}

export function StatisticalAnalysisRuntime({ datasetId, testType }: StatisticalAnalysisRuntimeProps) {
  // 모든 통계 분석을 Pyodide 기반 패널로 처리
  return <PyodideAnalysisPanel datasetId={datasetId} testType={testType} />
}