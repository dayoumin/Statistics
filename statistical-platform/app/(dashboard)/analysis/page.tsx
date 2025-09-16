import { AnalysisInterface } from "@/components/analysis/analysis-interface"

export default function AnalysisPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">통계 분석 도구</h1>
        <p className="text-muted-foreground text-lg">
          29개의 전문 통계 분석 도구를 선택하세요
        </p>
      </div>
      
      <AnalysisInterface />
    </div>
  )
}