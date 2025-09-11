'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="glass-effect rounded-2xl p-12 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          통계 분석 플랫폼
        </h1>
        <p className="text-gray-600 text-center mb-8">
          국립수산과학원 연구자를 위한 전문 통계 분석 도구
        </p>
        
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🎯 주요 기능</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• t-test, ANOVA, 회귀분석, 상관분석</li>
              <li>• CPUE 분석, von Bertalanffy 성장모델</li>
              <li>• 자동 통계 방법 추천</li>
              <li>• Excel/PDF 보고서 생성</li>
            </ul>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">✨ 새로운 기능</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">자동 분석 모드</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setMode('manual')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    mode === 'manual' 
                      ? 'bg-gray-200 text-gray-900' 
                      : 'text-gray-500'
                  }`}
                >
                  수동
                </button>
                <button
                  onClick={() => setMode('auto')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    mode === 'auto' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-500'
                  }`}
                >
                  자동
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {mode === 'auto' 
                ? '앱이 데이터를 분석하여 최적의 방법을 자동으로 선택합니다'
                : '각 단계를 직접 선택하고 제어할 수 있습니다'}
            </p>
          </div>
          
          <Link
            href={`/statistics?mode=${mode}`}
            className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors"
          >
            분석 시작하기
          </Link>
        </div>
      </div>
    </div>
  )
}