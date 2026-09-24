// GitHub 저장소의 data/visits.json 을 읽고 쓰는 API.
// GITHUB_TOKEN 은 서버(Vercel 환경변수)에만 있고, 쓰기는 APP_PASSWORD 가 맞을 때만 허용.

const OWNER = 'skylee273'
const REPO = 'imjang-log'
const BRANCH = 'main'
const PATH = 'data/visits.json'
const CONTENTS = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`

const gh = (init: RequestInit = {}) => ({
  ...init,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    'User-Agent': 'imjang-log',
  },
})

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

const authorized = (req: Request) => {
  const pw = process.env.APP_PASSWORD
  return !!pw && req.headers.get('x-app-password') === pw
}

export async function GET(req: Request) {
  const res = await fetch(`${CONTENTS}?ref=${BRANCH}&t=${Date.now()}`, gh({ cache: 'no-store' }))
  if (!res.ok) return json({ error: `GitHub 읽기 실패 (${res.status})` }, 502)
  const file = (await res.json()) as { content: string; sha: string }
  const visits = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'))
  return json({ visits, sha: file.sha, canWrite: authorized(req) })
}

export async function PUT(req: Request) {
  if (!authorized(req)) return json({ error: '비밀번호가 맞지 않아요' }, 401)
  const { visits, sha, message } = (await req.json()) as { visits: unknown; sha: string; message?: string }
  if (!Array.isArray(visits) || typeof sha !== 'string') return json({ error: '잘못된 요청' }, 400)
  const res = await fetch(
    CONTENTS,
    gh({
      method: 'PUT',
      body: JSON.stringify({
        message: String(message || '임장 기록 수정').slice(0, 200),
        content: Buffer.from(JSON.stringify(visits, null, 2) + '\n', 'utf8').toString('base64'),
        sha,
        branch: BRANCH,
      }),
    }),
  )
  if (res.status === 409 || res.status === 422) return json({ error: 'conflict' }, 409)
  if (!res.ok) return json({ error: `GitHub 저장 실패 (${res.status})` }, 502)
  const out = (await res.json()) as { content: { sha: string } }
  return json({ sha: out.content.sha })
}
