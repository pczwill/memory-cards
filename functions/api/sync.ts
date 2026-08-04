/* Cloudflare Pages Functions runtime types (minimal) */
type PagesFunction<Env = unknown> = (context: {
  request: Request
  env: Env
}) => Response | Promise<Response>

interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

type Env = {
  MEMORY_KV: KVNamespace
}

type SyncPayload = {
  version: 1
  updatedAt: string
  data: unknown
}

const CODE_RE = /^[A-Za-z0-9-]{10,64}$/

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function normalizeCode(raw: string | null | undefined): string | null {
  if (!raw) return null
  const code = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (!CODE_RE.test(code)) return null
  return code
}

async function storageKey(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `sync:${hex}`
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!context.env.MEMORY_KV) {
    return json({ error: '未配置 MEMORY_KV，请在 Cloudflare Pages 绑定 KV 命名空间' }, 503)
  }

  const code = normalizeCode(new URL(context.request.url).searchParams.get('code'))
  if (!code) return json({ error: '同步码无效' }, 400)

  const raw = await context.env.MEMORY_KV.get(await storageKey(code))
  if (!raw) return json({ error: '云端没有这份数据，请先上传' }, 404)

  try {
    const payload = JSON.parse(raw) as SyncPayload
    return json({ ok: true, updatedAt: payload.updatedAt, data: payload.data })
  } catch {
    return json({ error: '云端数据损坏' }, 500)
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  if (!context.env.MEMORY_KV) {
    return json({ error: '未配置 MEMORY_KV，请在 Cloudflare Pages 绑定 KV 命名空间' }, 503)
  }

  let body: { code?: string; data?: unknown }
  try {
    body = (await context.request.json()) as { code?: string; data?: unknown }
  } catch {
    return json({ error: '请求格式错误' }, 400)
  }

  const code = normalizeCode(body.code)
  if (!code) return json({ error: '同步码无效' }, 400)
  if (!body.data || typeof body.data !== 'object') {
    return json({ error: '缺少 data' }, 400)
  }

  const data = body.data as { cards?: unknown; logs?: unknown }
  if (!Array.isArray(data.cards) || !Array.isArray(data.logs)) {
    return json({ error: 'data 必须包含 cards 与 logs 数组' }, 400)
  }

  const updatedAt = new Date().toISOString()
  const payload: SyncPayload = { version: 1, updatedAt, data: body.data }
  await context.env.MEMORY_KV.put(await storageKey(code), JSON.stringify(payload))

  return json({ ok: true, updatedAt })
}
