import { Fragment, useEffect, useRef, type CSSProperties } from 'react'
import type { Visit } from '../types'
import { DEAL_COLOR, formatPrice } from '../data'
import AnalysisView, { VerdictBadge } from './AnalysisView'

export type SortKey = 'date' | 'name' | 'region' | 'price' | 'pyeong' | 'rating'
export interface Sort {
  key: SortKey
  dir: 'asc' | 'desc'
}

interface Props {
  visits: Visit[]
  selectedId?: string
  sort: Sort
  query: string
  onSort: (key: SortKey) => void
  onSelect: (id: string) => void
  onEdit: (v: Visit) => void
  onToggleStar: (id: string) => void
}

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'date', label: '날짜' },
  { key: 'name', label: '단지명' },
  { key: 'region', label: '지역', className: 'opt' },
  { key: 'price', label: '가격', className: 'num' },
  { key: 'pyeong', label: '평형', className: 'num opt' },
  { key: 'rating', label: '평점', className: 'opt' },
]

/** 검색어를 형광펜으로 표시 */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="hl">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

export default function VisitTable({ visits, selectedId, sort, query, onSort, onSelect, onEdit, onToggleStar }: Props) {
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>())

  useEffect(() => {
    if (!selectedId) return
    rowRefs.current.get(selectedId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  if (!visits.length) {
    return <div className="empty">조건에 맞는 임장 기록이 없어요.</div>
  }

  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th className="star-col" aria-label="관심" />
            {COLUMNS.map((c) => (
              <th key={c.key} className={c.className}>
                <button className="th-btn" onClick={() => onSort(c.key)}>
                  {c.label}
                  <span className={`sort-ind ${sort.key === c.key ? 'on' : ''}`}>
                    {sort.key === c.key ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </button>
              </th>
            ))}
            <th className="opt verdict-col">판단</th>
            <th className="opt memo-col">메모</th>
            <th className="act-col" aria-label="편집" />
          </tr>
        </thead>
        <tbody>
          {visits.map((v) => (
            <Fragment key={v.id}>
              <tr
                ref={(el) => {
                  if (el) rowRefs.current.set(v.id, el)
                  else rowRefs.current.delete(v.id)
                }}
                className={v.id === selectedId ? 'selected' : undefined}
                onClick={() => onSelect(v.id)}
              >
                <td className="star-col">
                  <button
                    className={`star ${v.starred ? 'on' : ''}`}
                    aria-label={v.starred ? '관심 해제' : '관심 표시'}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleStar(v.id)
                    }}
                  >
                    {v.starred ? '★' : '☆'}
                  </button>
                </td>
                <td className="date">{v.date.slice(2).replaceAll('-', '.')}</td>
                <td className="name">
                  <span className={v.starred ? 'hl' : undefined}>
                    <Highlight text={v.name} query={query} />
                  </span>
                  <span className="sub">
                    <Highlight text={v.region} query={query} />
                    {v.pyeong ? ` · ${v.pyeong}평` : ''}
                  </span>
                </td>
                <td className="opt muted region">
                  <Highlight text={v.region} query={query} />
                </td>
                <td className="num price">
                  <span className="deal" style={{ '--c': DEAL_COLOR[v.dealType] } as CSSProperties}>
                    {v.dealType}
                  </span>
                  <span className="price-val">{formatPrice(v)}</span>
                </td>
                <td className="num opt">{v.pyeong ? `${v.pyeong}평` : '-'}</td>
                <td className="opt rating">{v.rating ? '●'.repeat(v.rating) + '○'.repeat(5 - v.rating) : '-'}</td>
                <td className="opt verdict-col">
                  <VerdictBadge verdict={v.analysis?.verdict} />
                </td>
                <td className="opt memo-col muted">{v.memo ? <Highlight text={v.memo} query={query} /> : '-'}</td>
                <td className="act-col">
                  <button
                    className="link-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(v)
                    }}
                  >
                    편집
                  </button>
                </td>
              </tr>
              {v.id === selectedId ? (
                <tr className="detail-row">
                  <td colSpan={11}>
                    <AnalysisView analysis={v.analysis} onEdit={() => onEdit(v)} />
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
