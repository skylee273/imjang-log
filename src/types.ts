export type DealType = '매매' | '전세' | '월세'

export const DEAL_TYPES: DealType[] = ['매매', '전세', '월세']

export type Grade = '좋음' | '보통' | '부족' | '미확인'
export const GRADES: Grade[] = ['좋음', '보통', '부족', '미확인']

export type Verdict = '적극 검토' | '긍정 검토' | '보류' | '제외'
export const VERDICTS: Verdict[] = ['적극 검토', '긍정 검토', '보류', '제외']

export const CATEGORIES = [
  { key: 'transport', label: '교통' },
  { key: 'development', label: '개발 호재' },
  { key: 'school', label: '학군' },
  { key: 'infra', label: '생활 인프라' },
  { key: 'nature', label: '공원·한강' },
] as const
export type CategoryKey = (typeof CATEGORIES)[number]['key']

export interface CategoryNote {
  grade: Grade
  text?: string
}

/** 임장 분석 */
export interface Analysis {
  categories?: Partial<Record<CategoryKey, CategoryNote>>
  pros?: string[]
  cons?: string[]
  /** 앞으로 확인할 것 */
  checks?: string[]
  /** 종합 의견 */
  summary?: string
  verdict?: Verdict
  /** 현장 메모 원문 */
  raw?: string
}

export interface Visit {
  id: string
  /** 임장 날짜 YYYY-MM-DD */
  date: string
  /** 단지명 */
  name: string
  /** 지역 (예: 서울 강동구 고덕동) */
  region: string
  dealType: DealType
  /** 매매가 / 전세금 / 보증금 (만원) */
  price: number
  /** 월세 (만원) */
  monthly?: number
  /** 평형 */
  pyeong?: number
  /** 1~5 */
  rating?: number
  memo?: string
  lat: number
  lng: number
  analysis?: Analysis
  /** 관심 단지 → 형광펜 표시 */
  starred?: boolean
}
