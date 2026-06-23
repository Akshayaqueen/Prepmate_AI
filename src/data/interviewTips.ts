/**
 * Daily interview tips — rotated on the Home screen.
 */

export interface InterviewTip {
  title: string;
  body: string;
  icon: string;
}

export const INTERVIEW_TIPS: InterviewTip[] = [
  { title: 'Use the STAR method', body: 'Structure answers as Situation, Task, Action, Result for clear, complete stories.', icon: 'star-four-points' },
  { title: 'Quantify your impact', body: 'Numbers stick. "Cut load time by 40%" beats "made it faster."', icon: 'chart-line' },
  { title: 'Slow down', body: 'Aim for 120–150 words per minute. Pauses signal confidence, not weakness.', icon: 'timer-sand' },
  { title: 'Cut the fillers', body: 'Replace "um" and "like" with a brief silent pause. It reads as composure.', icon: 'volume-off' },
  { title: 'Lead with the result', body: 'For impact questions, state the outcome first, then explain how you got there.', icon: 'flag-checkered' },
  { title: 'Mirror the role', body: 'Pick stories that showcase skills from the job description.', icon: 'target' },
  { title: 'End with a question', body: 'Always have two thoughtful questions ready for your interviewer.', icon: 'help-circle' },
];

/** Returns the tip of the day based on the current date. */
export function getTipOfTheDay(): InterviewTip {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return INTERVIEW_TIPS[dayOfYear % INTERVIEW_TIPS.length];
}
