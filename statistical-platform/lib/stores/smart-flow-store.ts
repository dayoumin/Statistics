import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { 
  ValidationResults, 
  StatisticalMethod, 
  AnalysisResult 
} from '@/types/smart-flow'

// 분석 히스토리 타입
export interface AnalysisHistory {
  id: string
  timestamp: Date
  name: string
  purpose: string
  method: StatisticalMethod | null
  dataFileName: string
  dataRowCount: number
  results: AnalysisResult | null
  assumptions?: any
  stepData: {
    uploadedData: any[] | null
    validationResults: ValidationResults | null
    analysisPurpose: string
    selectedMethod: StatisticalMethod | null
    analysisResults: AnalysisResult | null
  }
}

interface SmartFlowState {
  // 현재 단계
  currentStep: number
  completedSteps: number[]
  
  // 데이터
  uploadedFile: File | null
  uploadedData: any[] | null
  
  // 검증
  validationResults: ValidationResults | null
  
  // 분석 설정
  analysisPurpose: string
  selectedMethod: StatisticalMethod | null
  
  // 분석 결과
  analysisResults: AnalysisResult | null
  
  // 히스토리
  analysisHistory: AnalysisHistory[]
  currentHistoryId: string | null
  
  // 상태
  isLoading: boolean
  error: string | null
  
  // 액션
  setCurrentStep: (step: number) => void
  addCompletedStep: (step: number) => void
  setUploadedFile: (file: File | null) => void
  setUploadedData: (data: any[] | null) => void
  setValidationResults: (results: ValidationResults | null) => void
  setAnalysisPurpose: (purpose: string) => void
  setSelectedMethod: (method: StatisticalMethod | null) => void
  setAnalysisResults: (results: AnalysisResult | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 히스토리 액션
  saveToHistory: (name?: string) => void
  loadFromHistory: (historyId: string) => void
  deleteFromHistory: (historyId: string) => void
  clearHistory: () => void
  
  // 네비게이션
  canNavigateToStep: (step: number) => boolean
  navigateToStep: (step: number) => void
  saveCurrentStepData: () => void
  
  // 유틸리티
  canProceedToNext: () => boolean
  goToNextStep: () => void
  goToPreviousStep: () => void
  reset: () => void
}

const initialState = {
  currentStep: 1,
  completedSteps: [],
  uploadedFile: null,
  uploadedData: null,
  validationResults: null,
  analysisPurpose: '',
  selectedMethod: null,
  analysisResults: null,
  analysisHistory: [],
  currentHistoryId: null,
  isLoading: false,
  error: null,
}

export const useSmartFlowStore = create<SmartFlowState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // 기본 setter들
      setCurrentStep: (step) => set({ currentStep: step }),
      
      addCompletedStep: (step) => set((state) => ({
        completedSteps: [...new Set([...state.completedSteps, step])]
      })),
      
      setUploadedFile: (file) => set({ uploadedFile: file }),
      setUploadedData: (data) => set({ uploadedData: data }),
      setValidationResults: (results) => set({ validationResults: results }),
      setAnalysisPurpose: (purpose) => set({ analysisPurpose: purpose }),
      setSelectedMethod: (method) => set({ selectedMethod: method }),
      setAnalysisResults: (results) => set({ analysisResults: results }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error: error }),
      
      // 히스토리 관리
      saveToHistory: (name) => {
        const state = get()
        if (!state.analysisResults) return
        
        const historyEntry: AnalysisHistory = {
          id: `analysis-${Date.now()}`,
          timestamp: new Date(),
          name: name || `분석 ${new Date().toLocaleString('ko-KR')}`,
          purpose: state.analysisPurpose,
          method: state.selectedMethod,
          dataFileName: state.uploadedFile?.name || 'unknown',
          dataRowCount: state.uploadedData?.length || 0,
          results: state.analysisResults,
          assumptions: (state.analysisResults as any)?.assumptions,
          stepData: {
            uploadedData: state.uploadedData,
            validationResults: state.validationResults,
            analysisPurpose: state.analysisPurpose,
            selectedMethod: state.selectedMethod,
            analysisResults: state.analysisResults,
          }
        }
        
        set((state) => ({
          analysisHistory: [historyEntry, ...state.analysisHistory].slice(0, 20), // 최대 20개 저장
          currentHistoryId: historyEntry.id
        }))
      },
      
      loadFromHistory: (historyId) => {
        const state = get()
        const history = state.analysisHistory.find(h => h.id === historyId)
        
        if (history) {
          set({
            uploadedData: history.stepData.uploadedData,
            validationResults: history.stepData.validationResults,
            analysisPurpose: history.stepData.analysisPurpose,
            selectedMethod: history.stepData.selectedMethod,
            analysisResults: history.stepData.analysisResults,
            currentHistoryId: historyId,
            currentStep: 5, // 결과 단계로 이동
            completedSteps: [1, 2, 3, 4, 5]
          })
        }
      },
      
      deleteFromHistory: (historyId) => {
        set((state) => ({
          analysisHistory: state.analysisHistory.filter(h => h.id !== historyId),
          currentHistoryId: state.currentHistoryId === historyId ? null : state.currentHistoryId
        }))
      },
      
      clearHistory: () => {
        set({
          analysisHistory: [],
          currentHistoryId: null
        })
      },
      
      // 네비게이션 with 데이터 저장
      canNavigateToStep: (step) => {
        const state = get()
        // 완료된 단계나 현재 단계로만 이동 가능
        return step === state.currentStep || state.completedSteps.includes(step)
      },
      
      navigateToStep: (step) => {
        const state = get()
        if (state.canNavigateToStep(step)) {
          // 현재 단계 데이터 저장
          state.saveCurrentStepData()
          set({ currentStep: step })
        }
      },
      
      saveCurrentStepData: () => {
        const state = get()
        // 각 단계별 데이터는 이미 개별 setter로 저장되므로
        // 여기서는 완료 단계 추가만
        if (!state.completedSteps.includes(state.currentStep)) {
          set((s) => ({
            completedSteps: [...s.completedSteps, state.currentStep]
          }))
        }
      },
      
      // 유틸리티 함수들
      canProceedToNext: () => {
        const state = get()
        switch (state.currentStep) {
          case 1: return state.uploadedFile !== null && state.uploadedData !== null
          case 2: return state.validationResults?.isValid === true
          case 3: return state.selectedMethod !== null
          case 4: return false // 자동 진행
          case 5: return false // 마지막 단계
          default: return false
        }
      },
      
      goToNextStep: () => {
        const state = get()
        if (state.currentStep < 5) {
          set({
            completedSteps: [...new Set([...state.completedSteps, state.currentStep])],
            currentStep: state.currentStep + 1
          })
        }
      },
      
      goToPreviousStep: () => {
        const state = get()
        if (state.currentStep > 1) {
          set({ currentStep: state.currentStep - 1 })
        }
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'smart-flow-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        analysisPurpose: state.analysisPurpose,
        analysisHistory: state.analysisHistory,
        currentHistoryId: state.currentHistoryId,
        // 현재 분석 데이터도 저장 (페이지 새로고침 시 복원)
        uploadedData: state.uploadedData,
        validationResults: state.validationResults,
        selectedMethod: state.selectedMethod,
        analysisResults: state.analysisResults,
        // File 객체는 직렬화할 수 없으므로 제외
      }),
    }
  )
)