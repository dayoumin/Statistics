'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DescriptiveAnalysisPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/analysis">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            통계 분석으로 돌아가기
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">기술통계 분석</h1>
        <p className="text-muted-foreground">
          데이터의 기본적인 특성을 요약하고 시각화합니다
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle>기본 기술통계</CardTitle>
            <CardDescription>평균, 중앙값, 표준편차 등</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">분석 시작</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle>빈도 분석</CardTitle>
            <CardDescription>범주형 데이터의 빈도 및 비율</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">분석 시작</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle>교차표 분석</CardTitle>
            <CardDescription>두 변수 간의 관계 파악</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">분석 시작</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}