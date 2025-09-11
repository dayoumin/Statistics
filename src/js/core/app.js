// 전역 변수 및 초기화
let currentData = null;
let analysisResults = {
    validation: null,
    assumptions: null,
    method: null,
    statistics: null,
    postHoc: null
};
let currentStep = 1;
let autoProgress = false;

// Pyodide는 pyodideManager가 관리
let pyodide = null;
let pyodideReady = null;

// Pyodide 초기화
async function initPyodide() {
    debug.log('[INIT] Pyodide 초기화 시작...');
    
    try {
        // PyodideManager 사용 (싱글톤)
        if (!window.pyodideManager) {
            throw new Error('PyodideManager가 로드되지 않았습니다.');
        }
        
        // 진행 상황 콜백 설정
        window.pyodideManager.onProgress = (info) => {
            debug.log(`[Pyodide] ${info.message} - ${info.progress}%`);
            updatePyodideStatus(info.message, info.progress);
        };
        
        window.pyodideManager.onError = (error) => {
            debug.error('[Pyodide] 오류:', error);
            showPyodideError(error.message);
        };
        
        // Pyodide 초기화
        pyodide = await window.pyodideManager.initialize();
        pyodideReady = Promise.resolve(pyodide);
        
        debug.log('[INIT] Pyodide 초기화 완료');
        
        // 이전 코드와의 호환성을 위해 전역 변수 설정
        window.pyodide = pyodide;
        
        return pyodide;
        
    } catch (error) {
        debug.error("Pyodide 초기화 실패:", error);
        pyodideReady = Promise.reject(error);
        
        // UI에 오류 표시
        showPyodideError(error.message);
        
        throw error;
    }
}

// Pyodide 상태 UI 업데이트
function updatePyodideStatus(message, progress) {
    const statusEl = document.getElementById('pyodideStatus');
    if (statusEl) {
        statusEl.innerHTML = `
            <div class="flex items-center space-x-2">
                <div class="w-32 bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full" style="width: ${progress}%"></div>
                </div>
                <span class="text-sm text-gray-600">${message}</span>
            </div>
        `;
    }
}

// Pyodide 오류 표시
function showPyodideError(message) {
    const statusEl = document.getElementById('pyodideStatus');
    if (statusEl) {
        statusEl.innerHTML = `
            <div class="text-red-600 text-sm">
                ⚠️ Pyodide 초기화 실패: ${message}
            </div>
        `;
    }
}


// 메모리 정리
function cleanupPyodideMemory() {
    if (pyodide) {
        try {
            pyodide.runPython(`
                import gc
                gc.collect()
            `);
            debug.log('[MEMORY] 가비지 컬렉션 실행');
        } catch (error) {
            debug.error('메모리 정리 실패:', error);
        }
    }
}

// 주기적인 메모리 정리 (5분마다)
setInterval(cleanupPyodideMemory, 5 * 60 * 1000);

// 애플리케이션 초기화
async function initializeApp() {
    debug.log('[APP] 애플리케이션 초기화 시작');
    
    try {
        // 초기 단계 설정
        if (window.moveToStep) {
            window.moveToStep(1);
        }
        
        // 파일 입력 이벤트 설정
        const fileInput = document.getElementById('fileInput');
        if (fileInput && window.handleFileSelect) {
            fileInput.addEventListener('change', window.handleFileSelect);
        }
        
        // Pyodide 초기화 (백그라운드에서 비동기 실행)
        // await를 사용하지 않아 UI 블로킹 방지
        (async () => {
            try {
                await initPyodide();
                debug.log('[APP] Pyodide 초기화 완료');
            } catch (error) {
                debug.error('[APP] Pyodide 초기화 실패:', error);
            }
        })();
        
        debug.log('[APP] 애플리케이션 초기화 완료');
        return true;
    } catch (error) {
        debug.error('[APP] 초기화 중 오류:', error);
        return false;
    }
}

// DOM 로드 시 자동 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export
window.APP = {
    currentData,
    analysisResults,
    currentStep,
    autoProgress,
    pyodide,
    pyodideReady,
    initPyodide,
    cleanupPyodideMemory,
    initializeApp
};
window.initializeApp = initializeApp;