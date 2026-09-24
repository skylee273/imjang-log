import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { Visit } from '../types'
import { DEAL_COLOR, formatPrice, formatShort } from '../data'
import { VerdictBadge } from './AnalysisView'

// 지도는 서울(+ 하남·과천 등 맞닿은 생활권)로 한정
const SEOUL_CENTER: L.LatLngTuple = [37.5563, 126.99]
const SEOUL_ZOOM = 11
const SEOUL_BOUNDS = L.latLngBounds([37.33, 126.62], [37.8, 127.36])
const MIN_ZOOM = 10
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

function pinIcon(v: Visit, selected: boolean) {
  const cls = ['pin', selected && 'pin--selected', v.starred && 'pin--starred'].filter(Boolean).join(' ')
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="${cls}" style="--c:${DEAL_COLOR[v.dealType]}"><span class="pin-dot"></span>${formatShort(v.price)}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

/** 선택된 기록으로 지도 이동 */
function FlyTo({ target }: { target?: Visit }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 14), { duration: 0.6 })
  }, [target, map])
  return null
}

/** 외부에서 "전국 / 내 기록" 뷰 전환 */
function ViewControl({ visits, view, nonce }: { visits: Visit[]; view: 'seoul' | 'fit'; nonce: number }) {
  const map = useMap()
  const first = useRef(true)
  // visits 변경 시 자동으로 재조정하지 않음 (사용자 조작 존중) → ref 로만 참조
  const visitsRef = useRef(visits)
  useEffect(() => {
    visitsRef.current = visits
  }, [visits])
  useEffect(() => {
    const visits = visitsRef.current
    const animate = !first.current
    first.current = false
    if (view === 'fit' && visits.length) {
      const bounds = L.latLngBounds(visits.map((v) => [v.lat, v.lng]))
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate })
    } else {
      map.setView(SEOUL_CENTER, SEOUL_ZOOM, { animate })
    }
  }, [view, nonce, map])
  return null
}

interface Props {
  visits: Visit[]
  selectedId?: string
  onSelect: (id: string) => void
  view: 'seoul' | 'fit'
  viewNonce: number
}

export default function MapView({ visits, selectedId, onSelect, view, viewNonce }: Props) {
  const selected = useMemo(() => visits.find((v) => v.id === selectedId), [visits, selectedId])

  return (
    <MapContainer
      center={SEOUL_CENTER}
      zoom={SEOUL_ZOOM}
      minZoom={MIN_ZOOM}
      maxBounds={SEOUL_BOUNDS}
      maxBoundsViscosity={1}
      className="map"
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} maxZoom={19} />
      <ViewControl visits={visits} view={view} nonce={viewNonce} />
      <FlyTo target={selected} />
      {visits.map((v) => (
        <Marker
          key={v.id}
          position={[v.lat, v.lng]}
          icon={pinIcon(v, v.id === selectedId)}
          zIndexOffset={v.id === selectedId ? 1000 : v.starred ? 500 : 0}
          eventHandlers={{ click: () => onSelect(v.id) }}
        >
          <Popup offset={[0, -18]} closeButton={false}>
            <div className="popup">
              <div className="popup-date">{v.date}</div>
              <div className="popup-name">{v.starred ? <mark className="hl">{v.name}</mark> : v.name}</div>
              <div className="popup-meta">
                <span className="deal" style={{ '--c': DEAL_COLOR[v.dealType] } as CSSProperties}>
                  {v.dealType}
                </span>
                <strong>{formatPrice(v)}</strong>
                {v.pyeong ? <span>{v.pyeong}평</span> : null}
              </div>
              {v.analysis?.verdict ? (
                <div className="popup-verdict">
                  <VerdictBadge verdict={v.analysis.verdict} />
                </div>
              ) : null}
              {v.memo ? <div className="popup-memo">{v.memo}</div> : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

/** 입력 폼 안의 위치 선택용 미니 지도 */
export function PickerMap({
  lat,
  lng,
  onPick,
}: {
  lat?: number
  lng?: number
  onPick: (lat: number, lng: number) => void
}) {
  const has = lat != null && lng != null
  return (
    <MapContainer
      center={has ? [lat, lng] : SEOUL_CENTER}
      zoom={has ? 15 : SEOUL_ZOOM}
      minZoom={MIN_ZOOM}
      maxBounds={SEOUL_BOUNDS}
      maxBoundsViscosity={1}
      className="picker-map"
      zoomControl={false}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} maxZoom={19} />
      <PickEvents onPick={onPick} />
      {has ? <PickerFollow lat={lat} lng={lng} /> : null}
      {has ? (
        <Marker
          position={[lat, lng]}
          icon={L.divIcon({ className: 'pin-wrap', html: '<div class="pick-pin"></div>', iconSize: [0, 0] })}
        />
      ) : null}
    </MapContainer>
  )
}

function PickEvents({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

function PickerFollow({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    if (!map.getBounds().contains([lat, lng])) map.setView([lat, lng], Math.max(map.getZoom(), 15))
  }, [lat, lng, map])
  return null
}
