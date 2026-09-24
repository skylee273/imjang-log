import { CATEGORIES, type Analysis, type Verdict } from '../types'
import { GRADE_COLOR, hasAnalysis } from '../analysis'


export function VerdictBadge({ verdict }: { verdict?: Verdict }) {
  if (!verdict) return <span className="muted">-</span>
  const strong = verdict === '적극 검토' || verdict === '긍정 검토'
  return (
    <span className={`verdict verdict--${VERDICT_CLASS[verdict]}`}>
      {strong ? <span className="hl">{verdict}</span> : verdict}
    </span>
  )
}

const VERDICT_CLASS: Record<Verdict, string> = {
  '적극 검토': 'go',
  '긍정 검토': 'good',
  보류: 'hold',
  제외: 'drop',
}

function List({ title, items, tone }: { title: string; items?: string[]; tone: 'pro' | 'con' | 'check' }) {
  if (!items?.length) return null
  return (
    <div className={`an-list an-list--${tone}`}>
      <h4>{title}</h4>
      <ul>
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  )
}

export default function AnalysisView({ analysis, onEdit }: { analysis?: Analysis; onEdit: () => void }) {
  if (!hasAnalysis(analysis)) {
    return (
      <div className="analysis analysis--empty">
        아직 분석이 없어요.{' '}
        <button className="link-btn" onClick={onEdit}>
          분석 작성
        </button>
      </div>
    )
  }
  const a = analysis!
  return (
    <div className="analysis">
      {a.summary || a.verdict ? (
        <div className="an-summary">
          <div className="an-summary-head">
            <h4>종합 의견</h4>
            <VerdictBadge verdict={a.verdict} />
          </div>
          {a.summary ? <p>{a.summary}</p> : null}
        </div>
      ) : null}

      <div className="an-grid">
        {CATEGORIES.map(({ key, label }) => {
          const c = a.categories?.[key]
          const grade = c?.grade ?? '미확인'
          return (
            <div key={key} className="an-cat">
              <div className="an-cat-head">
                <span>{label}</span>
                <em
                  style={{
                    color: GRADE_COLOR[grade],
                    background: `color-mix(in srgb, ${GRADE_COLOR[grade]} 14%, transparent)`,
                  }}
                >
                  {grade}
                </em>
              </div>
              <p>{c?.text || <span className="muted">-</span>}</p>
            </div>
          )
        })}
      </div>

      <div className="an-lists">
        <List title="강점" items={a.pros} tone="pro" />
        <List title="약점" items={a.cons} tone="con" />
        <List title="확인할 것" items={a.checks} tone="check" />
      </div>

      {a.raw ? (
        <details className="an-raw">
          <summary>현장 메모 원문</summary>
          <pre>{a.raw}</pre>
        </details>
      ) : null}
    </div>
  )
}
