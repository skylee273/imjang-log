export type DealType = '매매' | '전세' | '월세'

export const DEAL_TYPES: DealType[] = ['매매', '전세', '월세']

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
  /** 관심 단지 → 형광펜 표시 */
  starred?: boolean
}
