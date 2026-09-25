import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { getReportById } from '../services/reports';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Shield,
  Loader2,
  FileText,
} from 'lucide-react';

export const ReportDetails = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      const result = await getReportById(id);
      if (result.success) {
        setReport(result.data);
      } else {
        setError(result.error || 'Could not load report details.');
      }
      setLoading(false);
    };

    fetchDetail();
  }, [id]);

  const getStatusStepIndex = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return 1;
      case 'ai_analyzed':
        return 2;
      case 'assigned':
      case 'acknowledged':
        return 3;
      case 'in_progress':
      case 'resolution_submitted':
        return 4;
      case 'resolved':
        return 5;
      default:
        return 1;
    }
  };

  const timelineSteps = [
    { title: 'Report Submitted', desc: 'Case recorded in CivicPulse registry' },
    { title: 'AI Analyzed', desc: 'Multimodal diagnostic & impact score calculated' },
    { title: 'Department Assigned', desc: 'Routed to responsible municipal authority' },
    { title: 'In Progress', desc: 'Field inspection and repair operations underway' },
    { title: 'Resolved', desc: 'Civic issue verified and resolved' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col font-sans">
        <Header subtitle="Report Details" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#3b6ea8]" />
          <p className="text-xs text-[#52627a] dark:text-slate-400 font-medium">
            Loading case details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col font-sans">
        <Header subtitle="Report Details" />
        <div className="max-w-xl mx-auto my-auto p-8 text-center space-y-4">
          <div className="p-3 bg-[#c85c5c]/10 text-[#c85c5c] rounded-2xl w-fit mx-auto border border-[#c85c5c]/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-[#17233c] dark:text-white">Report Not Found</h2>
          <p className="text-xs text-[#52627a] dark:text-slate-400">{error || 'The requested case could not be located.'}</p>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b6ea8] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Reports
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStepIndex(report.status);

  return (
    <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col font-sans transition-colors duration-200">
      <Header subtitle={`Case: ${report.case_number}`} />

      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-8">
        {/* Navigation & Case Meta Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#52627a] dark:text-slate-300 hover:text-[#17233c] dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Reports</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-[#3b6ea8] dark:text-blue-400 bg-[#3b6ea8]/10 px-3 py-1 rounded-lg border border-[#3b6ea8]/20">
              {report.case_number}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#3fa7a3]/10 text-[#3fa7a3] dark:bg-teal-950 dark:text-teal-400 border border-[#3fa7a3]/20">
              {report.status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Case Title & Main Overview */}
        <div className="civic-card p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#3b6ea8] dark:text-blue-400 bg-[#3b6ea8]/10 px-3 py-1 rounded-full border border-[#3b6ea8]/20 w-fit inline-block">
              {report.category || 'General Civic Services'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233c] dark:text-white tracking-tight">
              {report.title}
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#52627a] dark:text-slate-400 border-y border-[#dce5f0] dark:border-[#1e293b] py-3.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#3b6ea8]" />
              <span>{report.address || 'Address provided with report'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#3fa7a3]" />
              <span>Submitted on {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#718096]">Problem Description</h3>
            <p className="text-sm text-[#17233c] dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {report.description}
            </p>
          </div>

          {/* Uploaded Evidence Image */}
          {report.image_url && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#718096]">Evidence Photo</h3>
              <div className="rounded-2xl overflow-hidden border border-[#dce5f0] dark:border-[#1e293b] max-w-md bg-[#f5f8fc] dark:bg-[#0b1329]">
                <img
                  src={report.image_url}
                  alt={report.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* AI Civic Intelligence Diagnostic Card */}
        <div className="civic-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-[#dce5f0] dark:border-[#1e293b] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#3b6ea8]/10 text-[#3b6ea8] dark:bg-blue-950 dark:text-blue-400 rounded-xl">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#17233c] dark:text-white">AI Civic Intelligence Assessment</h2>
                <p className="text-xs text-[#52627a] dark:text-slate-400">Structured decision support & impact calculation</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#3b6ea8]/10 text-[#3b6ea8] dark:bg-blue-950 dark:text-blue-400 border border-[#3b6ea8]/20">
              Impact Score: {report.impact_score || 50}/100
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
            <div className="bg-[#f5f8fc] dark:bg-[#0b1329] p-3 rounded-xl border border-[#dce5f0] dark:border-[#1e293b]">
              <div className="text-[#718096] text-[10px]">Severity</div>
              <div className="text-sm font-bold text-[#3b6ea8] dark:text-blue-400">{report.severity || 50}/100</div>
            </div>
            <div className="bg-[#f5f8fc] dark:bg-[#0b1329] p-3 rounded-xl border border-[#dce5f0] dark:border-[#1e293b]">
              <div className="text-[#718096] text-[10px]">Urgency</div>
              <div className="text-sm font-bold text-[#c28a3a] dark:text-amber-400">{report.urgency || 50}/100</div>
            </div>
            <div className="bg-[#f5f8fc] dark:bg-[#0b1329] p-3 rounded-xl border border-[#dce5f0] dark:border-[#1e293b]">
              <div className="text-[#718096] text-[10px]">Public Impact</div>
              <div className="text-sm font-bold text-[#3fa7a3] dark:text-teal-400">{report.public_impact || 50}/100</div>
            </div>
            <div className="bg-[#f5f8fc] dark:bg-[#0b1329] p-3 rounded-xl border border-[#dce5f0] dark:border-[#1e293b]">
              <div className="text-[#718096] text-[10px]">Priority</div>
              <div className="text-sm font-bold text-[#6477c8] dark:text-indigo-400 uppercase">{report.priority || 'Moderate'}</div>
            </div>
          </div>

          <div className="text-xs text-[#52627a] dark:text-slate-300 bg-[#f5f8fc] dark:bg-[#0b1329] p-4 rounded-xl border border-[#dce5f0] dark:border-[#1e293b] leading-relaxed">
            <strong className="text-[#17233c] dark:text-white block mb-1">Recommended Department Routing:</strong>
            {report.departments?.name || report.category || 'Roads & Infrastructure'}
          </div>
        </div>

        {/* Resolution Timeline Tracker */}
        <div className="civic-card p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#17233c] dark:text-white">Resolution Lifecycle Timeline</h2>
            <p className="text-xs text-[#52627a] dark:text-slate-400">Track progress from initial submission to municipal resolution</p>
          </div>

          <div className="space-y-6 pt-2">
            {timelineSteps.map((step, idx) => {
              const stepNumber = idx + 1;
              const isCompleted = stepNumber <= currentStep;
              const isCurrent = stepNumber === currentStep;

              return (
                <div key={step.title} className="flex items-start gap-4 relative">
                  {/* Connecting Vertical Line */}
                  {idx < timelineSteps.length - 1 && (
                    <div
                      className={`absolute left-[15px] top-[30px] bottom-[-24px] w-[2px] ${
                        stepNumber < currentStep ? 'bg-[#3e9b72]' : 'bg-[#dce5f0] dark:bg-[#1e293b]'
                      }`}
                    />
                  )}

                  {/* Step Indicator Node */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs z-10 transition ${
                      isCompleted
                        ? 'bg-[#3e9b72] text-white shadow-xs'
                        : isCurrent
                        ? 'bg-[#3b6ea8] text-white'
                        : 'bg-[#f5f8fc] dark:bg-[#0b1329] text-[#718096] border border-[#dce5f0] dark:border-[#1e293b]'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNumber}
                  </div>

                  {/* Step Text Content */}
                  <div className="space-y-0.5 pt-0.5">
                    <h4 className={`text-sm font-bold ${isCompleted ? 'text-[#17233c] dark:text-white' : 'text-[#718096]'}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-[#52627a] dark:text-slate-400">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#dce5f0] dark:border-[#1e293b] py-4 px-6 text-center text-xs text-[#718096] dark:text-slate-500 font-medium">
        CivicPulse AI • Public Service Platform
      </footer>
    </div>
  );
};
