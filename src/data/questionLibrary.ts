/**
 * Interview Question Library — curated, original content.
 *
 * Role-based frequently-asked questions plus a shared Aptitude section.
 * All explanations are written in-house (no third-party content) so the
 * app stays fully offline and compliant.
 */

export interface LibraryQuestion {
  q: string;
  a: string;
  tag: string; // e.g. "Technical", "Behavioral", "Aptitude"
}

export interface LibrarySection {
  category: string;
  icon: string;
  questions: LibraryQuestion[];
}

/** Aptitude — shared across all roles (quant, logical, verbal). */
export const APTITUDE_SECTION: LibrarySection = {
  category: 'Aptitude',
  icon: 'calculator-variant',
  questions: [
    {
      q: 'A train 120 m long passes a pole in 6 s. What is its speed?',
      a: 'Speed = distance / time = 120 / 6 = 20 m/s = 72 km/h.',
      tag: 'Quant',
    },
    {
      q: 'If 5 workers build a wall in 18 days, how long for 9 workers?',
      a: 'Work is constant: 5×18 = 90 worker-days. 90 / 9 = 10 days.',
      tag: 'Quant',
    },
    {
      q: 'Find the next number: 2, 6, 12, 20, 30, ?',
      a: 'Differences are 4,6,8,10 → next diff 12, so 30 + 12 = 42.',
      tag: 'Logical',
    },
    {
      q: 'A is the brother of B. B is the sister of C. How is A related to C?',
      a: 'A is the brother of C (A is male, sibling of C).',
      tag: 'Logical',
    },
    {
      q: 'Choose the word most similar to "Diligent".',
      a: 'Hard-working / industrious. "Diligent" means showing careful, persistent effort.',
      tag: 'Verbal',
    },
    {
      q: 'What is 15% of 240?',
      a: '10% = 24, 5% = 12, so 15% = 36.',
      tag: 'Quant',
    },
  ],
};

/** Role-specific FAQ sections, keyed by role id. */
export const ROLE_QUESTIONS: Record<string, LibrarySection[]> = {
  sde: [
    {
      category: 'Data Structures & Algorithms',
      icon: 'code-braces',
      questions: [
        { q: 'Difference between an array and a linked list?', a: 'Arrays give O(1) random access but costly inserts/deletes; linked lists give O(1) inserts/deletes at known nodes but O(n) access and extra pointer memory.', tag: 'Technical' },
        { q: 'How does a hash map achieve O(1) lookup?', a: 'A hash function maps keys to buckets. With good distribution and load factor, average lookup is O(1); worst case O(n) on collisions (mitigated by chaining/open addressing or trees).', tag: 'Technical' },
        { q: 'Explain time complexity of binary search.', a: 'O(log n) — the search space halves each step. Requires a sorted array.', tag: 'Technical' },
        { q: 'When would you use BFS vs DFS?', a: 'BFS for shortest path in unweighted graphs / level-order; DFS for path existence, topological sort, cycle detection, and lower memory on deep graphs.', tag: 'Technical' },
      ],
    },
    {
      category: 'System Design',
      icon: 'sitemap',
      questions: [
        { q: 'How would you design a URL shortener?', a: 'Hash or base-62 encode an auto-increment ID, store mapping in a DB, add caching for hot URLs, and a redirect service. Discuss collisions, custom aliases, and analytics.', tag: 'Technical' },
        { q: 'What is the difference between SQL and NoSQL?', a: 'SQL: structured schema, strong consistency, joins, good for relational data. NoSQL: flexible schema, horizontal scaling, eventual consistency, good for high-volume/unstructured data.', tag: 'Technical' },
      ],
    },
    {
      category: 'Behavioral',
      icon: 'account-group',
      questions: [
        { q: 'Tell me about a challenging bug you fixed.', a: 'Use STAR: the Situation, the Task, the debugging Actions (logs, bisecting, reproducing), and the measurable Result.', tag: 'Behavioral' },
      ],
    },
  ],
  csa: [
    {
      category: 'Networking & Linux',
      icon: 'lan',
      questions: [
        { q: 'What happens when you type a URL and press enter?', a: 'DNS resolves the domain → TCP handshake → (TLS handshake) → HTTP request → server responds → browser renders. Discuss caching at each layer.', tag: 'Technical' },
        { q: 'Difference between TCP and UDP?', a: 'TCP is connection-oriented, reliable, ordered (handshake, retransmits). UDP is connectionless, faster, no delivery guarantees — good for streaming/DNS.', tag: 'Technical' },
        { q: 'How do you check what is using a port on Linux?', a: 'Use `lsof -i :PORT` or `ss -ltnp` / `netstat -tulpn` to see the process bound to the port.', tag: 'Technical' },
      ],
    },
    {
      category: 'Cloud Troubleshooting',
      icon: 'cloud-cog',
      questions: [
        { q: 'A customer says their instance is unreachable. How do you triage?', a: 'Check instance state, security groups/firewall, network ACLs, route tables, the OS/SSH service, and system logs. Isolate layer by layer.', tag: 'Technical' },
        { q: 'How would you investigate high latency?', a: 'Reproduce, check metrics (CPU, memory, network), trace the request path, look at p95/p99 not averages, and isolate the slow hop.', tag: 'Technical' },
      ],
    },
  ],
  'data-analyst': [
    {
      category: 'SQL',
      icon: 'database',
      questions: [
        { q: 'Difference between WHERE and HAVING?', a: 'WHERE filters rows before grouping; HAVING filters groups after GROUP BY aggregation.', tag: 'Technical' },
        { q: 'What is a window function?', a: 'A function that computes across a set of rows related to the current row (e.g. ROW_NUMBER, RANK, running totals) without collapsing rows like GROUP BY.', tag: 'Technical' },
        { q: 'INNER vs LEFT JOIN?', a: 'INNER returns only matching rows in both tables; LEFT returns all left rows plus matches (NULLs where no match).', tag: 'Technical' },
      ],
    },
    {
      category: 'Statistics',
      icon: 'chart-bell-curve',
      questions: [
        { q: 'What is a p-value?', a: 'The probability of observing results at least as extreme as the data, assuming the null hypothesis is true. Low p-value → evidence against the null.', tag: 'Technical' },
        { q: 'How do you run an A/B test?', a: 'Define metric & hypothesis, randomly split users, ensure sample size/power, run long enough, then test for statistical significance before deciding.', tag: 'Technical' },
      ],
    },
  ],
  frontend: [
    {
      category: 'JavaScript',
      icon: 'language-javascript',
      questions: [
        { q: 'Explain the event loop.', a: 'JS runs on a single thread with a call stack; async callbacks wait in task/microtask queues and run when the stack is empty. Microtasks (promises) run before macrotasks (setTimeout).', tag: 'Technical' },
        { q: 'What is a closure?', a: 'A function that remembers variables from its lexical scope even after the outer function returns — enabling private state and factories.', tag: 'Technical' },
        { q: 'var vs let vs const?', a: 'var is function-scoped and hoisted; let/const are block-scoped. const can\'t be reassigned (but objects stay mutable).', tag: 'Technical' },
      ],
    },
    {
      category: 'React & Performance',
      icon: 'react',
      questions: [
        { q: 'What does the React key prop do?', a: 'It helps React identify which list items changed, were added, or removed — enabling efficient reconciliation. Use stable, unique keys (not array index when reordering).', tag: 'Technical' },
        { q: 'How do you optimize a slow React list?', a: 'Virtualize long lists, memoize with React.memo/useMemo/useCallback, avoid inline objects in props, and key correctly.', tag: 'Technical' },
      ],
    },
  ],
  product: [
    {
      category: 'Product Sense',
      icon: 'lightbulb-on',
      questions: [
        { q: 'How would you improve our app?', a: 'Clarify the goal & user, identify pain points, prioritize by impact vs effort, propose a solution, and define success metrics.', tag: 'Technical' },
        { q: 'How do you prioritize features?', a: 'Frameworks like RICE (Reach, Impact, Confidence, Effort) or value vs effort; tie to company goals and user value.', tag: 'Technical' },
      ],
    },
    {
      category: 'Metrics',
      icon: 'chart-line',
      questions: [
        { q: 'What metric would you track for a messaging app?', a: 'Engagement: DAU/MAU, messages sent per user, retention (D1/D7/D30), and time-to-first-message for new users.', tag: 'Technical' },
      ],
    },
  ],
};

export function getLibraryForRole(roleId: string): LibrarySection[] {
  const roleSections = ROLE_QUESTIONS[roleId] ?? ROLE_QUESTIONS.sde;
  return [...roleSections, APTITUDE_SECTION];
}
