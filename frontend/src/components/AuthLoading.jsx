import { Zap, Loader2 } from 'lucide-react';

export const AuthLoading = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center space-y-6 text-center max-w-sm">
        <div className="p-4 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-xl shadow-indigo-600/10 animate-pulse">
          <Zap className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">CivicPulse AI</h1>
          <p className="text-xs text-slate-400 font-medium">From Citizen Voice to Civic Action</p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-full text-xs font-mono text-slate-300 backdrop-blur-md">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          <span>Restoring your secure session...</span>
        </div>
      </div>
    </div>
  );
};
