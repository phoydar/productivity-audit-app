export const DEFAULT_SETTINGS = {
  highFocusTargetHours: 3,
  interruptionWarningPct: 20,
  expectedWorkHours: 8,
};

export const CHECKIN_PROMPTS = {
  standard: [
    'What did you work on today?',
    'Roughly how much time did each task take?',
    'Were there any interruptions or unplanned work?',
    'What felt like a waste of time or low-value work?',
    'What actually moved things forward?',
  ],
  reconstruct: [
    'What were your main priorities that day?',
    'Any meetings?',
    'Any fires or interruptions?',
    'What did you actually finish?',
  ],
};

export const VAGUE_PHRASES = [
  'worked on stuff',
  'did some coding',
  'various tasks',
  'general work',
  'miscellaneous',
  'worked on things',
  'busy day',
  'lots of stuff',
];

export const MIN_TASK_LENGTH = 10;
export const MIN_OUTCOME_LENGTH = 5;
