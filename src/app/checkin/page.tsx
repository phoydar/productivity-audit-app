'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { format } from 'date-fns';

const PROMPTS = [
  { question: 'What did you work on today?', subtitle: 'Document your key contributions, pull requests, and architectural decisions made in this session.' },
  { question: 'Roughly how much time did each task take?', subtitle: 'Estimate to the nearest 15-30 minutes. Precision isn\'t critical — patterns emerge from consistency.' },
  { question: 'Were there any interruptions or unplanned work?', subtitle: 'Bugs, urgent requests, context switches — anything that pulled you off your planned work.' },
  { question: 'What felt like a waste of time or low-value work?', subtitle: 'Meetings that could have been emails, repetitive tasks, blocked time waiting on others.' },
  { question: 'What actually moved things forward?', subtitle: 'The work that made real progress — shipping code, unblocking others, solving hard problems.' },
];

export default function CheckinPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const currentPrompt = PROMPTS[step];
  const isLast = step === PROMPTS.length - 1;

  async function handleNext() {
    if (isLast) {
      setLoading(true);
      try {
        // Start check-in
        const today = format(new Date(), 'yyyy-MM-dd');
        await fetch('/api/checkin/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: today, mode: 'standard' }),
        });

        // Submit all responses
        for (let i = 0; i < PROMPTS.length; i++) {
          await fetch('/api/checkin/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: i, response: responses[i] || '' }),
          });
        }

        // Generate summary
        await fetch(`/api/logs/${today}/summary`, { method: 'POST' });

        setComplete(true);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    } else {
      setStep((s) => s + 1);
    }
  }

  if (complete) {
    const today = format(new Date(), 'yyyy-MM-dd');
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">Check-in Complete</h2>
          <p className="text-sm text-on-surface-variant">Your daily summary has been generated. Great work staying consistent.</p>
          <button
            onClick={() => router.push(`/day/${today}`)}
            className="px-6 py-3 bg-primary text-on-primary rounded-md font-semibold text-sm hover:opacity-90 transition-all"
          >
            View Full Summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col">
      {/* Progress */}
      <div className="flex items-center justify-center gap-3 pt-12 pb-4">
        {PROMPTS.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i === step ? 'bg-primary scale-110' : i < step ? 'bg-primary/40' : 'bg-outline-variant/30'
            }`}
          />
        ))}
        <span className="ml-3 text-xs text-on-surface-variant font-medium uppercase tracking-wider">
          Step {step + 1} of {PROMPTS.length}
        </span>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-start justify-center pt-12 px-8">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-on-surface tracking-tight">{currentPrompt.question}</h2>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">{currentPrompt.subtitle}</p>
          </div>

          <textarea
            value={responses[step] || ''}
            onChange={(e) => setResponses((r) => ({ ...r, [step]: e.target.value }))}
            placeholder="Start typing your entry..."
            className="w-full h-40 px-6 py-5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm text-on-surface resize-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <span className="text-xs text-on-surface-variant">Auto-saved for app</span>

            <button
              onClick={handleNext}
              disabled={loading || !(responses[step]?.trim())}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Finishing...' : isLast ? 'Finish Check-In' : 'Next'}
              {!isLast && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
