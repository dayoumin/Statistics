/**
 * 애플리케이션 전반에서 사용되는 상수들
 */

// 통계 분석 관련 상수
export const STATISTICS = {
  SIGNIFICANCE_LEVELS: {
    HIGH: 0.01,
    MEDIUM: 0.05,
    LOW: 0.10
  },
  CONFIDENCE_LEVELS: {
    HIGH: 0.99,
    MEDIUM: 0.95, 
    LOW: 0.90
  },
  TEST_VALUES: {
    DEFAULT_ONE_SAMPLE: 0,
    MIN_SAMPLE_SIZE: 3,
    MAX_COLUMNS_FOR_CORRELATION: 2
  }
} as const

// Pyodide 로딩 관련 상수
export const PYODIDE = {
  CDN_URL: 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/',
  SCRIPT_URL: 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.js',
  PACKAGES: ['numpy', 'scipy', 'pandas'],
  LOADING_PROGRESS: {
    IDLE: 0,
    BASIC: 40,
    SCIPY: 80,
    READY: 100
  },
  TIMEOUT: {
    LOAD_SCRIPT: 30000,
    LOAD_PACKAGES: 60000
  }
} as const

// UI 관련 상수
export const UI = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 200,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: ['text/csv', 'application/vnd.ms-excel']
} as const

// 데이터 검증 상수
export const VALIDATION = {
  MIN_DATASET_ROWS: 1,
  MAX_DATASET_ROWS: 100000,
  MIN_NUMERIC_VALUE: Number.MIN_SAFE_INTEGER,
  MAX_NUMERIC_VALUE: Number.MAX_SAFE_INTEGER,
  MAX_COLUMN_NAME_LENGTH: 100,
  MAX_DATASET_NAME_LENGTH: 255
} as const

// 차트 및 시각화 상수
export const CHART = {
  COLORS: {
    PRIMARY: 'hsl(var(--primary))',
    SECONDARY: 'hsl(var(--secondary))',
    ACCENT: 'hsl(var(--accent))',
    SUCCESS: 'hsl(142.1 76.2% 36.3%)',
    WARNING: 'hsl(38 92% 50%)',
    DESTRUCTIVE: 'hsl(var(--destructive))'
  },
  DIMENSIONS: {
    DEFAULT_WIDTH: 400,
    DEFAULT_HEIGHT: 300,
    MIN_WIDTH: 200,
    MIN_HEIGHT: 150
  }
} as const

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  THEME: 'statistical-platform-theme',
  USER_PREFERENCES: 'statistical-platform-preferences',
  DATASETS: 'statistical-platform-datasets',
  ANALYSIS_HISTORY: 'statistical-platform-analysis-history'
} as const

// 에러 메시지
export const ERROR_MESSAGES = {
  PYODIDE_NOT_READY: '통계 엔진이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.',
  INSUFFICIENT_DATA: '선택한 분석 방법에 필요한 데이터가 부족합니다.',
  INVALID_DATASET: '데이터셋과 분석할 컬럼을 선택해주세요.',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.',
  INVALID_FILE_TYPE: '지원되지 않는 파일 형식입니다. CSV 파일을 선택해주세요.',
  PARSING_ERROR: '파일을 읽는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.'
} as const

// 성공 메시지
export const SUCCESS_MESSAGES = {
  ANALYSIS_COMPLETED: '분석이 성공적으로 완료되었습니다.',
  DATA_LOADED: '데이터가 성공적으로 로드되었습니다.',
  PYODIDE_READY: '통계 엔진이 준비되었습니다.',
  SETTINGS_SAVED: '설정이 저장되었습니다.'
} as const