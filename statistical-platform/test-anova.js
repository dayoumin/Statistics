// ANOVA 테스트를 위한 수동 계산
const group1 = [23, 25, 27, 29, 31, 33]
const group2 = [28, 30, 32, 34, 36, 38]
const group3 = [35, 37, 39, 41, 43, 45]

// 각 그룹의 평균
const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length
const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length
const mean3 = group3.reduce((a, b) => a + b, 0) / group3.length

console.log('Group means:', { mean1, mean2, mean3 })

// 전체 평균
const allData = [...group1, ...group2, ...group3]
const grandMean = allData.reduce((a, b) => a + b, 0) / allData.length
console.log('Grand mean:', grandMean)

// SS Between
const n = group1.length // 각 그룹 크기 동일
const SSBetween = n * (Math.pow(mean1 - grandMean, 2) + 
                       Math.pow(mean2 - grandMean, 2) + 
                       Math.pow(mean3 - grandMean, 2))
console.log('SS Between:', SSBetween)

// SS Within
const SSWithin1 = group1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0)
const SSWithin2 = group2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0)
const SSWithin3 = group3.reduce((sum, val) => sum + Math.pow(val - mean3, 2), 0)
const SSWithin = SSWithin1 + SSWithin2 + SSWithin3
console.log('SS Within:', SSWithin)

// 자유도
const dfBetween = 3 - 1 // k - 1
const dfWithin = 18 - 3 // N - k
console.log('Degrees of freedom:', { dfBetween, dfWithin })

// Mean Squares
const MSBetween = SSBetween / dfBetween
const MSWithin = SSWithin / dfWithin
console.log('Mean Squares:', { MSBetween, MSWithin })

// F-statistic
const F = MSBetween / MSWithin
console.log('F-statistic:', F)

// 예상 F값 = 37.8이어야 함
console.log('Expected F:', 37.8)
console.log('Difference:', Math.abs(F - 37.8))