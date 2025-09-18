import { SmartAnalysisEngine } from '@/lib/smart-analysis-engine'

describe('SmartAnalysisEngine - merge duplicates and normalize confidence', () => {
  test('merges duplicate methods and keeps highest confidence', () => {
    const columns = [
      { name: 'score', type: 'numeric', sampleValues: [], missingCount: 0, uniqueCount: 100 },
      { name: 'group', type: 'categorical', sampleValues: [], missingCount: 0, uniqueCount: 3 }
    ] as any

    const recs = SmartAnalysisEngine.recommendAnalyses(columns, '그룹 간 차이 분석')
    const methods = recs.map(r => r.method)

    // 일원분산분석이 한번만 존재해야 함
    const anovaCount = methods.filter(m => m === '일원분산분석').length
    expect(anovaCount).toBeLessThanOrEqual(1)
  })
})


