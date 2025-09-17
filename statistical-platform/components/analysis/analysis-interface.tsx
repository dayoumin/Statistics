"use client"

import { useState } from "react"
import { Search, BarChart3, Calculator, TrendingUp, Database, Zap, Brain } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

// 통계 분석 카테고리 정의
const categories = [
  {
    id: "descriptive",
    name: "기술통계",
    icon: Calculator,
    color: "blue",
    tests: [
      { name: "기술통계량", description: "평균, 중앙값, 표준편차" },
      { name: "정규성 검정", description: "Shapiro-Wilk, Anderson-Darling" },
      { name: "등분산 검정", description: "Levene, Bartlett" }
    ]
  },
  {
    id: "ttest", 
    name: "t-검정",
    icon: TrendingUp,
    color: "green",
    tests: [
      { name: "일표본 t-검정", description: "표본과 모집단 비교" },
      { name: "독립표본 t-검정", description: "두 독립 그룹 비교" },
      { name: "대응표본 t-검정", description: "짝지은 데이터 비교" },
      { name: "Welch t-검정", description: "등분산 가정 없는 검정" }
    ]
  },
  {
    id: "anova",
    name: "분산분석",
    icon: BarChart3,
    color: "purple",
    tests: [
      { name: "일원분산분석", description: "3개 이상 그룹 비교" },
      { name: "이원분산분석", description: "두 요인 효과 분석" },
      { name: "Tukey HSD", description: "사후 다중비교" },
      { name: "Bonferroni", description: "보정된 다중비교" },
      { name: "Games-Howell", description: "등분산 가정 없는 사후검정" }
    ]
  },
  {
    id: "regression",
    name: "회귀분석",
    icon: Database,
    color: "orange",
    tests: [
      { name: "단순선형회귀", description: "한 예측변수" },
      { name: "다중회귀분석", description: "여러 예측변수" },
      { name: "로지스틱 회귀", description: "이진 분류" },
      { name: "상관분석", description: "Pearson, Spearman" }
    ]
  },
  {
    id: "nonparametric",
    name: "비모수검정",
    icon: Zap,
    color: "pink",
    tests: [
      { name: "Mann-Whitney U", description: "독립 두 집단 비교" },
      { name: "Wilcoxon", description: "대응 표본 비교" },
      { name: "Kruskal-Wallis", description: "3개 이상 집단 비교" },
      { name: "Dunn Test", description: "비모수 사후검정" },
      { name: "카이제곱 검정", description: "범주형 자료 분석" }
    ]
  },
  {
    id: "advanced",
    name: "고급분석",
    icon: Brain,
    color: "indigo",
    tests: [
      { name: "주성분분석(PCA)", description: "차원 축소" },
      { name: "K-means 클러스터링", description: "군집 분석" },
      { name: "계층적 클러스터링", description: "덴드로그램 분석" },
      { name: "시계열 분해", description: "추세, 계절성 분석" },
      { name: "ARIMA", description: "시계열 예측" },
      { name: "생존분석", description: "Kaplan-Meier" }
    ]
  }
]

export function AnalysisInterface() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const _filteredCategories = selectedCategory === "all"
    ? categories
    : categories.filter(cat => cat.id === selectedCategory)

  const filteredTests = searchQuery
    ? categories.flatMap(cat => 
        cat.tests
          .filter(test => 
            test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            test.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(test => ({ ...test, category: cat.name, categoryColor: cat.color }))
      )
    : []

  return (
    <div className="space-y-6">
      {/* 검색 바 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="통계 분석 방법 검색 (예: t-검정, 회귀분석, ANOVA)"
          className="pl-10 pr-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 검색 결과 */}
      {searchQuery && filteredTests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            검색 결과 ({filteredTests.length}개)
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {filteredTests.map((test, i) => (
              <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{test.name}</CardTitle>
                      <CardDescription className="text-sm">{test.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className={`text-${test.categoryColor}-600`}>
                      {test.category}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 카테고리 탭 */}
      {!searchQuery && (
        <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-7">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.name}
              </TabsTrigger>
            ))}
            <TabsTrigger value="all">전체</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {categories.map(category => {
              const Icon = category.icon
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${category.color}-50 dark:bg-${category.color}-950/30`}>
                          <Icon className={`h-5 w-5 text-${category.color}-600 dark:text-${category.color}-400`} />
                        </div>
                        <div>
                          <CardTitle>{category.name}</CardTitle>
                          <CardDescription>{category.tests.length}개 분석 도구</CardDescription>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/analysis/${category.id}`}>
                          카테고리 보기
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {category.tests.map((test, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          className="justify-start h-auto p-4"
                          asChild
                        >
                          <Link href={`/analysis/${category.id}/${encodeURIComponent(test.name)}`}>
                            <div className="text-left">
                              <div className="font-medium">{test.name}</div>
                              <div className="text-sm text-muted-foreground">{test.description}</div>
                            </div>
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          {categories.map(category => (
            <TabsContent key={category.id} value={category.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      <CardDescription>{category.tests.length}개 분석 도구</CardDescription>
                    </div>
                    <Button asChild>
                      <Link href={`/analysis/${category.id}`}>
                        전체 보기
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {category.tests.map((test, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="justify-start h-auto p-4"
                        asChild
                      >
                        <Link href={`/analysis/${category.id}/${encodeURIComponent(test.name)}`}>
                          <div className="text-left">
                            <div className="font-medium">{test.name}</div>
                            <div className="text-sm text-muted-foreground">{test.description}</div>
                          </div>
                        </Link>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}