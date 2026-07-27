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

export function demoState() {
  const today = todayISO()
  const problem = (daysAgo, id, name, pattern, difficulty, minutes, result, extra = {}) => ({
    id,
    date: addDays(today, -daysAgo),
    name,
    pattern,
    difficulty,
    minutes,
    result,
    narrated: false,
    reviewed: false,
    ...extra,
  })

  return {
    startDate: addDays(today, -8),
    problems: [
      problem(7, 'demo-two-sum', 'Two Sum', 'other', 'easy', 6, 'clean', {
        narrated: true,
      }),
      problem(6, 'demo-course-schedule', 'Course Schedule', 'topo sort', 'medium', 16, 'rough', {
        reviewed: true,
      }),
      problem(4, 'demo-islands', 'Number of Islands', 'graphs', 'medium', 11, 'clean', {
        narrated: true,
      }),
      problem(3, 'demo-lis', 'Longest Increasing Subsequence', 'DP', 'medium', 14, 'clean'),
      problem(2, 'demo-partition', 'Partition to K Equal Sum Subsets', 'backtracking', 'hard', 37, 'missed'),
      problem(1, 'demo-coin-change', 'Coin Change', 'DP', 'medium', 18, 'rough'),
      problem(0, 'demo-tree-view', 'Binary Tree Right Side View', 'graphs', 'medium', 12, 'clean', {
        narrated: true,
      }),
      problem(0, 'demo-word-ladder', 'Word Ladder', 'graphs', 'hard', 52, 'rough'),
    ],
    ladder: { 'lad:0': true, 'lad:1': true, 'lad:2': true },
    machines: { 'mac:0': true, 'mac:1': true },
    objectives: {
      'w1:0': true,
      'w1:1': true,
      'w1:2': true,
      'w1:3': true,
      'w1:4': true,
      'w2:0': true,
    },
    mocks: 1,
    contests: 1,
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
