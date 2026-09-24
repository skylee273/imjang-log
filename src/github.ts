import type { Visit } from './types'

/** 임장 데이터가 저장되는 GitHub 저장소 위치 (실제 읽기/쓰기는 /api/visits 가 서버에서 수행) */
export const REPO = { owner: 'skylee273', repo: 'imjang-log', path: 'data/visits.json' }

const API = '/api/visits'
const PASSWORD_KEY = 'imjang-log:password'

export function getPassword(): string {
  try {
    return localStorage.getItem(PASSWORD_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setPassword(pw: string) {
  try {
    if (pw) localStorage.setItem(PASSWORD_KEY, pw)
    else localStorage.removeItem(PASSWORD_KEY)
  } catch {
    /* 무시 */
  }
}

const headers = (pw: string): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(pw ? { 'x-app-password': pw } : {}),
})

export interface Remote {
  visits: Visit[]
  sha: string
  canWrite: boolean
}

/** 저장소의 data/visits.json 읽기. canWrite = 비밀번호가 맞는지 */
export async function pull(pw: string): Promise<Remote> {
  const res = await fetch(API, { headers: headers(pw), cache: 'no-store' })
  if (!res.ok) throw new Error(`불러오기 실패 (${res.status})`)
  return (await res.json()) as Remote
}

export class ConflictError extends Error {}

/** data/visits.json 에 커밋. sha 가 원격과 다르면 ConflictError */
export async function push(pw: string, visits: Visit[], sha: string, message: string): Promise<string> {
  const res = await fetch(API, {
    method: 'PUT',
    headers: headers(pw),
    body: JSON.stringify({ visits, sha, message }),
  })
  if (res.status === 409) throw new ConflictError('다른 기기에서 먼저 저장됨')
  if (res.status === 401) throw new Error('비밀번호가 맞지 않아요')
  if (!res.ok) throw new Error(`저장 실패 (${res.status})`)
  return ((await res.json()) as { sha: string }).sha
}

/** 비밀번호 확인 */
export async function checkPassword(pw: string): Promise<boolean> {
  return (await pull(pw)).canWrite
}
