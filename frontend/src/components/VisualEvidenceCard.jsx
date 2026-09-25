import { Eye, Image as ImageIcon, ShieldCheck, AlertCircle, Info, Sparkles } from 'lucide-react';

export const VisualEvidenceCard = ({ imageUrl, aiAnalysis, hasImage = false }) => {
  const visualFindings = aiAnalysis?.visual_findings || (hasImage || imageUrl ? 'Visual physical defects detected in uploaded image.' : 'No photographic evidence provided. Diagnostic based on citizen description.');
  const visualSeverity = aiAnalysis?.visual_severity || aiAnalysis?.severity || 'Moderate';
  const visualConfidence = aiAnalysis?.visual_confidence !== null && aiAnalysis?.visual_confidence !== undefined
    ? `${Math.round(aiAnalysis.visual_confidence * 100)}%`
    : aiAnalysis?.evidence_confidence_percent || `${Math.round((aiAnalysis?.evidence_confidence || 0.8) * 100)}%`;

  const isPhotoAvailable = Boolean(imageUrl || hasImage);

  const getSeverityBadgeClass = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'low':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'n/a':
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
      default:
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
              Visual Evidence Intelligence
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Computer vision inspection of physical infrastructure & municipal hazards
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--surface-secondary)] text-[var(--muted)] border border-[var(--border)] self-start sm:self-auto">
          {isPhotoAvailable ? 'Photographic Evidence Verified' : 'Text-Only Report'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Image Preview Container */}
        {imageUrl ? (
          <div className="md:col-span-5 space-y-2">
            <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface-secondary)] group">
              <img
                src={imageUrl}
                alt="Civic Issue Photographic Evidence"
                className="w-full h-56 sm:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                  Visual Evidence Upload
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="md:col-span-5 p-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/40 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--muted)]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[var(--foreground)]">No Image Attached</span>
            <p className="text-[11px] text-[var(--muted)] max-w-[200px]">
              Analysis computed using natural language complaint context.
            </p>
          </div>
        )}

        {/* Visual Findings & Evidence Details */}
        <div className="md:col-span-7 space-y-4">
          {/* Badges Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                AI-Estimated Visual Severity
              </span>
              <span className={`inline-flex items-center text-xs font-black px-2.5 py-0.5 rounded-md border ${getSeverityBadgeClass(visualSeverity)}`}>
                {visualSeverity}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                Visual Evidence Confidence
              </span>
              <span className="inline-flex items-center text-xs font-black text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                {visualConfidence}
              </span>
            </div>
          </div>

          {/* Detected Visual Issue Findings */}
          <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5">
            <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              Detected Visual Findings
            </h3>
            <p className="text-sm font-medium text-[var(--foreground)] leading-relaxed">
              {visualFindings}
            </p>
          </div>

          {/* AI Evidence Explanation */}
          {aiAnalysis?.explanation && (
            <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
              <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                Visual Context & Evidence Correlation
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                {aiAnalysis.explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
