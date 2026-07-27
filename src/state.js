export const CACHE_KEY = 'dsa-tracker-cache'
export const SECRET_KEY = 'dsa-tracker-secret'

export function todayISO(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso, n) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return todayISO(d)
}

export function daysBetween(fromISO, toISO) {
  const a = parseISO(fromISO)
  const b = parseISO(toISO)
  return Math.round((b - a) / 86400000)
}

export function newState() {
  return {
    startDate: todayISO(),
    problems: [],
    ladder: {},
    machines: {},
    objectives: {},
    mocks: 0,
    contests: 0,
  }
}

// Fills in anything a stored blob is missing, so an older or partial row still loads.
export function normalize(raw) {
  const base = newState()
  if (!raw || typeof raw !== 'object') return base
  return {
    startDate: typeof raw.startDate === 'string' ? raw.startDate : base.startDate,
    problems: Array.isArray(raw.problems) ? raw.problems : [],
    ladder: raw.ladder && typeof raw.ladder === 'object' ? raw.ladder : {},
    machines: raw.machines && typeof raw.machines === 'object' ? raw.machines : {},
    objectives: raw.objectives && typeof raw.objectives === 'object' ? raw.objectives : {},
    mocks: Number.isFinite(raw.mocks) ? raw.mocks : 0,
    contests: Number.isFinite(raw.contests) ? raw.contests : 0,
  }
}

export function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? normalize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function writeCache(state) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked — the row is still the source of truth */
  }
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
