import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapView from './components/MapView'
import VisitTable, { type Sort, type SortKey } from './components/VisitTable'
import VisitForm from './components/VisitForm'
import SyncSettings from './components/SyncSettings'
import { useSyncedVisits, type SyncStatus } from './useSyncedVisits'
import { DEAL_TYPES, type DealType, type Visit } from './types'
import { DEAL_COLOR, regionGroup } from './data'

type DealFilter = DealType | '전체'

const time = (d?: Date) => (d ? d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '')

function syncLabel(s: SyncStatus): string {
  switch (s.state) {
    case 'loading':
      return 'GitHub에서 불러오는 중…'
    case 'saving':
      return 'GitHub에 저장 중…'
    case 'synced':
      return `GitHub 동기화됨 · ${time(s.at)}`
    case 'readonly':
      return '읽기 전용 · 비밀번호를 입력하면 기록할 수 있어요'
    case 'local':
      return s.detail ?? '이 기기에만 저장됨'
    case 'error':
      return s.detail ?? '동기화 오류'
  }
}

export default function App() {
  const { visits, update, status, password, savePassword, refresh } = useSyncedVisits()
  const [showSync, setShowSync] = useState(false)
  const [selectedId, setSelectedId] = useState<string>()
  const [editing, setEditing] = useState<Visit | 'new' | null>(null)
  const [deal, setDeal] = useState<DealFilter>('전체')
  const [region, setRegion] = useState<string>('전체')
  const [starOnly, setStarOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>({ key: 'date', dir: 'desc' })
  const [view, setView] = useState<{ mode: 'seoul' | 'fit'; nonce: number }>({ mode: 'fit', nonce: 0 })
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const regions = useMemo(() => {
    const counts = new Map<string, number>()
    visits.forEach((v) => counts.set(regionGroup(v.region), (counts.get(regionGroup(v.region)) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [visits])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = visits.filter(
      (v) =>
        (deal === '전체' || v.dealType === deal) &&
        (region === '전체' || regionGroup(v.region) === region) &&
        (!starOnly || v.starred) &&
        (!q || [v.name, v.region, v.memo ?? ''].some((s) => s.toLowerCase().includes(q))),
    )
    const dir = sort.dir === 'asc' ? 1 : -1
    return list.sort((a, b) => {
      const av = a[sort.key] ?? ''
      const bv = b[sort.key] ?? ''
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv), 'ko') * dir
    })
  }, [visits, deal, region, starOnly, query, sort])

  const stats = useMemo(() => {
    const dates = visits.map((v) => v.date).sort()
    return {
      total: visits.length,
      regions: new Set(visits.map((v) => regionGroup(v.region))).size,
      starred: visits.filter((v) => v.starred).length,
      last: dates.at(-1)?.replaceAll('-', '.') ?? '-',
    }
  }, [visits])

  const onSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'date' ? 'desc' : 'asc' },
    )

  const onSave = (v: Visit) => {
    const exists = visits.some((x) => x.id === v.id)
    update(
      (list) => (exists ? list.map((x) => (x.id === v.id ? v : x)) : [...list, v]),
      `${exists ? '임장 수정' : '임장 추가'}: ${v.name}`,
    )
    setSelectedId(v.id)
    setToast(exists ? '저장했어요' : '임장 기록을 추가했어요')
    setEditing(null)
  }

  const onDelete = (id: string) => {
    const name = visits.find((x) => x.id === id)?.name ?? ''
    update((list) => list.filter((x) => x.id !== id), `임장 삭제: ${name}`)
    setSelectedId(undefined)
    setEditing(null)
    setToast('삭제했어요')
  }

  const toggleStar = (id: string) => {
    const v = visits.find((x) => x.id === id)
    if (!v) return
    update(
      (list) => list.map((x) => (x.id === id ? { ...x, starred: !x.starred } : x)),
      `관심 ${v.starred ? '해제' : '표시'}: ${v.name}`,
    )
  }

  const closeForm = useCallback(() => setEditing(null), [])
  const closeSync = useCallback(() => setShowSync(false), [])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(visits, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `imjang-log-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as Visit[]
      if (!Array.isArray(data) || data.some((v) => !v.id || !v.name || v.lat == null || v.lng == null))
        throw new Error()
      update(() => data, `백업 파일에서 ${data.length}건 불러오기`)
      setView((s) => ({ mode: 'fit', nonce: s.nonce + 1 }))
      setToast(`${data.length}건을 불러왔어요`)
    } catch {
      setToast('올바른 백업 파일이 아니에요')
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow">내 임장 기록</p>
          <h1>
            <span className="hl">임장로그</span>
          </h1>
          <p className="lede">발로 뛴 기록으로 다음 보금자리를 찾습니다.</p>
        </div>
        <button className="btn primary" onClick={() => setEditing('new')}>
          <span aria-hidden>＋</span> 임장 기록
        </button>
      </header>

      <section className="stats">
        <div className="stat">
          <span>총 임장</span>
          <strong>
            {stats.total}
            <small>건</small>
          </strong>
        </div>
        <div className="stat">
          <span>지역</span>
          <strong>
            {stats.regions}
            <small>곳</small>
          </strong>
        </div>
        <div className="stat">
          <span>관심 단지</span>
          <strong>
            <span className="hl">{stats.starred}</span>
            <small>곳</small>
          </strong>
        </div>
        <div className="stat">
          <span>최근 임장</span>
          <strong className="date-stat">{stats.last}</strong>
        </div>
      </section>

      <section className="card map-card">
        <MapView
          visits={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          view={view.mode}
          viewNonce={view.nonce}
        />
        <div className="map-overlay">
          <div className="segmented glass">
            <button
              className={view.mode === 'fit' ? 'on' : undefined}
              onClick={() => setView((s) => ({ mode: 'fit', nonce: s.nonce + 1 }))}
            >
              내 기록
            </button>
            <button
              className={view.mode === 'seoul' ? 'on' : undefined}
              onClick={() => setView((s) => ({ mode: 'seoul', nonce: s.nonce + 1 }))}
            >
              서울 전체
            </button>
          </div>
        </div>
        <div className="legend glass">
          {DEAL_TYPES.map((t) => (
            <span key={t}>
              <i style={{ background: DEAL_COLOR[t] }} />
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="card table-card">
        <div className="toolbar">
          <div className="toolbar-row">
            <h2>
              임장 기록 <span className="count">{filtered.length}</span>
            </h2>
            <div className="search">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="단지·지역·메모 검색"
              />
            </div>
          </div>
          <div className="toolbar-row wrap">
            <div className="segmented">
              {(['전체', ...DEAL_TYPES] as DealFilter[]).map((t) => (
                <button key={t} className={deal === t ? 'on' : undefined} onClick={() => setDeal(t)}>
                  {t}
                </button>
              ))}
            </div>
            <div className="chips">
              <button className={`chip ${starOnly ? 'on star-chip' : ''}`} onClick={() => setStarOnly((s) => !s)}>
                ★ 관심만
              </button>
              <button className={`chip ${region === '전체' ? 'on' : ''}`} onClick={() => setRegion('전체')}>
                전체 지역
              </button>
              {regions.map(([r, n]) => (
                <button key={r} className={`chip ${region === r ? 'on' : ''}`} onClick={() => setRegion(r)}>
                  {r} <em>{n}</em>
                </button>
              ))}
            </div>
          </div>
        </div>

        <VisitTable
          visits={filtered}
          selectedId={selectedId}
          sort={sort}
          query={query}
          onSort={onSort}
          onSelect={setSelectedId}
          onEdit={(v) => setEditing(v)}
          onToggleStar={toggleStar}
        />
      </section>

      <footer className="foot">
        <button className={`sync sync--${status.state}`} onClick={() => setShowSync(true)}>
          <i />
          {syncLabel(status)}
        </button>
        <div>
          {status.state === 'error' ? (
            <button className="link-btn" onClick={refresh}>
              다시 시도
            </button>
          ) : null}
          <button className="link-btn" onClick={() => setShowSync(true)}>
            {password ? '동기화 설정' : '비밀번호 입력'}
          </button>
          <button className="link-btn" onClick={exportJson}>
            백업 내보내기
          </button>
          <button className="link-btn" onClick={() => fileRef.current?.click()}>
            백업 불러오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importJson(f)
              e.target.value = ''
            }}
          />
        </div>
      </footer>

      <button className="fab" aria-label="임장 기록 추가" onClick={() => setEditing('new')}>
        ＋
      </button>

      {editing ? (
        <VisitForm
          initial={editing === 'new' ? undefined : editing}
          onSave={onSave}
          onDelete={onDelete}
          onClose={closeForm}
        />
      ) : null}

      {showSync ? (
        <SyncSettings
          password={password}
          onSave={(pw) => {
            savePassword(pw)
            setShowSync(false)
            setToast(pw ? '이제 이 기기에서 기록할 수 있어요' : '비밀번호를 삭제했어요')
          }}
          onClose={closeSync}
        />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
