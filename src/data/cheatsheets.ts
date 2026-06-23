/**
 * Role-based cheatsheets — curated, original quick-reference content.
 * No third-party content; safe to ship offline.
 */

export interface CheatItem {
  term: string;
  detail: string;
}

export interface CheatSection {
  title: string;
  icon: string;
  items: CheatItem[];
}

export const ROLE_CHEATSHEETS: Record<string, CheatSection[]> = {
  sde: [
    {
      title: 'Big-O Complexity',
      icon: 'speedometer',
      items: [
        { term: 'O(1)', detail: 'Constant — hash lookup, array index' },
        { term: 'O(log n)', detail: 'Binary search, balanced tree ops' },
        { term: 'O(n)', detail: 'Single loop, linear scan' },
        { term: 'O(n log n)', detail: 'Merge/quick sort, heap-based sorts' },
        { term: 'O(n²)', detail: 'Nested loops, bubble/insertion sort' },
      ],
    },
    {
      title: 'DSA Patterns',
      icon: 'puzzle',
      items: [
        { term: 'Two Pointers', detail: 'Sorted array pairs, palindrome checks' },
        { term: 'Sliding Window', detail: 'Subarray/substring with a constraint' },
        { term: 'BFS / DFS', detail: 'Graph/tree traversal, shortest path' },
        { term: 'Dynamic Programming', detail: 'Overlapping subproblems + memoization' },
        { term: 'Binary Search', detail: 'Monotonic search space' },
      ],
    },
  ],
  csa: [
    {
      title: 'Linux Commands',
      icon: 'console',
      items: [
        { term: 'top / htop', detail: 'Live CPU & memory usage' },
        { term: 'df -h / du -sh', detail: 'Disk space / directory size' },
        { term: 'ss -ltnp', detail: 'Listening ports + owning process' },
        { term: 'journalctl -u svc', detail: 'Service logs (systemd)' },
        { term: 'grep -r "x" .', detail: 'Recursive text search' },
      ],
    },
    {
      title: 'Networking Basics',
      icon: 'lan',
      items: [
        { term: 'DNS', detail: 'Resolves domain → IP' },
        { term: 'TCP', detail: 'Reliable, ordered, connection-based' },
        { term: 'UDP', detail: 'Fast, connectionless, no guarantees' },
        { term: 'HTTP 4xx / 5xx', detail: 'Client error / server error' },
        { term: 'Subnet / CIDR', detail: '/24 = 256 addresses' },
      ],
    },
  ],
  'data-analyst': [
    {
      title: 'SQL Quick Reference',
      icon: 'database',
      items: [
        { term: 'GROUP BY', detail: 'Aggregate rows into groups' },
        { term: 'HAVING', detail: 'Filter groups after aggregation' },
        { term: 'WINDOW (OVER)', detail: 'Running totals, rankings' },
        { term: 'CTE (WITH)', detail: 'Named subquery for readability' },
        { term: 'JOIN types', detail: 'INNER, LEFT, RIGHT, FULL' },
      ],
    },
    {
      title: 'Statistics',
      icon: 'chart-bell-curve',
      items: [
        { term: 'Mean vs Median', detail: 'Median resists outliers' },
        { term: 'p-value < 0.05', detail: 'Common significance threshold' },
        { term: 'Correlation ≠ causation', detail: 'Always check confounders' },
        { term: 'A/B testing', detail: 'Randomize, power, then test' },
      ],
    },
  ],
  frontend: [
    {
      title: 'JavaScript Essentials',
      icon: 'language-javascript',
      items: [
        { term: 'Closure', detail: 'Function + remembered scope' },
        { term: 'Promise / async', detail: 'Handle async without callbacks' },
        { term: 'Event loop', detail: 'Microtasks before macrotasks' },
        { term: '=== vs ==', detail: 'Strict avoids type coercion' },
        { term: 'map/filter/reduce', detail: 'Declarative array transforms' },
      ],
    },
    {
      title: 'React Tips',
      icon: 'react',
      items: [
        { term: 'Keys', detail: 'Stable & unique for list diffing' },
        { term: 'useMemo / useCallback', detail: 'Memoize expensive values/fns' },
        { term: 'Lifting state', detail: 'Share state via common parent' },
        { term: 'Virtualization', detail: 'Render only visible list items' },
      ],
    },
  ],
  product: [
    {
      title: 'PM Frameworks',
      icon: 'lightbulb-on',
      items: [
        { term: 'RICE', detail: 'Reach × Impact × Confidence / Effort' },
        { term: 'AARRR', detail: 'Acquisition→Activation→Retention→Referral→Revenue' },
        { term: 'MoSCoW', detail: 'Must / Should / Could / Won\'t' },
        { term: 'North Star', detail: 'One metric capturing core value' },
      ],
    },
    {
      title: 'Key Metrics',
      icon: 'chart-line',
      items: [
        { term: 'DAU / MAU', detail: 'Stickiness ratio' },
        { term: 'Retention', detail: 'D1 / D7 / D30 cohorts' },
        { term: 'Funnel', detail: 'Conversion at each step' },
        { term: 'Churn', detail: '% users lost per period' },
      ],
    },
  ],
};

export function getCheatsheetsForRole(roleId: string): CheatSection[] {
  return ROLE_CHEATSHEETS[roleId] ?? ROLE_CHEATSHEETS.sde;
}
