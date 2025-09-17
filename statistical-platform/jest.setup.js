// Jest 테스트 환경 설정

// TextEncoder/TextDecoder 폴리필 (Node.js 환경)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// fetch 폴리필 제거 - jsdom 환경에서는 기본 제공

// performance.now 폴리필
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  }
}

// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test'

// console 경고 무시 (선택적)
const originalWarn = console.warn
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('ReactDOM.render')
  ) {
    return
  }
  originalWarn.call(console, ...args)
}

// Pyodide 모킹 - 테스트용 레퍼런스 값 반환
global.loadPyodide = jest.fn().mockResolvedValue({
  runPython: jest.fn().mockImplementation((code) => {
    // 미리 계산된 통계 값 반환 (R/SPSS 검증값)
    if (code.includes('ttest_ind')) {
      return { statistic: -2.121, pvalue: 0.101, df: 4 }
    }
    if (code.includes('shapiro')) {
      return { statistic: 0.9532, pvalue: 0.7234 }
    }
    if (code.includes('pearsonr')) {
      return { statistic: 0.8912, pvalue: 0.0001 }
    }
    return {}
  }),
  runPythonAsync: jest.fn().mockImplementation(async (code) => {
    if (code.includes('ttest_ind')) {
      return { statistic: -2.121, pvalue: 0.101, df: 4 }
    }
    if (code.includes('f_oneway')) {
      return { statistic: 15.234, pvalue: 0.0001, df: [2, 27] }
    }
    return {}
  }),
  loadPackage: jest.fn().mockResolvedValue(undefined),
  globals: {
    set: jest.fn(),
    get: jest.fn(),
  },
})