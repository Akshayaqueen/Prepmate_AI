/**
 * Daily Challenge — a rotating developer-focused interview prompt.
 * Targeted at students preparing for software engineering interviews.
 */

export interface DailyChallenge {
  category: string;
  prompt: string;
  icon: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const DAILY_CHALLENGES: DailyChallenge[] = [
  { category: 'System Design', prompt: 'Design a rate limiter for a public API. Walk through your data structures and trade-offs.', icon: 'sitemap', difficulty: 'Hard' },
  { category: 'Behavioral', prompt: 'Describe a bug you spent days chasing. How did you finally crack it?', icon: 'bug', difficulty: 'Medium' },
  { category: 'Data Structures', prompt: 'When would you choose a hash map over a balanced tree? Give a real example.', icon: 'graph', difficulty: 'Easy' },
  { category: 'Behavioral', prompt: 'Tell me about a time you disagreed with a senior engineer’s technical decision.', icon: 'account-group', difficulty: 'Medium' },
  { category: 'Coding', prompt: 'Explain how you would detect a cycle in a linked list, then optimize for space.', icon: 'code-braces', difficulty: 'Medium' },
  { category: 'System Design', prompt: 'How would you scale a notification service to 10M users?', icon: 'bell-ring', difficulty: 'Hard' },
  { category: 'Behavioral', prompt: 'Share a project you shipped end to end. What was your specific contribution?', icon: 'rocket-launch', difficulty: 'Easy' },
];

export function getChallengeOfTheDay(): DailyChallenge {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
}

/** Color for a difficulty chip (LeetCode-style). */
export function difficultyColor(d: DailyChallenge['difficulty']): string {
  switch (d) {
    case 'Easy':
      return '#00B894';
    case 'Medium':
      return '#FDCB6E';
    case 'Hard':
      return '#FF6B6B';
  }
}
