import { useState } from 'react'
import { CATEGORIES, GRADES, VERDICTS, type Analysis, type CategoryKey, type Grade } from '../types'

const lines = (s: string) =>
  s
    .split('\n')
    .map((t) => t.replace(/^[\s\-•·ㄴ]+/, '').trim())
    .filter(Boolean)

interface Props {
  value: Analysis
  onChange: (a: Analysis) => void
}

/** 목록 입력: 한 줄에 하나 */
function ListInput({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items?: string[]
  onChange: (v: string[]) => void
  placeholder: string
}) {
  const [text, setText] = useState((items ?? []).join('\n'))
  return (
    <label className="row col">
      <span>{label}</span>
      <textarea
        rows={2}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          onChange(lines(e.target.value))
        }}
        placeholder={placeholder}
      />
    </label>
  )
}

export default function AnalysisEditor({ value, onChange }: Props) {
  const setCat = (key: CategoryKey, patch: Partial<{ grade: Grade; text: string }>) => {
    const prev = value.categories?.[key] ?? { grade: '미확인' as Grade }
    onChange({ ...value, categories: { ...value.categories, [key]: { ...prev, ...patch } } })
  }

  return (
    <>
      <h3 className="group-title">임장 분석</h3>
      <div className="group">
        <div className="row">
          <span>판단</span>
          <div className="segmented wrap-seg">
            {VERDICTS.map((v) => (
              <button
                type="button"
                key={v}
                className={value.verdict === v ? 'on' : undefined}
                onClick={() => onChange({ ...value, verdict: value.verdict === v ? undefined : v })}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <label className="row col">
          <span>종합 의견</span>
          <textarea
            rows={3}
            value={value.summary ?? ''}
            onChange={(e) => onChange({ ...value, summary: e.target.value })}
            placeholder="이 단지를 한 문단으로 평가한다면?"
          />
        </label>
      </div>

      <div className="group">
        {CATEGORIES.map(({ key, label }) => {
          const c = value.categories?.[key]
          return (
            <div key={key} className="row col cat-row">
              <div className="cat-row-head">
                <span>{label}</span>
                <div className="segmented small">
                  {GRADES.map((g) => (
                    <button
                      type="button"
                      key={g}
                      className={(c?.grade ?? '미확인') === g ? 'on' : undefined}
                      onClick={() => setCat(key, { grade: g })}
                    >
                      {g === '미확인' ? '–' : g}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={2}
                value={c?.text ?? ''}
                onChange={(e) => setCat(key, { text: e.target.value })}
                placeholder={`${label} 평가`}
              />
            </div>
          )
        })}
      </div>

      <div className="group">
        <ListInput
          label="강점"
          items={value.pros}
          onChange={(pros) => onChange({ ...value, pros })}
          placeholder="한 줄에 하나씩"
        />
        <ListInput
          label="약점"
          items={value.cons}
          onChange={(cons) => onChange({ ...value, cons })}
          placeholder="한 줄에 하나씩"
        />
        <ListInput
          label="확인할 것"
          items={value.checks}
          onChange={(checks) => onChange({ ...value, checks })}
          placeholder="다음 임장·조사 때 확인할 점"
        />
        <label className="row col">
          <span>현장 메모 원문</span>
          <textarea
            rows={4}
            value={value.raw ?? ''}
            onChange={(e) => onChange({ ...value, raw: e.target.value })}
            placeholder="현장에서 적은 메모를 그대로 붙여넣으세요"
          />
        </label>
      </div>
    </>
  )
}
