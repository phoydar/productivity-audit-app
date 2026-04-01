import { CHECKIN_PROMPTS } from '@/lib/constants';
import { createEntry } from './entry-service';
import { format } from 'date-fns';
import type { CheckinState } from '@/types';

// In-memory state for active check-in sessions (single-user app)
let activeCheckin: CheckinState | null = null;

export function startCheckin(
  date?: string,
  mode: 'standard' | 'reconstruct' = 'standard'
): { state: CheckinState; prompt: string } {
  const checkinDate = date || format(new Date(), 'yyyy-MM-dd');
  const prompts = mode === 'standard' ? CHECKIN_PROMPTS.standard : CHECKIN_PROMPTS.reconstruct;

  activeCheckin = {
    date: checkinDate,
    step: 0,
    mode,
    responses: {},
    entries: [],
  };

  return {
    state: activeCheckin,
    prompt: prompts[0],
  };
}

export function getCheckinStatus(): { active: boolean; state: CheckinState | null; currentPrompt: string | null } {
  if (!activeCheckin) {
    return { active: false, state: null, currentPrompt: null };
  }

  const prompts = activeCheckin.mode === 'standard' ? CHECKIN_PROMPTS.standard : CHECKIN_PROMPTS.reconstruct;
  const currentPrompt = activeCheckin.step < prompts.length ? prompts[activeCheckin.step] : null;

  return {
    active: true,
    state: activeCheckin,
    currentPrompt,
  };
}

export async function respondToCheckin(
  step: number,
  response: string
): Promise<{
  nextPrompt: string | null;
  complete: boolean;
  state: CheckinState;
}> {
  if (!activeCheckin) {
    throw new Error('No active check-in session. Start one first.');
  }

  activeCheckin.responses[step] = response;
  activeCheckin.step = step + 1;

  const prompts = activeCheckin.mode === 'standard' ? CHECKIN_PROMPTS.standard : CHECKIN_PROMPTS.reconstruct;

  if (activeCheckin.step >= prompts.length) {
    // Check-in complete
    const result = {
      nextPrompt: null,
      complete: true,
      state: { ...activeCheckin },
    };
    activeCheckin = null;
    return result;
  }

  return {
    nextPrompt: prompts[activeCheckin.step],
    complete: false,
    state: activeCheckin,
  };
}

export function cancelCheckin() {
  activeCheckin = null;
}
