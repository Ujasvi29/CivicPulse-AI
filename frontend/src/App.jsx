import { useState, useEffect } from 'react';
import { checkBackendHealth } from './services/api';
import { Activity, CheckCircle2, XCircle, RefreshCw, ShieldCheck, Zap } from 'lucide-react';

function App() {
  const [healthStatus, setHealthStatus] = useState({
    loading: true,
    connected: false,
    service: null,
    error: null,
  });

  const verifyHealth = async () => {
    setHealthStatus((prev) => ({ ...prev, loading: true, error: null }));
    const result = await checkBackendHealth();

    if (result.success) {
      setHealthStatus({
        loading: false,
        connected: true,
        service: result.data.service || 'CivicPulse AI API',
        error: null,
      });
    } else {
      setHealthStatus({
        loading: false,
        connected: false,
        service: null,
        error: result.error,
      });
    }
  };

  useEffect(() => {
    verifyHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">CivicPulse AI</h1>
            <p className="text-xs text-slate-400 font-medium">From Citizen Voice to Civic Action</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Phase 3: Foundation</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full my-auto py-12">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Project Foundation</h2>
            <p className="text-sm text-slate-400">
              Verifying communication between React Frontend and FastAPI Backend
            </p>
          </div>

          {/* Connection Status Card */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Backend Service
              </span>

              {healthStatus.loading ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Checking...
                </div>
              ) : healthStatus.connected ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ● Healthy
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3.5 h-3.5" />
                  ○ Disconnected
                </div>
              )}
            </div>

            <div className="text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/60 space-y-1">
              <div className="flex justify-between">
                <span>Target API:</span>
                <span className="text-slate-200">{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</span>
              </div>
              <div className="flex justify-between">
                <span>Endpoint:</span>
                <span className="text-slate-200">GET /health</span>
              </div>
              {healthStatus.service && (
                <div className="flex justify-between">
                  <span>Service Name:</span>
                  <span className="text-emerald-400">{healthStatus.service}</span>
                </div>
              )}
            </div>
          </div>

          {/* Refresh Action */}
          <button
            onClick={verifyHealth}
            disabled={healthStatus.loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className={`w-4 h-4 ${healthStatus.loading ? 'animate-spin' : ''}`} />
            Recheck Backend Connection
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 border-t border-slate-800 text-xs text-slate-500">
        CivicPulse AI Hackathon Prototype • System Architecture Phase 3
      </footer>
    </div>
  );
}

export default App;
