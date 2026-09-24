import { useEffect, useState, type FormEvent } from 'react'
import { DEAL_TYPES, type DealType, type Visit } from '../types'
import { formatManwon, geocode, newId, type GeoResult } from '../data'
import { PickerMap } from './MapView'

interface Props {
  initial?: Visit
  onSave: (v: Visit) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const toNum = (s: string) => (s.trim() === '' ? undefined : Number(s.replaceAll(',', '')))

export default function VisitForm({ initial, onSave, onDelete, onClose }: Props) {
  const [date, setDate] = useState(initial?.date ?? today())
  const [name, setName] = useState(initial?.name ?? '')
  const [region, setRegion] = useState(initial?.region ?? '')
  const [dealType, setDealType] = useState<DealType>(initial?.dealType ?? '전세')
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [monthly, setMonthly] = useState(initial?.monthly?.toString() ?? '')
  const [pyeong, setPyeong] = useState(initial?.pyeong?.toString() ?? '')
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [memo, setMemo] = useState(initial?.memo ?? '')
  const [starred, setStarred] = useState(initial?.starred ?? false)
  const [lat, setLat] = useState<number | undefined>(initial?.lat)
  const [lng, setLng] = useState<number | undefined>(initial?.lng)

  const [q, setQ] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const search = async () => {
    const term = q.trim() || name.trim()
    if (!term) return
    setSearching(true)
    setSearchError('')
    try {
      const r = await geocode(term)
      setResults(r)
      if (!r.length) setSearchError('검색 결과가 없어요. 동 이름으로 검색하거나 지도를 직접 탭하세요.')
    } catch {
      setSearchError('검색에 실패했어요. 지도를 직접 탭해 위치를 지정하세요.')
    } finally {
      setSearching(false)
    }
  }

  const pickResult = (r: GeoResult) => {
    setLat(r.lat)
    setLng(r.lng)
    if (!region.trim() && r.region) setRegion(r.region)
    setResults([])
  }

  const priceNum = toNum(price)
  const canSave = name.trim() && priceNum != null && !Number.isNaN(priceNum) && lat != null && lng != null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    onSave({
      id: initial?.id ?? newId(),
      date,
      name: name.trim(),
      region: region.trim(),
      dealType,
      price: priceNum!,
      monthly: dealType === '월세' ? toNum(monthly) : undefined,
      pyeong: toNum(pyeong),
      rating: rating || undefined,
      memo: memo.trim() || undefined,
      starred,
      lat: lat!,
      lng: lng!,
    })
  }

  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="sheet" onSubmit={submit}>
        <header className="sheet-head">
          <button type="button" className="link-btn" onClick={onClose}>
            취소
          </button>
          <h2>{initial ? '임장 기록 편집' : '새 임장 기록'}</h2>
          <button type="submit" className="link-btn strong" disabled={!canSave}>
            저장
          </button>
        </header>

        <div className="sheet-body">
          <div className="group">
            <label className="row">
              <span>단지명</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 고덕 그라시움" required />
            </label>
            <label className="row">
              <span>임장일</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label className="row">
              <span>지역</span>
              <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="예) 서울 강동구 고덕동" />
            </label>
          </div>

          <div className="group">
            <div className="row">
              <span>거래</span>
              <div className="segmented">
                {DEAL_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={t === dealType ? 'on' : undefined}
                    onClick={() => setDealType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <label className="row">
              <span>{dealType === '매매' ? '매매가' : dealType === '전세' ? '전세금' : '보증금'}</span>
              <input
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="만원 단위 (예: 20900)"
                required
              />
              <em className="hint">{priceNum ? formatManwon(priceNum) : '만원'}</em>
            </label>
            {dealType === '월세' ? (
              <label className="row">
                <span>월세</span>
                <input
                  inputMode="numeric"
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                  placeholder="만원 단위"
                />
                <em className="hint">{toNum(monthly) ? formatManwon(toNum(monthly)) : '만원'}</em>
              </label>
            ) : null}
            <label className="row">
              <span>평형</span>
              <input inputMode="decimal" value={pyeong} onChange={(e) => setPyeong(e.target.value)} placeholder="예) 25" />
              <em className="hint">평</em>
            </label>
            <div className="row">
              <span>평점</span>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={n <= rating ? 'on' : undefined}
                    onClick={() => setRating(n === rating ? 0 : n)}
                    aria-label={`${n}점`}
                  />
                ))}
              </div>
            </div>
            <label className="row">
              <span>관심 단지</span>
              <input type="checkbox" className="switch" checked={starred} onChange={(e) => setStarred(e.target.checked)} />
            </label>
          </div>

          <div className="group">
            <label className="row col">
              <span>메모</span>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                placeholder="역까지 도보 거리, 학군, 소음, 주차, 느낀 점…"
              />
            </label>
          </div>

          <div className="group">
            <div className="row col">
              <span>
                위치 {lat != null ? <em className="ok">지정됨</em> : <em className="need">지도를 탭하거나 검색하세요</em>}
              </span>
              <div className="search-line">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      search()
                    }
                  }}
                  placeholder={name ? `"${name}" 또는 동 이름으로 검색` : '단지명·동 이름 검색'}
                />
                <button type="button" className="btn small" onClick={search} disabled={searching}>
                  {searching ? '검색 중…' : '검색'}
                </button>
              </div>
              {searchError ? <p className="error">{searchError}</p> : null}
              {results.length ? (
                <ul className="results">
                  {results.map((r, i) => (
                    <li key={i}>
                      <button type="button" onClick={() => pickResult(r)}>
                        <strong>{r.region || r.label.split(',')[0]}</strong>
                        <span>{r.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <PickerMap
                lat={lat}
                lng={lng}
                onPick={(a, b) => {
                  setLat(a)
                  setLng(b)
                }}
              />
            </div>
          </div>

          {initial && onDelete ? (
            <div className="group">
              {confirmDelete ? (
                <div className="row confirm">
                  <span>정말 삭제할까요?</span>
                  <div>
                    <button type="button" className="link-btn" onClick={() => setConfirmDelete(false)}>
                      아니요
                    </button>
                    <button type="button" className="link-btn danger" onClick={() => onDelete(initial.id)}>
                      삭제
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="row danger-row" onClick={() => setConfirmDelete(true)}>
                  기록 삭제
                </button>
              )}
            </div>
          ) : null}
        </div>
      </form>
    </div>
  )
}
