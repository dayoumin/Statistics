'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VariableMapping } from '@/lib/statistics/variable-mapping'

interface VariableMappingDisplayProps {
  mapping: VariableMapping
  onClose: () => void
}

export function VariableMappingDisplay({ mapping, onClose }: VariableMappingDisplayProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">🎯 변수 자동 매핑</h4>
        <Button size="sm" variant="ghost" onClick={onClose}>
          숨기기
        </Button>
      </div>

      <div className="space-y-2 text-sm">
        {mapping.dependentVar && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">종속변수</Badge>
            <span className="font-mono">{mapping.dependentVar}</span>
          </div>
        )}

        {mapping.independentVar && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">독립변수</Badge>
            <span className="font-mono">
              {Array.isArray(mapping.independentVar)
                ? mapping.independentVar.join(', ')
                : mapping.independentVar}
            </span>
          </div>
        )}

        {mapping.groupVar && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">그룹변수</Badge>
            <span className="font-mono">{mapping.groupVar}</span>
          </div>
        )}

        {mapping.timeVar && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">시간변수</Badge>
            <span className="font-mono">{mapping.timeVar}</span>
          </div>
        )}

        {mapping.variables && mapping.variables.length > 0 && (
          <div className="flex items-start gap-2">
            <Badge variant="outline">변수목록</Badge>
            <span className="font-mono flex-1">
              {mapping.variables.join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground pt-2 border-t">
        💡 자동 매핑된 변수는 분석 시 기본값으로 사용됩니다.
        필요시 Step 4에서 수정할 수 있습니다.
      </div>
    </div>
  )
}