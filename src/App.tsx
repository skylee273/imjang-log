import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapView from './components/MapView'
import VisitTable, { type Sort, type SortKey } from './components/VisitTable'
import VisitForm from './components/VisitForm'
import { DEAL_TYPES, type DealType, type Visit } from './types'
import { DEAL_COLOR, loadVisits, regionGroup, saveVisits } from './data'

type DealFilter = DealType | '전체'

export default function App() {
  const [visits, setVisits] = useState<Visit[]>(loadVisits)
  const [selectedId, setSelectedId] = useState<string>()
  const [editing, setEditing] = useState<Visit | 'new' | null>(null)
  const [deal, setDeal] = useState<DealFilter>('전체')
  const [region, setRegion] = useState<string>('전체')
  const [starOnly, setStarOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>({ key: 'date', dir: 'desc' })
  const [view, setView] = useState<{ mode: 'korea' | 'fit'; nonce: number }>({ mode: 'fit', nonce: 0 })
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => saveVisits(visits), [visits])

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
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'date' ? 'desc' : 'asc' }))

  const onSave = (v: Visit) => {
    setVisits((list) => (list.some((x) => x.id === v.id) ? list.map((x) => (x.id === v.id ? v : x)) : [...list, v]))
    setSelectedId(v.id)
    setToast(editing === 'new' ? '임장 기록을 추가했어요' : '저장했어요')
    setEditing(null)
  }

  const onDelete = (id: string) => {
    setVisits((list) => list.filter((x) => x.id !== id))
    setSelectedId(undefined)
    setEditing(null)
    setToast('삭제했어요')
  }

  const toggleStar = (id: string) =>
    setVisits((list) => list.map((x) => (x.id === id ? { ...x, starred: !x.starred } : x)))

  const closeForm = useCallback(() => setEditing(null), [])

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
      if (!Array.isArray(data) || data.some((v) => !v.id || !v.name || v.lat == null || v.lng == null)) throw new Error()
      setVisits(data)
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
          <strong>{stats.total}<small>건</small></strong>
        </div>
        <div className="stat">
          <span>지역</span>
          <strong>{stats.regions}<small>곳</small></strong>
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
              className={view.mode === 'korea' ? 'on' : undefined}
              onClick={() => setView((s) => ({ mode: 'korea', nonce: s.nonce + 1 }))}
            >
              전국
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
        <span>데이터는 이 브라우저에 저장됩니다. 기기 간 이동은 백업 파일을 사용하세요.</span>
        <div>
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

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
