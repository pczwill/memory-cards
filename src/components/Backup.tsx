import { useRef, useState } from 'react'
import {
  generateSyncCode,
  isValidSyncCode,
  normalizeSyncCode,
  pullFromCloud,
  pushToCloud,
  readSyncCode,
  saveSyncCode,
} from '../lib/cloudSync'
import { exportJson, parseImport } from '../lib/storage'
import { seedPercentCards } from '../lib/seed'
import type { AppData } from '../types'

export function Backup({
  data,
  onReplace,
}: {
  data: AppData
  onReplace: (data: AppData) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [syncCode, setSyncCode] = useState(() => readSyncCode())
  const [busy, setBusy] = useState(false)

  function download() {
    const blob = new Blob([exportJson(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memory-cards-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('已导出备份文件')
  }

  async function onFile(file: File) {
    try {
      const text = await file.text()
      const parsed = parseImport(text)
      onReplace(parsed)
      setMsg(`已导入 ${parsed.cards.length} 张卡片、${parsed.logs.length} 条记录`)
    } catch {
      setMsg('导入失败：文件格式不对')
    }
  }

  function resetSeed() {
    if (!confirm('将清空当前数据，并重新载入百化分正反示例卡，确定？')) return
    onReplace({ version: 1, cards: seedPercentCards(), logs: [] })
    setMsg('已重置为百化分正反示例库')
  }

  function onCodeChange(value: string) {
    const next = normalizeSyncCode(value)
    setSyncCode(next)
    if (isValidSyncCode(next)) saveSyncCode(next)
  }

  function createCode() {
    const code = generateSyncCode()
    setSyncCode(code)
    saveSyncCode(code)
    setMsg(`已生成同步码 ${code}，请先「上传到云」，并抄到其他设备`)
  }

  async function upload() {
    if (!isValidSyncCode(syncCode)) {
      setMsg('请先生成或输入有效同步码')
      return
    }
    setBusy(true)
    setMsg('正在上传…')
    try {
      saveSyncCode(syncCode)
      const result = await pushToCloud(syncCode, data)
      if (!result.ok) {
        setMsg(result.error)
        return
      }
      setMsg(`已上传到云（${new Date(result.updatedAt).toLocaleString('zh-CN')}）`)
    } catch {
      setMsg('上传失败：请确认已部署到 Cloudflare，并绑定了 MEMORY_KV')
    } finally {
      setBusy(false)
    }
  }

  async function downloadCloud() {
    if (!isValidSyncCode(syncCode)) {
      setMsg('请输入同步码')
      return
    }
    if (!confirm('将用云端数据覆盖本机当前数据，确定？')) return
    setBusy(true)
    setMsg('正在从云端拉取…')
    try {
      saveSyncCode(syncCode)
      const result = await pullFromCloud(syncCode)
      if (!result.ok) {
        setMsg(result.error)
        return
      }
      onReplace(result.data)
      setMsg(
        `已从云端恢复 ${result.data.cards.length} 张卡片（${new Date(result.updatedAt).toLocaleString('zh-CN')}）`,
      )
    } catch {
      setMsg('拉取失败：请确认已部署到 Cloudflare，并绑定了 MEMORY_KV')
    } finally {
      setBusy(false)
    }
  }

  async function copyCode() {
    if (!syncCode) return
    try {
      await navigator.clipboard.writeText(syncCode)
      setMsg('同步码已复制')
    } catch {
      setMsg('复制失败，请手动选中同步码')
    }
  }

  return (
    <section className="panel">
      <h1 className="page-title">备份与同步</h1>
      <p className="lede">本机可导出 JSON；上云后用同步码在手机/电脑之间恢复。</p>

      <h2 className="section-title">云同步（Cloudflare KV）</h2>
      <p className="hint sync-hint">
        同步码相当于密码：知道码就能读写这份数据。请自行保管，不要发到公开场合。
      </p>
      <label className="sync-label">
        同步码
        <input
          value={syncCode}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="MC-XXXXXXXXXXXX"
          spellCheck={false}
          autoCapitalize="characters"
        />
      </label>
      <div className="cta-row">
        <button type="button" className="btn" onClick={createCode} disabled={busy}>
          生成同步码
        </button>
        <button type="button" className="btn ghost" onClick={() => void copyCode()} disabled={!syncCode || busy}>
          复制
        </button>
        <button type="button" className="btn primary" onClick={() => void upload()} disabled={busy}>
          上传到云
        </button>
        <button type="button" className="btn" onClick={() => void downloadCloud()} disabled={busy}>
          从云恢复
        </button>
      </div>

      <h2 className="section-title">本地文件</h2>
      <div className="cta-row">
        <button type="button" className="btn primary" onClick={download}>
          导出备份
        </button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          导入备份
        </button>
        <button type="button" className="btn danger" onClick={resetSeed}>
          重置示例库
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onFile(f)
          e.target.value = ''
        }}
      />
      {msg ? <p className="hint">{msg}</p> : null}
    </section>
  )
}
