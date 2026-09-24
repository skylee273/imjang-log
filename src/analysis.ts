import type { Analysis, Grade } from './types'

export const GRADE_COLOR: Record<Grade, string> = {
  좋음: '#34c759',
  보통: '#8e8e93',
  부족: '#ff9f0a',
  미확인: '#c7c7cc',
}

export const hasAnalysis = (a?: Analysis) =>
  !!a &&
  !!(
    a.summary ||
    a.verdict ||
    a.pros?.length ||
    a.cons?.length ||
    a.checks?.length ||
    Object.values(a.categories ?? {}).some((c) => c && (c.text || c.grade !== '미확인'))
  )
