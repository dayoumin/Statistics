'use client'

import { cn } from '@/lib/utils'
import { StepConfig } from '@/types/smart-flow'

interface ProgressStepperProps {
  steps: StepConfig[]
  currentStep: number
  completedSteps: number[]
  onStepClick: (stepId: number) => void
}

export function ProgressStepper({ 
  steps, 
  currentStep, 
  completedSteps, 
  onStepClick 
}: ProgressStepperProps) {
  return (
    <div className="relative">
      <div className="absolute top-5 left-0 w-full h-0.5 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
      
      <div className="relative flex justify-between">
        {steps.map((step) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isCompleted = completedSteps.includes(step.id)
          const isClickable = step.id <= Math.max(...completedSteps, 1)
          
          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              disabled={!isClickable}
              aria-label={`${step.name} 단계로 이동`}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                "flex flex-col items-center space-y-2 p-2 rounded-lg transition-all",
                isClickable && "cursor-pointer hover:bg-muted/50",
                !isClickable && "cursor-not-allowed opacity-50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                isActive && "bg-primary text-primary-foreground scale-110",
                isCompleted && !isActive && "bg-primary/20 text-primary",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-sm font-medium",
                  isActive && "text-primary",
                  !isActive && "text-muted-foreground"
                )}>
                  {step.name}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block max-w-[150px]">
                  {step.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}