"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Calculator, Database, FileText, TrendingUp, Zap, Users, Target, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const statisticalMethods = [
    { icon: Calculator, title: "t-검정", color: "text-blue-600", link: "/analysis?test=One-sample t-test" },
    { icon: Users, title: "독립표본 t검정", color: "text-blue-600", link: "/analysis?test=Two-sample t-test" },
    { icon: BarChart3, title: "일원분산분석", color: "text-green-600", link: "/analysis?test=One-way ANOVA" },
    { icon: Target, title: "Tukey HSD", color: "text-green-600", link: "/analysis?test=Tukey HSD" },
    { icon: TrendingUp, title: "단순선형회귀", color: "text-purple-600", link: "/analysis?test=Simple Linear Regression" },
    { icon: Database, title: "다중회귀분석", color: "text-purple-600", link: "/analysis?test=Multiple Regression" },
    { icon: FileText, title: "피어슨 상관분석", color: "text-purple-600", link: "/analysis?category=correlation" },
    { icon: Zap, title: "Mann-Whitney U", color: "text-orange-600", link: "/analysis?test=Mann-Whitney U Test" },
    { icon: AlertCircle, title: "Kruskal-Wallis", color: "text-orange-600", link: "/analysis?test=Kruskal-Wallis Test" }
  ];

  const itemsPerSlide = 4;
  const totalSlides = Math.ceil(statisticalMethods.length / itemsPerSlide);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="space-y-8">
      {/* Main CTA - 스마트 분석 중심 */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-12 border text-center">
        <h1 className="text-5xl font-bold mb-4">
          통계 분석 플랫폼
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          전문가급 통계 분석을 쉽고 빠르게
        </p>
        
        <Link href="/smart-analysis">
          <Button 
            size="lg" 
            className="text-xl px-16 py-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/25 hover:bg-primary/90 active:scale-95"
          >
            분석 시작하기
          </Button>
        </Link>
      </div>

      {/* Statistical Methods Carousel */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-center">바로 실행할 통계 방법</h2>
        
        <div className="relative">
          {/* Navigation Arrows */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-md"
            onClick={prevSlide}
            disabled={totalSlides <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-md"
            onClick={nextSlide}
            disabled={totalSlides <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Carousel Content */}
          <div className="overflow-hidden px-12">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: totalSlides }, (_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {statisticalMethods
                      .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                      .map((method, methodIndex) => {
                        const IconComponent = method.icon;
                        return (
                          <Card key={methodIndex} className="text-center hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="pb-3">
                              <IconComponent className={`h-8 w-8 mx-auto ${method.color}`} />
                              <CardTitle className="text-lg">{method.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Link href={method.link}>
                                <Button variant="outline" size="sm" className="w-full">
                                  바로 실행
                                </Button>
                              </Link>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dot Indicators */}
        {totalSlides > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: totalSlides }, (_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentSlide === index 
                    ? 'bg-primary' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
