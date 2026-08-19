import { useEffect, useState } from 'react'
import Dashboard from './components/Dashboard'
import History from './components/History'
import NewFillUp from './components/NewFillUp'
import { getAllFillUps, exportAsCsv } from './storage'
import { preloadOcr } from './ocr'
import type { FillUp } from './types'

type Tab = 'dashboard' | 'new' | 'history'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [fillUps, setFillUps] = useState<FillUp[]>(() => getAllFillUps())

  useEffect(() => {
    preloadOcr()
  }, [])

  function refresh() {
    setFillUps(getAllFillUps())
  }

  function handleExport() {
    const csv = exportAsCsv()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gas-fillups-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>⛽ Gas Tracker</h1>
        {tab !== 'new' && fillUps.length > 0 && (
          <button className="btn-link" onClick={handleExport}>
            Export CSV
          </button>
        )}
      </header>

      <main className="app-main">
        {tab === 'dashboard' && <Dashboard fillUps={fillUps} />}
        {tab === 'history' && <History fillUps={fillUps} onChange={refresh} />}
        {tab === 'new' && (
          <NewFillUp
            onDone={() => {
              refresh()
              setTab('dashboard')
            }}
          />
        )}
      </main>

      <nav className="bottom-nav">
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>
          📊<span>Dashboard</span>
        </button>
        <button className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>
          ➕<span>New Fill-Up</span>
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          📋<span>History</span>
        </button>
      </nav>
    </div>
  )
}
