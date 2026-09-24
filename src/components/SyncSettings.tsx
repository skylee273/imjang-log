import { useEffect, useState, type FormEvent } from 'react'
import { checkPassword, REPO } from '../github'

interface Props {
  password: string
  onSave: (password: string) => void
  onClose: () => void
}

export default function SyncSettings({ password, onSave, onClose }: Props) {
  const [value, setValue] = useState(password)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const pw = value.trim()
    if (!pw) return
    setChecking(true)
    setError('')
    const ok = await checkPassword(pw).catch(() => false)
    setChecking(false)
    if (!ok) {
      setError('비밀번호가 맞지 않아요.')
      return
    }
    onSave(pw)
  }

  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="sheet" onSubmit={submit}>
        <header className="sheet-head">
          <button type="button" className="link-btn" onClick={onClose}>
            닫기
          </button>
          <h2>기록 권한</h2>
          <button type="submit" className="link-btn strong" disabled={!value.trim() || checking}>
            {checking ? '확인 중…' : '저장'}
          </button>
        </header>
        <div className="sheet-body">
          <p className="sheet-note">
            임장 기록은 GitHub <strong className="hl">{`${REPO.owner}/${REPO.repo}`}</strong> 저장소의{' '}
            <code>{REPO.path}</code> 에 저장되어 PC·모바일 어디서나 같은 데이터를 봅니다. 기록을 추가·수정하려면
            기기마다 한 번 비밀번호를 입력하세요.
          </p>
          <div className="group">
            <label className="row">
              <span>비밀번호</span>
              <input
                type="password"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="앱 비밀번호"
                autoComplete="current-password"
                autoFocus
              />
            </label>
          </div>
          {error ? <p className="error sheet-error">{error}</p> : null}
          <p className="sheet-note muted">비밀번호는 이 기기의 브라우저에만 저장돼요.</p>
          {password ? (
            <div className="group">
              <button type="button" className="row danger-row" onClick={() => onSave('')}>
                이 기기에서 비밀번호 삭제
              </button>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  )
}
