import type { AppData } from '../types'

const CODE_KEY = 'memory-cards:sync-code'

export function readSyncCode(): string {
  try {
    return localStorage.getItem(CODE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveSyncCode(code: string): void {
  localStorage.setItem(CODE_KEY, normalizeSyncCode(code))
}

/** 生成形如 MC-XXXXXXXXXXXX 的同步码 */
export function generateSyncCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9))
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  return `MC-${hex.slice(0, 4)}${hex.slice(4, 8)}${hex.slice(8, 12)}`
}

/** 支持手机号或随机同步码；去掉空格、横线中的空白 */
export function normalizeSyncCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s_]/g, '')
}

export function isValidSyncCode(raw: string): boolean {
  const code = normalizeSyncCode(raw)
  // 中国大陆手机号，或 8–64 位字母数字横线（兼容已生成的 MC- 码）
  if (/^1\d{10}$/.test(code)) return true
  return /^[A-Z0-9-]{8,64}$/.test(code)
}

type PullOk = { ok: true; updatedAt: string; data: AppData }
type PushOk = { ok: true; updatedAt: string }
type Err = { ok: false; error: string }

async function readJsonBody(res: Response): Promise<Record<string, unknown> | null> {
  const text = await res.text()
  const trimmed = text.trim()
  if (!trimmed || trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
    return null
  }
  try {
    return JSON.parse(trimmed) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function pullFromCloud(code: string): Promise<PullOk | Err> {
  const res = await fetch(`/api/sync?code=${encodeURIComponent(normalizeSyncCode(code))}`)
  const body = await readJsonBody(res)
  if (!body) {
    return {
      ok: false,
      error: '云同步接口未部署。请先 git push，并在 Cloudflare 绑定 MEMORY_KV 后重新部署',
    }
  }
  if (!res.ok) return { ok: false, error: String(body.error || `拉取失败（${res.status}）`) }
  const data = body.data as AppData | undefined
  if (!data) return { ok: false, error: '云端返回数据为空' }
  return { ok: true, updatedAt: String(body.updatedAt || ''), data }
}

export async function pushToCloud(code: string, data: AppData): Promise<PushOk | Err> {
  const res = await fetch('/api/sync', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: normalizeSyncCode(code), data }),
  })
  const body = await readJsonBody(res)
  if (!body) {
    return {
      ok: false,
      error: '云同步接口未部署。请先 git push，并在 Cloudflare 绑定 MEMORY_KV 后重新部署',
    }
  }
  if (!res.ok) return { ok: false, error: String(body.error || `上传失败（${res.status}）`) }
  return { ok: true, updatedAt: String(body.updatedAt || '') }
}
