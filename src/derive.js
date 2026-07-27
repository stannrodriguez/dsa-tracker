import { LADDER, TARGETS, WEEKS } from './plan'
import { addDays, daysBetween, todayISO } from './state'

export function targetFor(difficulty) {
  return TARGETS[difficulty] ?? TARGETS.medium
}

export function isOverTarget(p) {
  return p.minutes > targetFor(p.difficulty)
}

export function dayNumber(state, iso = todayISO()) {
  return daysBetween(state.startDate, iso) + 1
}

export function weekForDay(day) {
  return Math.min(4, Math.max(1, Math.ceil(day / 7)))
}

export function sortedProblems(problems) {
  return [...problems].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

export function reviewQueue(problems) {
  return sortedProblems(problems).filter(
    (p) => !p.reviewed && (p.result === 'missed' || isOverTarget(p))
  )
}

export function median(nums) {
  if (!nums.length) return null
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

export function medianFor(problems, difficulty) {
  const recent = sortedProblems(problems)
    .filter((p) => p.difficulty === difficulty && p.result !== 'missed')
    .slice(-10)
  return median(recent.map((p) => p.minutes))
}

export function countsByDate(problems) {
  const map = {}
  for (const p of problems) map[p.date] = (map[p.date] || 0) + 1
  return map
}

export function streak(problems, today = todayISO()) {
  const counts = countsByDate(problems)
  let cursor = counts[today] ? today : addDays(today, -1)
  let n = 0
  while (counts[cursor]) {
    n += 1
    cursor = addDays(cursor, -1)
  }
  return n
}

export function autoFlags(state) {
  const queue = reviewQueue(state.problems)
  const ladderAll = LADDER.every((_, i) => state.ladder[`lad:${i}`])
  return {
    mocks1: state.mocks >= 1,
    mocks2: state.mocks >= 2,
    mocks4: state.mocks >= 4,
    contests4: state.contests >= 4,
    ladderAll,
    queueZero: queue.length === 0 && state.problems.length > 0,
  }
}

export function objectiveChecked(state, flags, week, index) {
  const obj = WEEKS.find((w) => w.key === week.key).objectives[index]
  if (obj.auto) return !!flags[obj.auto]
  return !!state.objectives[`${week.key}:${index}`]
}

export function weekProgress(state, flags, week) {
  const done = week.objectives.filter((_, i) => objectiveChecked(state, flags, week, i)).length
  return { done, total: week.objectives.length }
}

export function nudge(state, today = todayISO()) {
  const day = dayNumber(state, today)
  const loggedToday = state.problems.filter((p) => p.date === today).length
  const queue = reviewQueue(state.problems)
  const mMed = medianFor(state.problems, 'medium')
  const hMed = medianFor(state.problems, 'hard')

  if (day >= 28) return '28 days done.'
  if (loggedToday === 0) return '0 logged today.'
  if (queue.length >= 3) return `${queue.length} in the review queue.`
  if (mMed !== null && hMed !== null && mMed <= TARGETS.medium && hMed <= TARGETS.hard)
    return `Medians ${mMed}/15 and ${hMed}/40. Both under.`
  if (loggedToday >= 4) return `${loggedToday} logged today.`
  const s = streak(state.problems, today)
  if (s >= 3) return `${s}-day streak.`
  return ''
}

// 28 cells, one per day since startDate. Row = week.
export function gridCells(state, today = todayISO()) {
  const counts = countsByDate(state.problems)
  const currentDay = dayNumber(state, today)
  return Array.from({ length: 28 }, (_, i) => {
    const date = addDays(state.startDate, i)
    const n = counts[date] || 0
    const level = n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : 3
    return { day: i + 1, date, count: n, level, isToday: i + 1 === currentDay, isPast: i + 1 < currentDay }
  })
}
