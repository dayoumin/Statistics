import { SmartRecommender } from '@/lib/services/smart-recommender'

describe('SmartRecommender - assumption-aware alternatives', () => {
  test('recommends Mann-Whitney, Welch ANOVA, Games-Howell when non-normal and heteroscedastic', () => {
    const context = {
      purposeText: '두 그룹 평균 차이',
      dataShape: {
        rows: 20,
        columns: 2,
        columnTypes: ['numeric', 'categorical'] as ('numeric' | 'categorical' | 'datetime' | 'text')[],
        columnNames: ['value', 'group']
      },
      dataQuality: {
        missingRatio: 0,
        outlierRatio: 0,
        isNormallyDistributed: false,
        isHomoscedastic: false
      }
    }

    const result = SmartRecommender.recommend(context)
    const ids = result.methods.map(m => m.id)

    expect(ids).toEqual(expect.arrayContaining(['mannwhitney', 'welchAnova', 'gamesHowell']))
    expect(['high', 'medium', 'low']).toContain(result.confidence)
  })
})


