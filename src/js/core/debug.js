/**
 * 디버그 유틸리티
 * 프로덕션 환경에서는 로그를 비활성화
 */

// 디버그 모드 설정 (URL 파라미터 또는 localStorage로 제어)
const DEBUG_MODE = (() => {
    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('debug')) {
        return urlParams.get('debug') === 'true';
    }
    
    // localStorage 확인
    if (localStorage.getItem('DEBUG_MODE')) {
        return localStorage.getItem('DEBUG_MODE') === 'true';
    }
    
    // 개발 환경 확인 (localhost 또는 127.0.0.1)
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname.startsWith('192.168.');
    
    return isDev;
})();

// 디버그 로거 클래스
class DebugLogger {
    constructor(prefix = '') {
        this.prefix = prefix;
        this.enabled = DEBUG_MODE;
    }
    
    log(...args) {
        if (this.enabled) {
            console.log(this.prefix ? `[${this.prefix}]` : '', ...args);
        }
    }
    
    error(...args) {
        // 에러는 항상 출력
        console.error(this.prefix ? `[${this.prefix}]` : '', ...args);
    }
    
    warn(...args) {
        if (this.enabled) {
            console.warn(this.prefix ? `[${this.prefix}]` : '', ...args);
        }
    }
    
    info(...args) {
        if (this.enabled) {
            console.info(this.prefix ? `[${this.prefix}]` : '', ...args);
        }
    }
    
    time(label) {
        if (this.enabled) {
            console.time(label);
        }
    }
    
    timeEnd(label) {
        if (this.enabled) {
            console.timeEnd(label);
        }
    }
    
    group(label) {
        if (this.enabled) {
            console.group(label);
        }
    }
    
    groupEnd() {
        if (this.enabled) {
            console.groupEnd();
        }
    }
}

// 전역 디버그 함수
const debug = {
    log: (...args) => {
        if (DEBUG_MODE) console.log(...args);
    },
    error: (...args) => {
        console.error(...args); // 에러는 항상 출력
    },
    warn: (...args) => {
        if (DEBUG_MODE) console.warn(...args);
    },
    info: (...args) => {
        if (DEBUG_MODE) console.info(...args);
    },
    time: (label) => {
        if (DEBUG_MODE) console.time(label);
    },
    timeEnd: (label) => {
        if (DEBUG_MODE) console.timeEnd(label);
    }
};

// 디버그 모드 토글 함수
function toggleDebugMode() {
    const newMode = !DEBUG_MODE;
    localStorage.setItem('DEBUG_MODE', newMode.toString());
    console.log(`Debug mode ${newMode ? 'enabled' : 'disabled'}. Reload page to apply.`);
    return newMode;
}

// 디버그 정보 표시
function showDebugInfo() {
    const info = {
        debugMode: DEBUG_MODE,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        memory: performance.memory ? {
            used: `${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
            total: `${(performance.memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
            limit: `${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
        } : 'Not available',
        timestamp: new Date().toISOString()
    };
    
    console.table(info);
    return info;
}

// Export
window.DebugLogger = DebugLogger;
window.debug = debug;
window.DEBUG_MODE = DEBUG_MODE;
window.toggleDebugMode = toggleDebugMode;
window.showDebugInfo = showDebugInfo;