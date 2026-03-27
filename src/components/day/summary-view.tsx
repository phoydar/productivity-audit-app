interface SummaryViewProps {
  summary: string | null;
  observations: string | null;
  generatedAt: string | null;
  onGenerate?: () => void;
  generating?: boolean;
}

export function SummaryView({ summary, observations, generatedAt, onGenerate, generating }: SummaryViewProps) {
  if (!summary) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Daily Narrative</h4>
        <p className="text-sm text-on-surface-variant">No summary generated yet.</p>
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {generating ? 'Generating...' : 'Generate Summary'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-3">Daily Narrative</h4>
        <p className="text-sm text-on-surface leading-relaxed">{summary}</p>
      </div>

      {observations && (
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-3">Observations</h4>
          <div className="space-y-2">
            {observations.split('. ').filter(Boolean).map((obs, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  obs.toLowerCase().includes('short') || obs.toLowerCase().includes('high') || obs.toLowerCase().includes('below')
                    ? 'bg-error'
                    : obs.toLowerCase().includes('hit') || obs.toLowerCase().includes('met')
                    ? 'bg-primary'
                    : 'bg-secondary-container'
                }`} />
                <p className="text-sm text-on-surface leading-relaxed">{obs.endsWith('.') ? obs : `${obs}.`}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
