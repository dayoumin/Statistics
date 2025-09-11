import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Types
export interface Dataset {
  id: string
  name: string
  description: string
  format: string
  size: string
  rows: number
  columns: number
  status: 'active' | 'processed' | 'error'
  uploadedAt: Date
  data?: Record<string, unknown>[]
}

export interface AnalysisResult {
  id: string
  datasetId: string
  testType: string
  testName: string
  parameters: Record<string, unknown>
  results: Record<string, unknown>
  pValue?: number
  effectSize?: number
  confidence?: number
  createdAt: Date
  status: 'running' | 'completed' | 'failed'
}

export interface Project {
  id: string
  name: string
  description: string
  datasetIds: string[]
  analysisIds: string[]
  createdAt: Date
  updatedAt: Date
  status: 'active' | 'completed' | 'archived'
}

export interface UserPreferences {
  defaultSignificanceLevel: number
  defaultConfidenceLevel: number
  multipleComparisonsCorrection: 'bonferroni' | 'holm' | 'fdr' | 'none'
  effectSizeReporting: boolean
  chartStyle: 'professional' | 'minimal' | 'colorful'
  notifications: {
    analysisCompletion: boolean
    dataUploadErrors: boolean
    weeklySummary: boolean
  }
}

interface AppState {
  // Data
  datasets: Dataset[]
  projects: Project[]
  analysisResults: AnalysisResult[]
  
  // UI State
  isLoading: boolean
  currentPage: string
  sidebarOpen: boolean
  
  // User Preferences
  preferences: UserPreferences
  
  // Actions
  addDataset: (dataset: Omit<Dataset, 'id' | 'uploadedAt'>) => void
  updateDataset: (id: string, updates: Partial<Dataset>) => void
  removeDataset: (id: string) => void
  
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  
  addAnalysisResult: (result: Omit<AnalysisResult, 'id' | 'createdAt'>) => void
  updateAnalysisResult: (id: string, updates: Partial<AnalysisResult>) => void
  
  setLoading: (loading: boolean) => void
  setCurrentPage: (page: string) => void
  setSidebarOpen: (open: boolean) => void
  
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  
  // Computed
  getDatasetById: (id: string) => Dataset | undefined
  getProjectById: (id: string) => Project | undefined
  getAnalysisResultById: (id: string) => AnalysisResult | undefined
  getActiveDatasets: () => Dataset[]
  getRecentAnalyses: (limit?: number) => AnalysisResult[]
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        datasets: [],
        projects: [],
        analysisResults: [],
        isLoading: false,
        currentPage: '/',
        sidebarOpen: true,
        preferences: {
          defaultSignificanceLevel: 0.05,
          defaultConfidenceLevel: 95,
          multipleComparisonsCorrection: 'bonferroni',
          effectSizeReporting: true,
          chartStyle: 'professional',
          notifications: {
            analysisCompletion: true,
            dataUploadErrors: true,
            weeklySummary: false,
          },
        },

        // Dataset actions
        addDataset: (dataset) =>
          set((state) => ({
            datasets: [
              ...state.datasets,
              {
                ...dataset,
                id: crypto.randomUUID(),
                uploadedAt: new Date(),
              },
            ],
          })),

        updateDataset: (id, updates) =>
          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === id ? { ...dataset, ...updates } : dataset
            ),
          })),

        removeDataset: (id) =>
          set((state) => ({
            datasets: state.datasets.filter((dataset) => dataset.id !== id),
          })),

        // Project actions
        addProject: (project) =>
          set((state) => ({
            projects: [
              ...state.projects,
              {
                ...project,
                id: crypto.randomUUID(),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          })),

        updateProject: (id, updates) =>
          set((state) => ({
            projects: state.projects.map((project) =>
              project.id === id
                ? { ...project, ...updates, updatedAt: new Date() }
                : project
            ),
          })),

        // Analysis actions
        addAnalysisResult: (result) =>
          set((state) => ({
            analysisResults: [
              ...state.analysisResults,
              {
                ...result,
                id: crypto.randomUUID(),
                createdAt: new Date(),
              },
            ],
          })),

        updateAnalysisResult: (id, updates) =>
          set((state) => ({
            analysisResults: state.analysisResults.map((result) =>
              result.id === id ? { ...result, ...updates } : result
            ),
          })),

        // UI actions
        setLoading: (loading) => set({ isLoading: loading }),
        setCurrentPage: (page) => set({ currentPage: page }),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        // Preferences
        updatePreferences: (preferences) =>
          set((state) => ({
            preferences: { ...state.preferences, ...preferences },
          })),

        // Computed getters
        getDatasetById: (id) => {
          const state = get()
          return state.datasets.find((dataset) => dataset.id === id)
        },

        getProjectById: (id) => {
          const state = get()
          return state.projects.find((project) => project.id === id)
        },

        getAnalysisResultById: (id) => {
          const state = get()
          return state.analysisResults.find((result) => result.id === id)
        },

        getActiveDatasets: () => {
          const state = get()
          return state.datasets.filter((dataset) => dataset.status === 'active')
        },

        getRecentAnalyses: (limit = 10) => {
          const state = get()
          return state.analysisResults
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit)
        },
      }),
      {
        name: 'statistical-platform-storage',
        partialize: (state) => ({
          datasets: state.datasets,
          projects: state.projects,
          analysisResults: state.analysisResults,
          preferences: state.preferences,
        }),
      }
    ),
    {
      name: 'statistical-platform-store',
    }
  )
)