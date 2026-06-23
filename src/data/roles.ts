/**
 * Role-based interview preparation data.
 *
 * Each role defines its focus areas, a staged preparation roadmap, and
 * the question tags used to specialise practice sessions.
 */

export interface FocusArea {
  label: string;
  weight: number; // relative importance 0-100 (drives roadmap + analytics)
}

export interface RoadmapStage {
  title: string;
  description: string;
  skills: string[];
}

export interface PrepRole {
  id: string;
  title: string;
  short: string;
  tagline: string;
  icon: string;
  color: string;
  focusAreas: FocusArea[];
  roadmap: RoadmapStage[];
  /** Tags used to pull specialised questions from the question bank. */
  questionTags: string[];
  keywords: string[];
}

export const ROLES: PrepRole[] = [
  {
    id: 'sde',
    title: 'Software Development Engineer',
    short: 'SDE',
    tagline: 'Coding, data structures & system design',
    icon: 'code-braces',
    color: '#6C5CE7',
    focusAreas: [
      { label: 'Data Structures & Algorithms', weight: 90 },
      { label: 'System Design', weight: 75 },
      { label: 'Coding Fluency', weight: 85 },
      { label: 'Behavioral (Leadership)', weight: 60 },
    ],
    roadmap: [
      { title: 'Foundations', description: 'Arrays, strings, hashing, two pointers', skills: ['Arrays', 'Hashing', 'Big-O'] },
      { title: 'Core DSA', description: 'Trees, graphs, recursion, DP basics', skills: ['Trees', 'Graphs', 'Recursion'] },
      { title: 'System Design', description: 'Scaling, caching, databases, APIs', skills: ['Caching', 'Sharding', 'Load balancing'] },
      { title: 'Behavioral & Mock', description: 'STAR stories + full mock loops', skills: ['STAR', 'Ownership', 'Conflict'] },
    ],
    questionTags: ['system-design', 'debugging', 'projects', 'learning'],
    keywords: ['algorithm', 'data structure', 'complexity', 'scalability'],
  },
  {
    id: 'csa',
    title: 'Cloud Support Associate',
    short: 'CSA',
    tagline: 'Troubleshooting, networking & cloud ops',
    icon: 'cloud-cog',
    color: '#0984E3',
    focusAreas: [
      { label: 'Networking & Linux', weight: 85 },
      { label: 'Troubleshooting', weight: 90 },
      { label: 'Cloud Fundamentals', weight: 80 },
      { label: 'Customer Communication', weight: 70 },
    ],
    roadmap: [
      { title: 'OS & Networking', description: 'Linux, DNS, TCP/IP, HTTP', skills: ['Linux', 'DNS', 'TCP/IP'] },
      { title: 'Cloud Basics', description: 'Compute, storage, IAM, VPC', skills: ['EC2', 'S3', 'IAM'] },
      { title: 'Troubleshooting', description: 'Root-cause analysis, logs, latency', skills: ['Logs', 'RCA', 'Latency'] },
      { title: 'Customer Scenarios', description: 'Explain fixes clearly & empathetically', skills: ['Empathy', 'Clarity'] },
    ],
    questionTags: ['debugging', 'case', 'learning'],
    keywords: ['network', 'cloud', 'linux', 'latency', 'troubleshoot'],
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    short: 'Data Analyst',
    tagline: 'SQL, statistics & data storytelling',
    icon: 'chart-box',
    color: '#00B894',
    focusAreas: [
      { label: 'SQL & Querying', weight: 90 },
      { label: 'Statistics', weight: 75 },
      { label: 'Data Visualization', weight: 70 },
      { label: 'Business Sense', weight: 80 },
    ],
    roadmap: [
      { title: 'SQL Mastery', description: 'Joins, window functions, aggregation', skills: ['Joins', 'Window fns', 'CTEs'] },
      { title: 'Statistics', description: 'Distributions, A/B testing, significance', skills: ['A/B tests', 'p-values'] },
      { title: 'Visualization', description: 'Dashboards & clear charts', skills: ['Charts', 'Dashboards'] },
      { title: 'Case Studies', description: 'Turn data into recommendations', skills: ['Insights', 'Storytelling'] },
    ],
    questionTags: ['analysis', 'case', 'market-sizing'],
    keywords: ['sql', 'data', 'metric', 'analysis', 'dashboard'],
  },
  {
    id: 'frontend',
    title: 'Frontend Engineer',
    short: 'Frontend',
    tagline: 'UI, JavaScript & web performance',
    icon: 'language-html5',
    color: '#FD79A8',
    focusAreas: [
      { label: 'JavaScript & TypeScript', weight: 90 },
      { label: 'React / UI', weight: 85 },
      { label: 'Web Performance', weight: 70 },
      { label: 'Accessibility', weight: 60 },
    ],
    roadmap: [
      { title: 'JS Core', description: 'Closures, async, event loop', skills: ['Closures', 'Promises'] },
      { title: 'UI Frameworks', description: 'React, state, rendering', skills: ['React', 'State', 'Hooks'] },
      { title: 'Performance', description: 'Bundle size, rendering, caching', skills: ['Lazy load', 'Memo'] },
      { title: 'System & Mock', description: 'Frontend system design + mocks', skills: ['Design systems'] },
    ],
    questionTags: ['projects', 'system-design', 'learning'],
    keywords: ['javascript', 'react', 'css', 'performance', 'dom'],
  },
  {
    id: 'product',
    title: 'Product Manager',
    short: 'PM',
    tagline: 'Product sense, strategy & metrics',
    icon: 'lightbulb-group',
    color: '#FDCB6E',
    focusAreas: [
      { label: 'Product Sense', weight: 90 },
      { label: 'Analytical / Metrics', weight: 80 },
      { label: 'Strategy', weight: 75 },
      { label: 'Stakeholder Comms', weight: 80 },
    ],
    roadmap: [
      { title: 'Product Sense', description: 'User problems, prioritization', skills: ['Personas', 'Prioritization'] },
      { title: 'Metrics', description: 'Define & track success metrics', skills: ['KPIs', 'Funnels'] },
      { title: 'Strategy', description: 'Market, competition, roadmap', skills: ['GTM', 'Roadmap'] },
      { title: 'Behavioral & Mock', description: 'Influence & leadership stories', skills: ['Influence', 'STAR'] },
    ],
    questionTags: ['influence', 'case', 'market-sizing', 'goals'],
    keywords: ['product', 'metric', 'user', 'strategy', 'roadmap'],
  },
];

export function getRoleById(id: string | null | undefined): PrepRole {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}
