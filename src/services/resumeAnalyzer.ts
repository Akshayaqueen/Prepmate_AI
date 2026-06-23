/**
 * Resume Analyzer — pure, offline heuristic analysis of resume text.
 *
 * Scores a pasted resume across five dimensions and returns actionable
 * feedback. No backend or AI required — works fully in demo mode.
 */

export interface ResumeCheck {
  id: string;
  label: string;
  score: number; // 0-100 for this dimension
  status: 'good' | 'warn' | 'bad';
  detail: string;
}

export interface ResumeAnalysis {
  overallScore: number; // 0-100
  wordCount: number;
  checks: ResumeCheck[];
  strengths: string[];
  improvements: string[];
  foundActionVerbs: string[];
  missingSections: string[];
}

const STRONG_ACTION_VERBS = [
  'led', 'built', 'designed', 'implemented', 'developed', 'launched', 'created',
  'optimized', 'improved', 'increased', 'reduced', 'automated', 'architected',
  'shipped', 'delivered', 'managed', 'mentored', 'spearheaded', 'engineered',
  'scaled', 'migrated', 'refactored', 'analyzed', 'drove', 'owned',
];

const WEAK_PHRASES = [
  'responsible for', 'worked on', 'helped with', 'involved in', 'duties included',
  'assisted with', 'participated in',
];

const EXPECTED_SECTIONS = ['experience', 'education', 'skills', 'projects'];

const TECH_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'react', 'node', 'sql',
  'aws', 'docker', 'kubernetes', 'git', 'api', 'database', 'algorithm',
  'data structure', 'machine learning', 'cloud', 'agile', 'rest', 'graphql',
];

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function statusFor(score: number): 'good' | 'warn' | 'bad' {
  if (score >= 70) return 'good';
  if (score >= 40) return 'warn';
  return 'bad';
}

export function analyzeResume(text: string): ResumeAnalysis {
  const lower = text.toLowerCase();
  const words = text.trim().length === 0 ? [] : text.trim().split(/\s+/);
  const wordCount = words.length;

  // 1. Length — ideal 350–800 words
  let lengthScore: number;
  if (wordCount === 0) lengthScore = 0;
  else if (wordCount < 150) lengthScore = 30;
  else if (wordCount < 350) lengthScore = 60;
  else if (wordCount <= 800) lengthScore = 100;
  else if (wordCount <= 1100) lengthScore = 70;
  else lengthScore = 45;

  // 2. Action verbs
  const foundActionVerbs = STRONG_ACTION_VERBS.filter((v) =>
    new RegExp(`\\b${v}\\b`, 'i').test(lower)
  );
  const actionScore = clamp((foundActionVerbs.length / 8) * 100);

  // 3. Quantified impact — count numbers / %, $, x
  const numberMatches = text.match(/\b\d+([.,]\d+)?\s*(%|percent|x|\$|k|m|million|billion)?/gi) || [];
  const quantifiers = numberMatches.filter((m) => /[%$x]|percent|million|billion|\dk|\dm|\d{2,}/i.test(m));
  const quantScore = clamp((quantifiers.length / 6) * 100);

  // 4. Weak phrases (inverse — fewer is better)
  const weakHits = WEAK_PHRASES.reduce(
    (acc, p) => acc + (lower.split(p).length - 1),
    0
  );
  const weakScore = clamp(100 - weakHits * 25);

  // 5. Sections present
  const missingSections = EXPECTED_SECTIONS.filter((s) => !lower.includes(s));
  const sectionScore = clamp(
    ((EXPECTED_SECTIONS.length - missingSections.length) / EXPECTED_SECTIONS.length) * 100
  );

  // 6. Keyword coverage (used in feedback, lightly weighted into action)
  const foundKeywords = TECH_KEYWORDS.filter((k) => lower.includes(k));

  const checks: ResumeCheck[] = [
    {
      id: 'length',
      label: 'Length',
      score: lengthScore,
      status: statusFor(lengthScore),
      detail:
        wordCount === 0
          ? 'No content yet.'
          : `${wordCount} words. Aim for 350–800 for a one-page resume.`,
    },
    {
      id: 'verbs',
      label: 'Action Verbs',
      score: actionScore,
      status: statusFor(actionScore),
      detail: foundActionVerbs.length
        ? `Strong verbs found: ${foundActionVerbs.slice(0, 6).join(', ')}.`
        : 'Start bullets with strong verbs like "built", "led", "optimized".',
    },
    {
      id: 'quantified',
      label: 'Quantified Impact',
      score: quantScore,
      status: statusFor(quantScore),
      detail: quantifiers.length
        ? `${quantifiers.length} quantified results detected. Great!`
        : 'Add numbers: "cut load time by 40%", "served 10k users".',
    },
    {
      id: 'weak',
      label: 'Concise Phrasing',
      score: weakScore,
      status: statusFor(weakScore),
      detail: weakHits
        ? `Avoid weak phrases (found ${weakHits}, e.g. "responsible for").`
        : 'No weak filler phrases detected. Crisp writing!',
    },
    {
      id: 'sections',
      label: 'Sections',
      score: sectionScore,
      status: statusFor(sectionScore),
      detail: missingSections.length
        ? `Missing: ${missingSections.join(', ')}.`
        : 'All key sections present (experience, education, skills, projects).',
    },
  ];

  const overallScore = clamp(
    lengthScore * 0.15 +
      actionScore * 0.25 +
      quantScore * 0.3 +
      weakScore * 0.15 +
      sectionScore * 0.15
  );

  const strengths: string[] = [];
  if (actionScore >= 70) strengths.push('Strong, varied action verbs');
  if (quantScore >= 70) strengths.push('Impact is well quantified');
  if (sectionScore >= 100) strengths.push('Complete, well-structured sections');
  if (weakScore >= 80) strengths.push('Concise, confident phrasing');
  if (foundKeywords.length >= 5) strengths.push(`Good keyword coverage (${foundKeywords.length} tech terms)`);
  if (strengths.length === 0) strengths.push('A solid starting point to build on');

  const improvements: string[] = [];
  if (quantScore < 70) improvements.push('Quantify more results with numbers, %, or $.');
  if (actionScore < 70) improvements.push('Lead each bullet with a strong action verb.');
  if (weakScore < 80) improvements.push('Replace "responsible for" with what you actually did.');
  if (missingSections.length) improvements.push(`Add missing sections: ${missingSections.join(', ')}.`);
  if (lengthScore < 70) {
    improvements.push(
      wordCount > 800 ? 'Trim to one page (350–800 words).' : 'Add more detail to your experience.'
    );
  }
  if (improvements.length === 0) improvements.push('Polished — tailor keywords to each job description.');

  return {
    overallScore,
    wordCount,
    checks,
    strengths,
    improvements,
    foundActionVerbs,
    missingSections,
  };
}

/** A sample resume used to demo the analyzer instantly. */
export const SAMPLE_RESUME = `Jordan Lee
Software Engineering Student

EXPERIENCE
Software Engineering Intern, TechCorp (Summer 2025)
- Built a React dashboard that reduced support ticket resolution time by 35%.
- Optimized a Node.js API, cutting p95 latency from 800ms to 220ms.
- Automated deployment with Docker, saving the team 5 hours per week.

PROJECTS
StudyBuddy - A study-group matching app
- Designed and shipped a full-stack app used by 1,200+ students.
- Implemented real-time chat with WebSockets.

SKILLS
JavaScript, TypeScript, React, Node, Python, SQL, AWS, Git, Docker

EDUCATION
B.S. Computer Science, State University (Expected 2026), GPA 3.8`;
