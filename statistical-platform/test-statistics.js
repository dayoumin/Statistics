/**
 * 통계 기능 테스트 스크립트
 * Node.js에서 실행하여 Pyodide 통계 함수들을 테스트
 */

const fs = require('fs');
const path = require('path');

// CSV 파일 읽기 함수
function readCSV(filename) {
  const content = fs.readFileSync(path.join(__dirname, 'test-data', filename), 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }
  
  return { headers, data };
}

// 테스트 실행
async function runTests() {
  console.log('===== 통계 기능 테스트 시작 =====\n');
  
  // 1. ANOVA 테스트 데이터
  console.log('1. ANOVA 테스트');
  const anovaData = readCSV('anova-test.csv');
  console.log('- 데이터 로드 완료');
  console.log(`- 그룹 수: ${new Set(anovaData.data.map(r => r.group)).size}`);
  console.log(`- 전체 샘플 수: ${anovaData.data.length}`);
  
  // 그룹별 데이터 분리
  const groups = {};
  anovaData.data.forEach(row => {
    if (!groups[row.group]) groups[row.group] = [];
    groups[row.group].push(parseFloat(row.value));
  });
  
  // 그룹별 평균 계산
  Object.entries(groups).forEach(([name, values]) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1));
    console.log(`  ${name}: n=${values.length}, mean=${mean.toFixed(2)}, std=${std.toFixed(2)}`);
  });
  
  console.log('\n2. 회귀분석 테스트');
  const regData = readCSV('regression-test.csv');
  console.log('- 데이터 로드 완료');
  console.log(`- 독립변수: temperature, humidity, pressure`);
  console.log(`- 종속변수: yield`);
  console.log(`- 샘플 수: ${regData.data.length}`);
  
  // 상관계수 계산 (간단한 Pearson)
  const temps = regData.data.map(r => parseFloat(r.temperature));
  const yields = regData.data.map(r => parseFloat(r.yield));
  const tempMean = temps.reduce((a, b) => a + b, 0) / temps.length;
  const yieldMean = yields.reduce((a, b) => a + b, 0) / yields.length;
  
  let numerator = 0;
  let tempSqSum = 0;
  let yieldSqSum = 0;
  
  for (let i = 0; i < temps.length; i++) {
    numerator += (temps[i] - tempMean) * (yields[i] - yieldMean);
    tempSqSum += Math.pow(temps[i] - tempMean, 2);
    yieldSqSum += Math.pow(yields[i] - yieldMean, 2);
  }
  
  const correlation = numerator / Math.sqrt(tempSqSum * yieldSqSum);
  console.log(`  Temperature-Yield 상관계수: ${correlation.toFixed(3)}`);
  
  console.log('\n3. t-검정 테스트');
  const tData = readCSV('t-test.csv');
  console.log('- 데이터 로드 완료');
  console.log(`- Paired t-test: before vs after`);
  console.log(`- 샘플 수: ${tData.data.length}`);
  
  const before = tData.data.map(r => parseFloat(r.before));
  const after = tData.data.map(r => parseFloat(r.after));
  const differences = before.map((b, i) => b - after[i]);
  const diffMean = differences.reduce((a, b) => a + b, 0) / differences.length;
  const diffStd = Math.sqrt(differences.reduce((a, b) => a + Math.pow(b - diffMean, 2), 0) / (differences.length - 1));
  
  console.log(`  Before 평균: ${(before.reduce((a, b) => a + b, 0) / before.length).toFixed(2)}`);
  console.log(`  After 평균: ${(after.reduce((a, b) => a + b, 0) / after.length).toFixed(2)}`);
  console.log(`  차이 평균: ${diffMean.toFixed(2)}`);
  console.log(`  차이 표준편차: ${diffStd.toFixed(2)}`);
  
  // Independent t-test by gender
  const males = tData.data.filter(r => r.gender === 'Male').map(r => parseFloat(r.before));
  const females = tData.data.filter(r => r.gender === 'Female').map(r => parseFloat(r.before));
  
  console.log(`\n  Independent t-test (by gender):`);
  console.log(`  Male: n=${males.length}, mean=${(males.reduce((a, b) => a + b, 0) / males.length).toFixed(2)}`);
  console.log(`  Female: n=${females.length}, mean=${(females.reduce((a, b) => a + b, 0) / females.length).toFixed(2)}`);
  
  console.log('\n===== 테스트 데이터 검증 완료 =====');
  console.log('\n실제 통계 분석은 웹 인터페이스에서 Pyodide를 통해 실행됩니다.');
  console.log('브라우저에서 http://localhost:3000 접속하여 테스트하세요.');
}

// 테스트 실행
runTests().catch(console.error);