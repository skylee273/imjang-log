import type { DealType, Visit } from './types'

const STORAGE_KEY = 'imjang-log:v1'

export const SEED: Visit[] = [
  {
    id: 'seed-godeok-welllife',
    date: '2026-09-24',
    name: '고덕 웰라이프',
    region: '서울 강동구 고덕동',
    dealType: '전세',
    price: 20900,
    lat: 37.5572,
    lng: 127.1545,
  },
  {
    id: 'seed-misa-hillstate',
    date: '2026-09-24',
    name: '미사 힐스테이트',
    region: '경기 하남시 망월동',
    dealType: '월세',
    price: 500,
    lat: 37.5636,
    lng: 127.1935,
  },
  {
    id: 'seed-godeok-gracium',
    date: '2026-09-24',
    name: '고덕 그라시움',
    region: '서울 강동구 고덕동',
    dealType: '전세',
    price: 80000,
    pyeong: 25,
    lat: 37.5541,
    lng: 127.1601,
  },
]

export function loadVisits(): Visit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Visit[]
  } catch {
    /* 저장소 접근 불가 → 기본 데이터 */
  }
  return SEED
}

export function saveVisits(visits: Visit[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits))
  } catch {
    /* 무시 */
  }
}

export function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** 만원 단위 → "2억 900만" */
export function formatManwon(v?: number): string {
  if (v == null || Number.isNaN(v)) return '-'
  const eok = Math.floor(v / 10000)
  const man = v % 10000
  if (eok && man) return `${eok}억 ${man.toLocaleString()}만`
  if (eok) return `${eok}억`
  return `${man.toLocaleString()}만`
}

/** 마커용 짧은 표기 → "2.1억", "500" */
export function formatShort(v: number): string {
  if (v >= 10000) return `${Math.round(v / 1000) / 10}억`
  return v.toLocaleString()
}

export function formatPrice(v: Visit): string {
  if (v.dealType === '월세') {
    return `${formatManwon(v.price)} / ${v.monthly != null ? formatManwon(v.monthly) : '-'}`
  }
  return formatManwon(v.price)
}

/** "서울 강동구 고덕동" → "서울 강동구" */
export function regionGroup(region: string): string {
  return region.trim().split(/\s+/).slice(0, 2).join(' ') || '기타'
}

export const DEAL_COLOR: Record<DealType, string> = {
  매매: '#ff3b30',
  전세: '#0071e3',
  월세: '#34c759',
}

const PROVINCE_SHORT: Record<string, string> = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원도: '강원',
  강원특별자치도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전라북도: '전북',
  전북특별자치도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
  제주특별자치도: '제주',
}

export interface GeoResult {
  label: string
  region: string
  lat: number
  lng: number
}

/** OpenStreetMap Nominatim 으로 장소 검색 */
export async function geocode(query: string): Promise<GeoResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=kr&accept-language=ko&limit=6&q=${encodeURIComponent(query)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('검색 실패')
  const rows = (await res.json()) as { display_name: string; lat: string; lon: string }[]
  return rows.map((r) => {
    // "고덕동, 강동구, 서울특별시, 05200, 대한민국" → "서울 강동구 고덕동"
    const parts = r.display_name
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== '대한민국' && !/^\d{5}$/.test(s))
    const admin = parts.filter((s) => /(특별시|광역시|자치시|도|시|군|구|동|읍|면|가)$/.test(s)).reverse()
    const region = admin
      .slice(0, 3)
      .map((s) => PROVINCE_SHORT[s] ?? s)
      .join(' ')
    return { label: r.display_name, region, lat: Number(r.lat), lng: Number(r.lon) }
  })
}
