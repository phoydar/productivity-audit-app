'use client';

import { useEffect, useState } from 'react';
import { Copy, RefreshCw, Download } from 'lucide-react';

interface SettingsData {
  deepWorkTargetHours: number;
  expectedWorkHours: number;
  interruptionWarningPct: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    deepWorkTargetHours: 3,
    expectedWorkHours: 8,
    interruptionWarningPct: 20,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiSecret] = useState('dev-secret-change-in-production');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings({
            deepWorkTargetHours: data.settings.deepWorkTargetHours ?? 3,
            expectedWorkHours: data.settings.expectedWorkHours ?? 8,
            interruptionWarningPct: data.settings.interruptionWarningPct ?? 20,
          });
        }
      } catch {
        // use defaults
      }
    }
    fetchSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="p-12 max-w-2xl mx-auto space-y-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-on-surface tracking-tight">Settings</h2>
        <p className="text-sm text-on-surface-variant mt-1">Configure your performance targets, API keys, and manage workspace data.</p>
      </div>

      {/* Targets */}
      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
          Targets
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
              Deep Work Target (h)
            </label>
            <input
              type="number"
              min={0}
              max={12}
              step={0.5}
              value={settings.deepWorkTargetHours}
              onChange={(e) => setSettings((s) => ({ ...s, deepWorkTargetHours: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-2xl font-bold text-on-surface text-center focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
              Expected Work Hours (h)
            </label>
            <input
              type="number"
              min={1}
              max={24}
              step={0.5}
              value={settings.expectedWorkHours}
              onChange={(e) => setSettings((s) => ({ ...s, expectedWorkHours: parseFloat(e.target.value) || 8 }))}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-2xl font-bold text-on-surface text-center focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Interruption Warning Threshold
            </label>
            <span className="text-sm font-bold text-primary">{settings.interruptionWarningPct}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.interruptionWarningPct}
            onChange={(e) => setSettings((s) => ({ ...s, interruptionWarningPct: parseInt(e.target.value) }))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
            <span>Low Sensitivity</span>
            <span>High Sensitivity</span>
          </div>
        </div>
      </section>

      {/* API Access */}
      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
          API Access
        </h3>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">API Secret</label>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiSecret}
              readOnly
              className="flex-1 px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-sm text-on-surface font-mono focus:ring-1 focus:ring-primary outline-none"
            />
            <button
              onClick={() => copyToClipboard(apiSecret)}
              className="p-3 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Copy size={16} />
            </button>
            <button className="p-3 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-on-surface-variant hover:text-on-surface transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-2">Treat like a password. Do not share in public repositories.</p>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">API URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
              readOnly
              className="flex-1 px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-sm text-on-surface-variant font-mono"
            />
            <button
              onClick={() => copyToClipboard(typeof window !== 'undefined' ? window.location.origin : '')}
              className="p-3 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
          Data Management
        </h3>

        <div className="bg-surface-container-lowest rounded-lg p-8 text-center space-y-4">
          <h4 className="font-semibold text-on-surface">Export Workspace Data</h4>
          <p className="text-sm text-on-surface-variant">Generate a complete snapshot of your work sessions, metrics, and preferences log for external analysis.</p>
          <div className="flex justify-center gap-4">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-md font-semibold text-sm hover:opacity-90 transition-all">
              <Download size={14} />
              Export All Data (JSON)
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-container text-on-surface rounded-md font-semibold text-sm hover:bg-surface-container-high transition-all">
              <Download size={14} />
              Export All Data (CSV)
            </button>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/15">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-primary text-on-primary rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
        <button className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">
          Reset Defaults
        </button>
      </div>
    </div>
  );
}
