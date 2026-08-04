import { useRef, useState } from 'react'
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
    if (!confirm('将清空当前数据，并重新载入百分比正反示例卡，确定？')) return
    onReplace({ version: 1, cards: seedPercentCards(), logs: [] })
    setMsg('已重置为百分比正反示例库')
  }

  return (
    <section className="panel">
      <h1 className="page-title">备份与恢复</h1>
      <p className="lede">数据存在本机浏览器。换电脑或清缓存前，请先导出 JSON。</p>

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
