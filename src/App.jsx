import { useMemo, useRef, useState } from 'react'
import {
  DIFFICULTIES,
  LADDER,
  MACHINES,
  MACHINES_CAPTION,
  PATTERNS,
  RESULTS,
  TARGETS,
  WEEKS,
} from './plan'
import {
  autoFlags,
  dayNumber,
  gridCells,
  isOverTarget,
  medianFor,
  nudge,
  objectiveChecked,
  reviewQueue,
  streak,
  targetFor,
  weekForDay,
  weekProgress,
} from './derive'
import { demoState, makeId, newState, normalize, todayISO } from './state'
import { useSync } from './useSync'

export default function App() {
  const sync = useSync()
  const [demo, setDemo] = useState(false)
  const demoSync = useMemo(
    () => ({
      state: demoState(),
      setState: () => {},
      offline: false,
      saveFailed: false,
      configured: false,
      readOnly: true,
      onExitDemo: () => setDemo(false),
    }),
    []
  )

  if (sync.needsSecret && !demo)
    return <Gate onSubmit={sync.submitSecret} onDemo={() => setDemo(true)} />
  if (!sync.state && !demo) return null

  return <Tracker sync={demo ? demoSync : sync} />
}

function Gate({ onSubmit, onDemo }) {
  const [value, setValue] = useState('')
  return (
    <div className="page">
      <form
        className="gate"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(value)
        }}
      >
        <div className="label">enter your sync passphrase</div>
        <div className="stack">
          <input
            className="input"
            type="password"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button className="btn-primary" type="submit" disabled={!value.trim()}>
            Save
          </button>
          <button className="btn-demo" type="button" onClick={onDemo}>
            View read-only demo
          </button>
        </div>
      </form>
    </div>
  )
}

function Tracker({ sync }) {
  const { state, setState } = sync
  const readOnly = !!sync.readOnly
  const today = todayISO()

  const flags = useMemo(() => autoFlags(state), [state])
  const queue = useMemo(() => reviewQueue(state.problems), [state.problems])
  const day = dayNumber(state, today)
  const currentWeek = weekForDay(day)
  const [openWeek, setOpenWeek] = useState(null)
  const open = openWeek ?? currentWeek

  const toggle = (bucket, key) =>
    setState((s) => ({ ...s, [bucket]: { ...s[bucket], [key]: !s[bucket][key] } }))

  const addProblem = (p) => setState((s) => ({ ...s, problems: [...s.problems, p] }))

  const removeProblem = (id) =>
    setState((s) => ({ ...s, problems: s.problems.filter((p) => p.id !== id) }))

  const markReviewed = (id) =>
    setState((s) => ({
      ...s,
      problems: s.problems.map((p) => (p.id === id ? { ...p, reviewed: true } : p)),
    }))

  const bump = (key, delta) =>
    setState((s) => ({ ...s, [key]: Math.max(0, (s[key] || 0) + delta) }))

  const reset = () => {
    if (!window.confirm('Reset everything?')) return
    setState(newState())
    setOpenWeek(null)
  }

  const week = WEEKS[currentWeek - 1]
  const line = nudge(state, today)

  return (
    <div className="page">
      <header className="header">
        <div>
          <div className="label">
            DSA PUSH · 28 DAYS
            {readOnly ? <span className="demo-chip">READ-ONLY DEMO</span> : null}
          </div>
          <div className="daycount">
            <span className="day-big">{String(Math.max(1, day)).padStart(2, '0')}</span>
            <span className="day-total">/ 28</span>
          </div>
          {line ? <div className="nudge">{line}</div> : null}
        </div>
        <div className="week-now">
          Week {currentWeek} — <b>{week.title}</b>
        </div>
      </header>

      <div className="body">
        <div className="col">
          <section className="s-grid">
            <Grid state={state} today={today} />
            <div className="grid-legend">
              {WEEKS.map((w) => (
                <div key={w.key} className="label">
                  {w.short}
                </div>
              ))}
            </div>
            <hr />
          </section>

          <section className="s-stats">
            <Stats state={state} today={today} />
            <hr />
          </section>

          <section className="s-weeks">
            <div className="weeks">
              <div className="label" style={{ marginBottom: 10 }}>
                THE FOUR WEEKS
              </div>
              {WEEKS.map((w) => (
                <WeekCard
                  key={w.key}
                  week={w}
                  state={state}
                  flags={flags}
                  isNow={w.n === currentWeek}
                  isOpen={w.n === open}
                  readOnly={readOnly}
                  onToggleOpen={() => setOpenWeek(w.n === open ? 0 : w.n)}
                  onToggleObjective={(i) => toggle('objectives', `${w.key}:${i}`)}
                />
              ))}
            </div>
          </section>

          <section className="s-lists two-col">
            <div>
              <div className="label">
                SCHEDULING LADDER · {LADDER.filter((_, i) => state.ladder[`lad:${i}`]).length}/
                {LADDER.length}
              </div>
              <div className="checklist">
                {LADDER.map((text, i) => (
                  <CheckRow
                    key={text}
                    text={text}
                    checked={!!state.ladder[`lad:${i}`]}
                    disabled={readOnly}
                    onChange={() => toggle('ladder', `lad:${i}`)}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="label">
                MACHINES · {MACHINES.filter((_, i) => state.machines[`mac:${i}`]).length}/
                {MACHINES.length}
              </div>
              <p className="caption">{MACHINES_CAPTION}</p>
              <div className="checklist">
                {MACHINES.map((text, i) => (
                  <CheckRow
                    key={text}
                    text={text}
                    checked={!!state.machines[`mac:${i}`]}
                    disabled={readOnly}
                    onChange={() => toggle('machines', `mac:${i}`)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="s-log log">
            <div className="label">LOG</div>
            <LogList state={state} onDelete={readOnly ? null : removeProblem} />
          </section>
        </div>

        <div className="col">
          <section className="s-form">
            <div className="label" style={{ marginBottom: 8 }}>
              LOG A PROBLEM
            </div>
            {readOnly ? (
              <div className="card demo-note">
                Sample progress only. Enter your passphrase to log your own work.
              </div>
            ) : (
              <LogForm onLog={addProblem} today={today} />
            )}
          </section>

          <section className="s-queue" style={{ marginTop: 24 }}>
            <div className="label" style={{ marginBottom: 8 }}>
              REVIEW QUEUE · {queue.length}
            </div>
            <div className="card">
              {queue.length === 0 ? (
                <div className="empty">Empty. Missed or over-target problems land here.</div>
              ) : (
                queue.map((p) => (
                  <div className="q-row" key={p.id}>
                    <span className={`dot ${p.result}`} />
                    <span className="q-name">{p.name}</span>
                    <span className="q-reason">
                      {p.result === 'missed'
                        ? 'missed'
                        : `${p.minutes}m > ${targetFor(p.difficulty)}m`}
                    </span>
                    {readOnly ? (
                      <span className="tag">read-only</span>
                    ) : (
                      <button className="btn-small" onClick={() => markReviewed(p.id)}>
                        Re-solved cold
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="s-reps" style={{ marginTop: 24 }}>
            <div className="label">PRESSURE REPS</div>
            <div className="reps">
              <Rep
                value={state.mocks}
                label="human mocks"
                disabled={readOnly}
                onStep={(d) => bump('mocks', d)}
              />
              <Rep
                value={state.contests}
                label="contests"
                disabled={readOnly}
                onStep={(d) => bump('contests', d)}
              />
            </div>
          </section>
        </div>
      </div>

      <Footer sync={sync} state={state} setState={setState} onReset={reset} />
    </div>
  )
}

function Grid({ state, today }) {
  const cells = useMemo(() => gridCells(state, today), [state, today])
  return (
    <div className="grid">
      {cells.map((c) => (
        <div
          key={c.day}
          className={[
            'cell',
            c.level ? `l${c.level}` : c.isPast ? 'past' : '',
            c.isToday ? 'today' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          title={`${c.date} · ${c.count}`}
        />
      ))}
    </div>
  )
}

function Stats({ state, today }) {
  const med = medianFor(state.problems, 'medium')
  const hard = medianFor(state.problems, 'hard')
  return (
    <div className="stats">
      <div className="stat solved">
        <div className="stat-value">{state.problems.length}</div>
        <div className="stat-label">solved total</div>
      </div>
      <div className="stat med-medium">
        <div className="stat-value">
          {med === null ? (
            '—'
          ) : (
            <span className={med <= TARGETS.medium ? 'good' : 'bad'}>{med}</span>
          )}
          <span className="stat-suffix">/{TARGETS.medium}m</span>
        </div>
        <div className="stat-label">median medium</div>
      </div>
      <div className="stat med-hard">
        <div className="stat-value">
          {hard === null ? (
            '—'
          ) : (
            <span className={hard <= TARGETS.hard ? 'good' : 'bad'}>{hard}</span>
          )}
          <span className="stat-suffix">/{TARGETS.hard}m</span>
        </div>
        <div className="stat-label">median hard</div>
      </div>
      <div className="stat streak">
        <div className="stat-value">{streak(state.problems, today)}</div>
        <div className="stat-label">day streak</div>
      </div>
    </div>
  )
}

function WeekCard({
  week,
  state,
  flags,
  isNow,
  isOpen,
  readOnly,
  onToggleOpen,
  onToggleObjective,
}) {
  const { done, total } = weekProgress(state, flags, week)
  return (
    <div className={`week${isOpen ? ' open' : ''}`}>
      <button className="week-head" onClick={onToggleOpen} aria-expanded={isOpen}>
        <span className="week-n">W{week.n}</span>
        <span className="week-title">{week.title}</span>
        {isNow ? <span className="week-chip">NOW</span> : null}
        <span className="week-count">
          {done}/{total}
        </span>
      </button>
      {isOpen ? (
        <>
          <div className="week-bar">
            <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
          <div className="week-body">
            <p className="goal">{week.goal}</p>
            <p className="drill">
              <span className="drill-label">The drill —</span>
              {week.drill}
            </p>
            {week.objectives.map((o, i) => (
              <CheckRow
                key={o.text}
                text={o.text}
                checked={objectiveChecked(state, flags, week, i)}
                auto={!!o.auto}
                disabled={readOnly}
                onChange={() => onToggleObjective(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

function CheckRow({ text, checked, onChange, auto, disabled }) {
  const body = (
    <>
      <input
        type="checkbox"
        checked={checked}
        disabled={auto || disabled}
        readOnly={auto || disabled}
        onChange={auto || disabled ? undefined : onChange}
      />
      <span className={checked ? 'done' : undefined}>{text}</span>
      {auto ? <span className="tag">auto</span> : null}
    </>
  )
  if (auto || disabled) return <div className={`check-row${auto ? ' auto' : ' disabled'}`}>{body}</div>
  return <label className="check-row">{body}</label>
}

function LogForm({ onLog, today }) {
  const [name, setName] = useState('')
  const [minutes, setMinutes] = useState('')
  const [pattern, setPattern] = useState(PATTERNS[0])
  const [difficulty, setDifficulty] = useState('medium')
  const [result, setResult] = useState('clean')
  const [narrated, setNarrated] = useState(false)

  const mins = Number(minutes)
  const valid = name.trim().length > 0 && Number.isFinite(mins) && mins > 0

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onLog({
      id: makeId(),
      date: today,
      name: name.trim(),
      pattern,
      difficulty,
      minutes: mins,
      result,
      narrated,
      reviewed: false,
    })
    setName('')
    setMinutes('')
    setNarrated(false)
  }

  return (
    <form className="card form stack" onSubmit={submit}>
      <div className="row">
        <input
          className="input"
          placeholder="Problem name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input min"
          placeholder="min"
          inputMode="numeric"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ''))}
        />
      </div>

      <select className="input" value={pattern} onChange={(e) => setPattern(e.target.value)}>
        {PATTERNS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <div className="seg">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            type="button"
            className={difficulty === d.id ? 'on' : undefined}
            onClick={() => setDifficulty(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="row result-row">
        <div className="seg">
          {RESULTS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={result === r.id ? 'on' : undefined}
              onClick={() => setResult(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <label className="narrated-box">
          <input
            type="checkbox"
            checked={narrated}
            onChange={(e) => setNarrated(e.target.checked)}
          />
          narrated
        </label>
      </div>

      <button className="btn-primary" type="submit" disabled={!valid}>
        Log it
      </button>
    </form>
  )
}

function Rep({ value, label, onStep, disabled }) {
  return (
    <div className="rep">
      <button
        className="step"
        disabled={disabled}
        onClick={() => onStep(-1)}
        aria-label={`${label} minus one`}
      >
        −
      </button>
      <span className="rep-count">{value}/4</span>
      <button
        className="step"
        disabled={disabled}
        onClick={() => onStep(1)}
        aria-label={`${label} plus one`}
      >
        +
      </button>
      <span className="rep-label">{label}</span>
    </div>
  )
}

function LogList({ state, onDelete }) {
  const groups = useMemo(() => {
    const byDate = new Map()
    for (const p of state.problems) {
      if (!byDate.has(p.date)) byDate.set(p.date, [])
      byDate.get(p.date).push(p)
    }
    return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [state.problems])

  if (!groups.length) return <div className="empty">No problems logged yet.</div>

  return (
    <>
      {groups.map(([date, items]) => (
        <div key={date}>
          <div className="log-day">
            {date} · day {String(dayNumber(state, date)).padStart(2, '0')}
          </div>
          {items.map((p) => {
            const target = targetFor(p.difficulty)
            const over = isOverTarget(p)
            const span = target * 1.5
            const okWidth = Math.min(p.minutes, target) / span
            const overWidth = Math.max(0, Math.min(p.minutes, span) - target) / span
            return (
              <div className="log-row" key={p.id}>
                <span className={`dot ${p.result}`} />
                <span className={`log-name${p.result === 'missed' ? ' done' : ''}`}>{p.name}</span>
                <span className="log-tags">
                  {p.narrated ? <span className="tag">narrated</span> : null}
                  <span className="tag">{p.pattern}</span>
                </span>
                <span className="bar">
                  <i className="ok" style={{ width: `${okWidth * 100}%` }} />
                  <i className="over" style={{ width: `${overWidth * 100}%` }} />
                </span>
                <span className={`log-min${over ? ' bad' : ''}`}>{p.minutes}m</span>
                {onDelete ? (
                  <button className="del" onClick={() => onDelete(p.id)} aria-label="delete">
                    ×
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}

function Footer({ sync, state, setState, onReset }) {
  const fileRef = useRef(null)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dsa-tracker-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        setState(normalize(JSON.parse(String(reader.result))))
      } catch {
        window.alert('That file is not valid tracker JSON.')
      }
    }
    reader.readAsText(file)
  }

  const note = sync.saveFailed
    ? 'save failed — retrying'
    : sync.offline
      ? 'offline — will sync'
      : ''

  return (
    <div className="footer s-footer">
      {note ? <span className={`note${sync.saveFailed ? ' warn' : ''}`}>{note}</span> : null}
      <div className="footer-links">
        {sync.readOnly ? (
          <button className="linkish" onClick={sync.onExitDemo}>
            Use private tracker
          </button>
        ) : null}
        <button className="linkish" onClick={exportJson}>
          Export JSON
        </button>
        {!sync.readOnly ? (
          <>
            <button className="linkish" onClick={() => fileRef.current?.click()}>
              Import JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importJson(f)
                e.target.value = ''
              }}
            />
            <button className="linkish" onClick={onReset}>
              Reset everything
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
