// src/components/Copilot.jsx
import { useState } from 'react';
import { Loader2, MessageSquare, X, ArrowRight } from 'lucide-react';
import { sendCopilotMessage } from '../services/copilot';
import { submitAndAnalyzeCivicReport } from '../services/reports';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Copilot = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { session, user } = useAuth();

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await sendCopilotMessage({
        message: message.trim(),
        token: session?.access_token || null,
      });
      if (res.success && res.analysis) {
        setAnalysis(res);
      } else {
        setError('Failed to get AI suggestions. Please try again.');
      }
    } catch (e) {
      setError(e.message || 'Error communicating with Copilot');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    if (!analysis?.analysis) return;
    const summary = analysis.analysis.summary || 'Civic issue described via Copilot';
    const title = summary.length > 50 ? summary.slice(0, 47) + '...' : summary;
    const description = message;
    setLoading(true);
    setError('');
    try {
      const result = await submitAndAnalyzeCivicReport({
        title,
        description,
        category: analysis.analysis.category || 'General Civic Services',
        latitude: null,
        longitude: null,
        address: '',
        imageFile: null,
        userId: user?.id || session?.user?.id || null,
      });
      if (result.success && result.report?.id) {
        setOpen(false);
        setMessage('');
        setAnalysis(null);
        navigate(`/reports/${result.report.id}`);
      } else {
        setError(result.error || 'Report creation failed');
      }
    } catch (e) {
      setError(e.message || 'Error creating report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-[var(--primary)] text-white rounded-full shadow-xl hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
        onClick={() => setOpen(true)}
        title="Open CivicPulse Copilot"
        aria-label="Open CivicPulse Copilot"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer p-1 rounded-lg hover:bg-[var(--surface-secondary)] transition"
              onClick={() => { setOpen(false); setMessage(''); setAnalysis(null); setError(''); }}
              aria-label="Close Copilot"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[var(--foreground)] tracking-tight">CivicPulse Copilot</h2>
                <p className="text-xs text-[var(--muted)]">Describe an issue in natural words to get instant AI assistance</p>
              </div>
            </div>

            {!analysis && (
              <div className="space-y-4">
                <textarea
                  className="w-full p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm leading-relaxed resize-none"
                  rows={4}
                  placeholder="e.g. I want to file a complaint about water leakage near the market..."
                  value={message}
                  onChange={e => { setMessage(e.target.value); if (error) setError(''); }}
                />

                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-[var(--muted)]">
                    {!user ? 'Sign in to submit reports' : 'Ready to analyze'}
                  </span>
                  <button
                    className="px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition flex items-center gap-2 cursor-pointer shadow-xs"
                    onClick={handleSend}
                    disabled={loading || !message.trim()}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Get Suggestions
                  </button>
                </div>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                <div className="p-3.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">
                    AI Diagnostic Summary
                  </span>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {analysis.analysis.summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl">
                    <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-wider block mb-0.5">Category</span>
                    <span className="font-bold text-[var(--primary)]">{analysis.analysis.category}</span>
                  </div>
                  <div className="p-3 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl">
                    <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-wider block mb-0.5">Department</span>
                    <span className="font-bold text-[var(--foreground)]">{analysis.analysis.recommended_department || 'General Services'}</span>
                  </div>
                  <div className="p-3 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl">
                    <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-wider block mb-0.5">Severity</span>
                    <span className="font-black text-rose-600 dark:text-rose-400">{analysis.analysis.severity}</span>
                  </div>
                  <div className="p-3 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl">
                    <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-wider block mb-0.5">Urgency</span>
                    <span className="font-black text-amber-600 dark:text-amber-400">{analysis.analysis.urgency}</span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <button
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)] cursor-pointer transition"
                    onClick={() => { setAnalysis(null); setError(''); }}
                    disabled={loading}
                  >
                    Edit Message
                  </button>
                  <button
                    className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs"
                    onClick={handleCreateReport}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Create Official Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
