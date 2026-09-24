import type { Visit } from './types'

/** 임장 데이터가 저장되는 GitHub 저장소 위치 */
export const REPO = { owner: 'skylee273', repo: 'imjang-log', branch: 'main', path: 'data/visits.json' }

const TOKEN_KEY = 'imjang-log:gh-token'
const API = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${REPO.path}`

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setToken(token: string) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* 무시 */
  }
}

function headers(token: string): HeadersInit {
  const h: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

const decode = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)))

const encode = (text: string) => {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}

export interface Remote {
  visits: Visit[]
  sha: string
}

/** 저장소의 data/visits.json 읽기 (공개 저장소면 토큰 없이도 가능) */
export async function pull(token: string): Promise<Remote> {
  const res = await fetch(`${API}?ref=${REPO.branch}&t=${Date.now()}`, { headers: headers(token), cache: 'no-store' })
  if (!res.ok) throw new Error(`GitHub 읽기 실패 (${res.status})`)
  const json = (await res.json()) as { content: string; sha: string }
  return { visits: JSON.parse(decode(json.content)) as Visit[], sha: json.sha }
}

export class ConflictError extends Error {}

/** data/visits.json 에 커밋. sha 가 원격과 다르면 ConflictError */
export async function push(token: string, visits: Visit[], sha: string, message: string): Promise<string> {
  const res = await fetch(API, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({
      message,
      content: encode(JSON.stringify(visits, null, 2) + '\n'),
      sha,
      branch: REPO.branch,
    }),
  })
  if (res.status === 409 || res.status === 422) throw new ConflictError('다른 기기에서 먼저 저장됨')
  if (res.status === 401 || res.status === 403) throw new Error('토큰 권한이 없어요')
  if (!res.ok) throw new Error(`GitHub 저장 실패 (${res.status})`)
  const json = (await res.json()) as { content: { sha: string } }
  return json.content.sha
}

/** 토큰이 이 저장소에 쓰기 권한이 있는지 확인 */
export async function canWrite(token: string): Promise<boolean> {
  const res = await fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.repo}`, { headers: headers(token) })
  if (!res.ok) return false
  const json = (await res.json()) as { permissions?: { push?: boolean } }
  return !!json.permissions?.push
}
