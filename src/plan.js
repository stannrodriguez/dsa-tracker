const DRILL_TAIL =
  'Every solve: narrate out loud, state time/space complexity, dry-run one example before calling it done.'

export const TARGETS = { easy: 8, medium: 15, hard: 40 }

export const DIFFICULTIES = [
  { id: 'easy', label: 'easy · 8m' },
  { id: 'medium', label: 'medium · 15m' },
  { id: 'hard', label: 'hard · 40m' },
]

export const RESULTS = [
  { id: 'clean', label: 'clean' },
  { id: 'rough', label: 'rough' },
  { id: 'missed', label: 'missed' },
]

export const PATTERNS = [
  'backtracking',
  'DP',
  'bitmask DP',
  'greedy',
  'graphs',
  'intervals',
  'heap',
  'binary search',
  'sliding window',
  'union-find',
  'topo sort',
  'other',
]

export const WEEKS = [
  {
    n: 1,
    key: 'w1',
    title: 'Fluency',
    short: 'W1 FLUENCY',
    goal: 'Implement the core algorithms from memory, fast.',
    drill:
      'No references. Each one in under 8 min, then a medium that uses it in under 15. If over, repeat the same problem tomorrow. ' +
      DRILL_TAIL,
    objectives: [
      { text: 'Backtracking template, with pruning' },
      { text: 'DFS + BFS' },
      { text: 'Binary search on answer' },
      { text: 'Heap: top-k + two-heap median' },
      { text: 'Union-find, path compression' },
      { text: 'Topological sort' },
      { text: 'Sliding window' },
      { text: 'Monotonic stack: Daily Temperatures, Largest Rectangle in Histogram' },
      { text: 'Recursion → memo → tabulation, one problem all three ways' },
    ],
  },
  {
    n: 2,
    key: 'w2',
    title: 'DP deep',
    short: 'W2 DP',
    goal: 'Write recurrences from scratch. Priority: bitmask DP.',
    drill:
      "One sub-family per 1-2 days. End each day re-deriving that day's recurrence from a blank page. " +
      DRILL_TAIL,
    objectives: [
      { text: '1D: House Robber, Coin Change, LIS' },
      { text: 'Grid: Unique Paths II, Min Path Sum, Edit Distance' },
      { text: 'Bitmask: Partition to K Equal Subsets, TSP' },
      { text: 'State compression: Cherry Pickup II' },
      { text: 'Re-derive 3 recurrences cold' },
      { text: 'Mystery set: 1-2 unlabeled problems daily' },
      { text: 'First human mock', auto: 'mocks1' },
      { text: 'Record one session and listen back' },
      { text: 'One vague-prompt session: extract requirements first' },
    ],
  },
  {
    n: 3,
    key: 'w3',
    title: 'Greedy · graphs · scheduling',
    short: 'W3 GREEDY',
    goal: 'Greedy proofs, weighted graphs, the scheduling ladder.',
    drill:
      'Before coding any greedy, say why the exchange argument holds. Finish the ladder this week. ' +
      DRILL_TAIL,
    objectives: [
      { text: 'Exchange greedy ×3: Jump Game II, Gas Station, Candy' },
      { text: 'Intervals: Merge, Non-overlapping, Meeting Rooms II' },
      { text: 'Dijkstra ×2: Network Delay, Min Effort Path' },
      { text: 'Trie: one session — Implement Trie, Word Search II' },
      { text: 'Min-cost matching, recognition only' },
      { text: 'Scheduling ladder — all 8 rungs', auto: 'ladderAll' },
      { text: 'Second human mock', auto: 'mocks2' },
      { text: 'Two 45-min timed blocks' },
      { text: 'Mystery set: 1-2 unlabeled problems daily' },
      { text: 'Record one session and listen back' },
      { text: 'One vague-prompt session: extract requirements first' },
    ],
  },
  {
    n: 4,
    key: 'w4',
    title: 'Simulation',
    short: 'W4 SIMULATION',
    goal: 'All practice timed. 45-min blocks.',
    drill:
      'No pausing the clock. Talk out loud. Each problem: brute force first, state complexity, then optimize. ' +
      DRILL_TAIL,
    objectives: [
      { text: 'Mocks three and four', auto: 'mocks4' },
      { text: 'Four contests', auto: 'contests4' },
      { text: 'Brute-force → optimize ×5' },
      { text: 'Review queue at zero', auto: 'queueZero' },
      { text: 'Schedule generator, both parts, narrated, under 40 min' },
      { text: 'Mystery set: 1-2 unlabeled problems daily' },
      { text: 'Record one session and listen back' },
      { text: 'One vague-prompt session: extract requirements first' },
    ],
  },
]

export const LADDER = [
  'Schedule generator — part 1: all valid schedules',
  'Schedule generator — part 2: optimize for cost',
  'Meeting Rooms II',
  'Task Scheduler',
  'Partition to K Equal Sum Subsets',
  'Employee Free Time',
  'Course Schedule III',
  'Both parts, narrated, under 40 minutes',
]

export const MACHINES = [
  'LRU cache',
  'Rate limiter',
  'In-memory KV store with TTL',
  'Job scheduler',
  'Schedule generator',
]

export const MACHINES_CAPTION = 'One per week. 45 min, working API, narrated.'
