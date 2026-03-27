import { VAGUE_PHRASES, MIN_TASK_LENGTH, MIN_OUTCOME_LENGTH } from './constants';

export interface QualityCheck {
  passed: boolean;
  issues: string[];
}

export function checkEntryQuality(task: string, outcome: string): QualityCheck {
  const issues: string[] = [];

  if (task.length < MIN_TASK_LENGTH) {
    issues.push(`Task description is too short (minimum ${MIN_TASK_LENGTH} characters). Be specific about what you did.`);
  }

  if (outcome.length < MIN_OUTCOME_LENGTH) {
    issues.push(`Outcome is too short (minimum ${MIN_OUTCOME_LENGTH} characters). What was the result?`);
  }

  const lowerTask = task.toLowerCase();
  const lowerOutcome = outcome.toLowerCase();

  for (const phrase of VAGUE_PHRASES) {
    if (lowerTask.includes(phrase) || lowerOutcome.includes(phrase)) {
      issues.push(`Entry contains vague language ("${phrase}"). Be specific about what you actually did and what the result was.`);
    }
  }

  // Check for overly generic single-word outcomes
  const genericOutcomes = ['done', 'finished', 'completed', 'good', 'ok', 'fine'];
  if (genericOutcomes.includes(lowerOutcome.trim())) {
    issues.push('Outcome is too generic. What specifically was the result or output?');
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}
