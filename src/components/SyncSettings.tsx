import { useEffect, useState, type FormEvent } from 'react'
import { canWrite, REPO } from '../github'

interface Props {
  token: string
  onSave: (token: string) => void
  onClose: () => void
}

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new'

export default function SyncSettings({ token, onSave, onClose }: Props) {
  const [value, setValue] = useState(token)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const t = value.trim()
    if (!t) return
    setChecking(true)
    setError('')
    const ok = await canWrite(t).catch(() => false)
    setChecking(false)
    if (!ok) {
      setError('이 토큰으로는 저장소에 쓸 수 없어요. 권한(Contents: Read and write)을 확인하세요.')
      return
    }
    onSave(t)
  }

  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="sheet" onSubmit={submit}>
        <header className="sheet-head">
          <button type="button" className="link-btn" onClick={onClose}>
            닫기
          </button>
          <h2>GitHub 동기화</h2>
          <button type="submit" className="link-btn strong" disabled={!value.trim() || checking}>
            {checking ? '확인 중…' : '저장'}
          </button>
        </header>
        <div className="sheet-body">
          <p className="sheet-note">
            임장 기록은 <strong className="hl">{`${REPO.owner}/${REPO.repo}`}</strong> 저장소의{' '}
            <code>{REPO.path}</code> 에 JSON 으로 저장되어 PC·모바일 어디서나 같은 데이터를 봅니다. 기록을
            추가·수정하려면 기기마다 한 번 GitHub 토큰을 입력하세요.
          </p>
          <div className="group">
            <label className="row col">
              <span>Personal access token</span>
              <input
                type="password"
                className="token-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="github_pat_…"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          </div>
          {error ? <p className="error sheet-error">{error}</p> : null}
          <ol className="steps">
            <li>
              <a href={TOKEN_URL} target="_blank" rel="noreferrer">
                GitHub 토큰 만들기
              </a>{' '}
              (Fine-grained token)
            </li>
            <li>
              Repository access → <b>Only select repositories</b> → <b>{REPO.repo}</b>
            </li>
            <li>
              Permissions → Repository → <b>Contents: Read and write</b>
            </li>
            <li>생성된 토큰을 붙여넣고 저장</li>
          </ol>
          <p className="sheet-note muted">토큰은 이 기기의 브라우저에만 저장되고 GitHub 외 어디로도 전송되지 않아요.</p>
          {token ? (
            <div className="group">
              <button type="button" className="row danger-row" onClick={() => onSave('')}>
                이 기기에서 토큰 삭제
              </button>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  )
}
