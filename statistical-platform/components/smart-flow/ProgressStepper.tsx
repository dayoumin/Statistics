'use client'

import { cn } from '@/lib/utils'
import { StepConfig } from '@/types/smart-flow'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

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
    <div className="relative py-4">
      {/* Progress Bar */}
      <div className="absolute top-9 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 transition-all duration-500 ease-out"
          style={{
            width: `${Math.max(0, (Math.max(...completedSteps, currentStep) - 1) / (steps.length - 1) * 100)}%`
          }}
        />
      </div>

      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isCompleted = completedSteps.includes(step.id)
          const isClickable = step.id <= Math.max(...completedSteps, currentStep)
          const isPast = step.id < currentStep || isCompleted

          return (
            <button
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              aria-label={`${step.name} 단계로 이동`}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                "flex flex-col items-center group transition-all duration-300",
                isClickable && "cursor-pointer",
                !isClickable && "cursor-not-allowed",
                isActive && "scale-105"
              )}
            >
              {/* Step Circle with Animation */}
              <div className="relative">
                {/* Ripple Effect for Current Step */}
                {isActive && !isCompleted && (
                  <div className="absolute inset-0 -m-2">
                    <div className="w-14 h-14 rounded-full bg-gray-500/20 dark:bg-gray-400/20 animate-ping" />
                  </div>
                )}

                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  "border-2 relative z-10 shadow-sm",
                  isCompleted && "bg-gradient-to-br from-gray-700 to-gray-800 dark:from-gray-200 dark:to-gray-300 border-gray-700 dark:border-gray-300 text-white dark:text-black shadow-lg shadow-black/20 dark:shadow-white/20",
                  isActive && !isCompleted && "bg-gradient-to-br from-gray-600 to-gray-900 dark:from-gray-300 dark:to-gray-100 border-gray-600 dark:border-gray-300 text-white dark:text-black shadow-lg shadow-black/20 dark:shadow-white/20",
                  !isCompleted && !isActive && isPast && "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500",
                  !isCompleted && !isActive && !isPast && "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400",
                  isClickable && !isActive && "group-hover:scale-110 group-hover:shadow-md"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Step Number Badge */}
                {!isCompleted && !isActive && (
                  <div className="absolute -top-1 -right-1 z-20 w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{step.id}</span>
                  </div>
                )}
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center">
                <p className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  isCompleted && "text-gray-800 dark:text-gray-200",
                  isActive && !isCompleted && "text-gray-700 dark:text-gray-300",
                  !isCompleted && !isActive && isPast && "text-gray-600 dark:text-gray-400",
                  !isCompleted && !isActive && !isPast && "text-gray-400 dark:text-gray-500"
                )}>
                  {step.name}
                </p>
                <p className={cn(
                  "text-xs mt-1 transition-all duration-300 max-w-[120px]",
                  isActive ? "text-gray-600 dark:text-gray-400 opacity-100" : "text-gray-400 dark:text-gray-500 opacity-60 group-hover:opacity-100"
                )}>
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