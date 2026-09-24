import { useCallback, useEffect, useRef, useState } from 'react'
import type { Visit } from './types'
import { loadVisits, saveVisits } from './data'
import { ConflictError, getToken, pull, push, setToken } from './github'

export type SyncState = 'loading' | 'synced' | 'saving' | 'readonly' | 'local' | 'error'
export interface SyncStatus {
  state: SyncState
  detail?: string
  at?: Date
}

const DIRTY_KEY = 'imjang-log:dirty'
const SAVE_DELAY = 1200

const isDirty = () => {
  try {
    return localStorage.getItem(DIRTY_KEY) === '1'
  } catch {
    return false
  }
}
const setDirty = (v: boolean) => {
  try {
    if (v) localStorage.setItem(DIRTY_KEY, '1')
    else localStorage.removeItem(DIRTY_KEY)
  } catch {
    /* 무시 */
  }
}

/** 같은 id 는 로컬 우선으로 합치기 */
const mergeById = (remote: Visit[], local: Visit[]) => {
  const map = new Map(remote.map((v) => [v.id, v]))
  local.forEach((v) => map.set(v.id, v))
  return [...map.values()]
}

/**
 * 임장 데이터: localStorage 캐시 + GitHub 저장소 data/visits.json 동기화.
 * 토큰이 있으면 변경 시 자동 커밋, 없으면 저장소 데이터를 읽기만 한다.
 */
export function useSyncedVisits() {
  const [visits, setVisits] = useState<Visit[]>(loadVisits)
  const [token, setTokenState] = useState(getToken)
  const [status, setStatus] = useState<SyncStatus>({ state: 'loading' })
  const visitsRef = useRef(visits)
  const shaRef = useRef<string>(undefined)
  const messages = useRef<string[]>([])
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    visitsRef.current = visits
    saveVisits(visits)
  }, [visits])

  const flush = useCallback(async () => {
    timer.current = undefined
    const tok = getToken()
    if (!tok || !shaRef.current) return
    const msgs = messages.current
    messages.current = []
    const message = msgs.length === 1 ? msgs[0] : msgs.length ? `임장 기록 ${msgs.length}건 수정` : '임장 기록 동기화'
    setStatus({ state: 'saving' })
    try {
      try {
        shaRef.current = await push(tok, visitsRef.current, shaRef.current, message)
      } catch (e) {
        if (!(e instanceof ConflictError)) throw e
        // 다른 기기가 먼저 저장 → 원격과 합친 뒤 다시 저장
        const remote = await pull(tok)
        const merged = mergeById(remote.visits, visitsRef.current)
        visitsRef.current = merged
        setVisits(merged)
        shaRef.current = await push(tok, merged, remote.sha, message)
      }
      setDirty(false)
      setStatus({ state: 'synced', at: new Date() })
    } catch (e) {
      messages.current = [...msgs, ...messages.current]
      setStatus({ state: 'error', detail: e instanceof Error ? e.message : '저장 실패' })
    }
  }, [])

  const schedule = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, SAVE_DELAY)
  }, [flush])

  /** 저장소에서 최신 데이터 불러오기 */
  const refresh = useCallback(async () => {
    if (timer.current) return // 저장 대기 중이면 건너뜀
    const tok = getToken()
    try {
      const remote = await pull(tok)
      shaRef.current = remote.sha
      if (isDirty()) {
        // 이 기기에만 있는 변경 → 토큰이 있으면 올림
        if (tok) {
          if (!messages.current.length) messages.current.push('이 기기의 변경 내용 동기화')
          schedule()
        } else {
          setStatus({ state: 'local', detail: '이 기기에만 저장됨' })
        }
        return
      }
      setVisits(remote.visits)
      setStatus({ state: tok ? 'synced' : 'readonly', at: new Date() })
    } catch (e) {
      setStatus({ state: 'error', detail: e instanceof Error ? e.message : '불러오기 실패' })
    }
  }, [schedule])

  useEffect(() => {
    // 원격 저장소(외부 시스템)와의 동기화 — setState 는 fetch 이후 비동기로 일어남
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    const onVisible = () => document.visibilityState === 'visible' && !isDirty() && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  /** 데이터 변경 + GitHub 커밋 예약 */
  const update = useCallback(
    (fn: (prev: Visit[]) => Visit[], message: string) => {
      setVisits(fn)
      setDirty(true)
      messages.current.push(message)
      if (getToken() && shaRef.current) schedule()
      else setStatus({ state: 'local', detail: '이 기기에만 저장됨' })
    },
    [schedule],
  )

  const saveToken = useCallback(
    (t: string) => {
      setToken(t)
      setTokenState(t)
      refresh()
    },
    [refresh],
  )

  return { visits, update, status, token, saveToken, refresh }
}
