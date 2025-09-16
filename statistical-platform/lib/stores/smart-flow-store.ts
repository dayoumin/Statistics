import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { 
  ValidationResults, 
  StatisticalMethod, 
  AnalysisResult 
} from '@/types/smart-flow'

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
        // File 객체는 직렬화할 수 없으므로 제외
        // uploadedFile과 uploadedData는 세션 스토리지에 저장하지 않음
      }),
    }
  )
)