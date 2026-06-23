/**
 * Offline question bank — used for demo/practice sessions without the backend.
 * Organized by industry and question type.
 */

import { Industry, QuestionType } from '../types';

export interface BankQuestion {
  id: string;
  text: string;
  type: QuestionType;
  industry: Industry | 'general';
  tags: string[];
}

export const QUESTION_BANK: BankQuestion[] = [
  // General behavioral
  { id: 'g1', text: 'Tell me about a time you overcame a significant challenge at work or school.', type: QuestionType.Behavioral, industry: 'general', tags: ['resilience'] },
  { id: 'g2', text: 'Describe a situation where you had to work with a difficult teammate. How did you handle it?', type: QuestionType.Behavioral, industry: 'general', tags: ['teamwork', 'conflict'] },
  { id: 'g3', text: 'Give an example of a goal you set and how you achieved it.', type: QuestionType.Behavioral, industry: 'general', tags: ['goals'] },
  { id: 'g4', text: 'Tell me about a time you failed. What did you learn?', type: QuestionType.Behavioral, industry: 'general', tags: ['growth'] },
  { id: 'g5', text: 'Describe a moment when you took initiative without being asked.', type: QuestionType.Behavioral, industry: 'general', tags: ['leadership'] },

  // Technology
  { id: 't1', text: 'Walk me through how you would design a URL shortener like bit.ly.', type: QuestionType.Technical, industry: Industry.Technology, tags: ['system-design'] },
  { id: 't2', text: 'Describe a technically complex project you built. What were the hardest decisions?', type: QuestionType.Technical, industry: Industry.Technology, tags: ['projects'] },
  { id: 't3', text: 'How would you debug a production service that suddenly became slow?', type: QuestionType.Situational, industry: Industry.Technology, tags: ['debugging'] },
  { id: 't4', text: 'Tell me about a time you had to learn a new technology quickly.', type: QuestionType.Behavioral, industry: Industry.Technology, tags: ['learning'] },

  // Finance
  { id: 'f1', text: 'Walk me through a discounted cash flow valuation.', type: QuestionType.Technical, industry: Industry.Finance, tags: ['valuation'] },
  { id: 'f2', text: 'How would you evaluate whether a company is a good acquisition target?', type: QuestionType.Situational, industry: Industry.Finance, tags: ['M&A'] },
  { id: 'f3', text: 'Tell me about a time you analyzed data to make a recommendation.', type: QuestionType.Behavioral, industry: Industry.Finance, tags: ['analysis'] },

  // Consulting
  { id: 'c1', text: 'A retail client’s profits are declining. How would you diagnose the problem?', type: QuestionType.Situational, industry: Industry.Consulting, tags: ['case'] },
  { id: 'c2', text: 'Estimate the number of coffee shops in your city.', type: QuestionType.Situational, industry: Industry.Consulting, tags: ['market-sizing'] },
  { id: 'c3', text: 'Tell me about a time you influenced a decision without formal authority.', type: QuestionType.Behavioral, industry: Industry.Consulting, tags: ['influence'] },
];

/** Returns a question for the given industry, cycling by index. */
export function getQuestionForIndustry(industry: Industry, index: number): BankQuestion {
  const pool = QUESTION_BANK.filter(
    (q) => q.industry === industry || q.industry === 'general'
  );
  return pool[index % pool.length];
}

/**
 * Returns a role-specialised question, prioritising questions whose tags
 * match the role's questionTags, then falling back to general questions.
 */
export function getQuestionForRole(roleTags: string[], index: number): BankQuestion {
  const tagged = QUESTION_BANK.filter((q) =>
    q.tags.some((t) => roleTags.includes(t))
  );
  const pool = tagged.length >= 2 ? tagged : QUESTION_BANK;
  return pool[index % pool.length];
}
