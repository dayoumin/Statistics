"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SimpleUploadDialog } from "@/components/home/simple-upload-dialog"
import { 
  BarChart3, 
  Brain, 
  CheckCircle2,
  TrendingUp,
  Activity,
  Sparkles,
  ArrowRight,
  FileText,
  Database,
  Shield,
  Zap,
  Users,
  Award
} from "lucide-react"

export default function HomePage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge className="inline-flex items-center gap-1" variant="outline">
              <Sparkles className="h-3 w-3" />
              AI 기반 통계 분석 플랫폼
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              스마트한 모두의
              <span className="text-primary block mt-2">통계처리</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              복잡한 통계 분석을 쉽고 빠르게. 데이터를 업로드하면 AI가 최적의 통계 방법을 추천해드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 group"
                asChild
              >
                <a href="/smart-flow">
                  <Brain className="mr-2 h-5 w-5" />
                  스마트 분석 시작하기
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6"
                asChild
              >
                <a href="/analysis">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  직접 분석 방법 선택
                </a>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">29+</div>
              <div className="text-sm text-muted-foreground">통계 분석 방법</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">정확도</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">10초</div>
              <div className="text-sm text-muted-foreground">평균 분석 시간</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">무료</div>
              <div className="text-sm text-muted-foreground">완전 무료 사용</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">왜 우리 플랫폼을 선택해야 할까요?</h2>
            <p className="text-muted-foreground text-lg">SPSS, R Studio 수준의 전문 통계 분석을 웹에서 간편하게</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI 기반 스마트 분석</CardTitle>
                <CardDescription className="text-base">
                  데이터 특성을 자동으로 파악하고 최적의 통계 방법을 추천합니다. 초보자도 전문가 수준의 분석이 가능합니다.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>검증된 통계 엔진</CardTitle>
                <CardDescription className="text-base">
                  Python SciPy 기반의 신뢰할 수 있는 통계 계산. 논문과 연구에 사용 가능한 정확한 결과를 제공합니다.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>빠르고 간편한 분석</CardTitle>
                <CardDescription className="text-base">
                  복잡한 설치 없이 웹 브라우저에서 즉시 사용. CSV 파일만 업로드하면 10초 내에 결과를 확인할 수 있습니다.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistical Methods */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">29가지 전문 통계 분석 방법</h2>
            <p className="text-muted-foreground text-lg">연구와 논문에 필요한 모든 통계 분석을 지원합니다</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  기초 통계 분석
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">기술통계 & 정규성 검정</span>
                  <Badge variant="outline">3 methods</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">T-검정 (일표본, 독립, 대응)</span>
                  <Badge variant="outline">4 methods</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">상관분석 & 회귀분석</span>
                  <Badge variant="outline">4 methods</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  고급 통계 분석
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">분산분석 (ANOVA) & 사후검정</span>
                  <Badge variant="outline">5 methods</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">비모수 검정</span>
                  <Badge variant="outline">5 methods</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">다변량 분석 & 머신러닝</span>
                  <Badge variant="outline">8 methods</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">간단한 3단계 분석 프로세스</h2>
            <p className="text-muted-foreground text-lg">복잡한 통계도 쉽게</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">데이터 업로드</h3>
              <p className="text-muted-foreground">
                CSV, Excel 파일을 드래그 앤 드롭으로 간편하게 업로드
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">분석 목적 설명</h3>
              <p className="text-muted-foreground">
                무엇을 알고 싶은지 간단히 설명하면 AI가 최적 방법 추천
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">결과 확인</h3>
              <p className="text-muted-foreground">
                전문적인 통계 결과와 시각화를 즉시 확인하고 다운로드
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Data Quality Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">데이터 품질 자동 검증</h2>
              <p className="text-muted-foreground text-lg mb-8">
                분석 전 데이터의 품질을 자동으로 검사하여 신뢰할 수 있는 결과를 보장합니다.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">결측값 탐지 및 처리</h4>
                    <p className="text-sm text-muted-foreground">누락된 데이터를 자동으로 찾아 적절한 처리 방법 제안</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">이상치 식별 (IQR 방법)</h4>
                    <p className="text-sm text-muted-foreground">통계적 방법으로 비정상적인 값을 탐지하고 표시</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">데이터 타입 검증</h4>
                    <p className="text-sm text-muted-foreground">각 열의 데이터 유형을 자동으로 판별하고 변환</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">정규성 및 등분산성 검정</h4>
                    <p className="text-sm text-muted-foreground">통계 분석의 기본 가정을 자동으로 검증</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <Database className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">100만+</div>
                  <div className="text-sm text-muted-foreground">처리 가능 행</div>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">CSV/Excel</div>
                  <div className="text-sm text-muted-foreground">지원 형식</div>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">연구자용</div>
                  <div className="text-sm text-muted-foreground">전문가 수준</div>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <Award className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">논문 인용</div>
                  <div className="text-sm text-muted-foreground">가능한 품질</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <h2 className="text-3xl font-bold">지금 바로 시작하세요</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  복잡한 설치 없이, 회원가입 없이, 완전 무료로 전문가 수준의 통계 분석을 경험해보세요.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6"
                    asChild
                  >
                    <a href="/smart-flow">
                      <Sparkles className="mr-2 h-5 w-5" />
                      무료로 시작하기
                    </a>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-6"
                    asChild
                  >
                    <a href="/help">
                      사용 가이드 보기
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Upload Dialog */}
      <SimpleUploadDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen} 
      />
    </div>
  )
}