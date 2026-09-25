import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Header } from '../components/Header';
import { getPublicReports, getMappedReports } from '../services/reports';
import {
  MapPin,
  Loader2,
  AlertTriangle,
  Navigation,
  ArrowRight,
  Inbox,
  ShieldAlert,
  TrendingUp,
  Info,
  ExternalLink,
} from 'lucide-react';

// ─── Priority marker config ───────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  critical: { color: '#c85c5c', ring: '#fca5a5', label: 'Critical', zIndex: 1000 },
  high:     { color: '#c28a3a', ring: '#fcd34d', label: 'High',     zIndex: 900 },
  moderate: { color: '#3b6ea8', ring: '#93c5fd', label: 'Moderate', zIndex: 800 },
  low:      { color: '#3e9b72', ring: '#6ee7b7', label: 'Low',      zIndex: 700 },
};

function createPriorityIcon(priority) {
  const cfg = PRIORITY_CONFIG[priority?.toLowerCase()] || PRIORITY_CONFIG.moderate;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <circle cx="16" cy="16" r="14" fill="${cfg.ring}" opacity="0.35"/>
      <circle cx="16" cy="16" r="10" fill="${cfg.color}" stroke="white" stroke-width="2.5"/>
      <path d="M16 30 L10 20 Q16 26 22 20 Z" fill="${cfg.color}"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 40],
    iconAnchor: [16, 38],
    popupAnchor: [0, -36],
  });
}

function createUserLocationIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#3b6ea8" opacity="0.2"/>
      <circle cx="14" cy="14" r="8" fill="#3b6ea8" stroke="white" stroke-width="3"/>
      <circle cx="14" cy="14" r="3" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

// ─── Locate Me control (inner component to access map context) ────────────────
function LocateMeControl({ userLocation, onLocate }) {
  const map = useMap();
  const flyToUser = () => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.5 });
    } else {
      onLocate();
    }
  };
  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '10px', marginRight: '10px', zIndex: 1000 }}>
      <button
        onClick={flyToUser}
        title="Locate Me"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#111c38] border border-[#dce5f0] dark:border-[#1e293b] shadow-md text-xs font-bold text-[#3b6ea8] hover:bg-[#f5f8fc] transition-colors"
        style={{ pointerEvents: 'auto' }}
      >
        <Navigation className="w-3.5 h-3.5" />
        {userLocation ? 'My Location' : 'Locate Me'}
      </button>
    </div>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority?.toLowerCase()] || PRIORITY_CONFIG.moderate;
  const colorMap = {
    critical: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    high:     'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    moderate: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    low:      'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  };
  return (
    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${colorMap[priority?.toLowerCase()] || colorMap.moderate}`}>
      {cfg.label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    submitted:   'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300',
    ai_analyzed: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300',
    assigned:    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
    in_progress: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300',
    resolved:    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
  };
  const display = (status || 'submitted').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${map[status?.toLowerCase()] || map.submitted}`}>
      {display}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const Community = () => {
  const navigate = useNavigate();
  const [mappedReports, setMappedReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Default map center: India
  const DEFAULT_CENTER = [20.5937, 78.9629];
  const DEFAULT_ZOOM = 5;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [mappedRes, allRes] = await Promise.all([
        getMappedReports(),
        getPublicReports(),
      ]);

      if (mappedRes.success) setMappedReports(mappedRes.data || []);
      else setError('Unable to load civic issues right now.');

      if (allRes.success) setAllReports(allRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      () => {
        setLocationError('Location permission denied. Map still available.');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Nearby issues: use all reports (sorted by most recent if no location)
  const nearbyIssues = allReports.slice(0, 6);

  // Map center: user location if available, else first mapped report, else default
  const mapCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : mappedReports.length > 0
    ? [mappedReports[0].latitude, mappedReports[0].longitude]
    : DEFAULT_CENTER;

  const mapZoom = userLocation ? 13 : mappedReports.length > 0 ? 12 : DEFAULT_ZOOM;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans transition-colors duration-200">
      <Header subtitle="Community Map" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* ── Page Header ── */}
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 px-3 py-1 rounded-full">
            <MapPin className="w-3.5 h-3.5" />
            Phase 11 — Civic Map
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Community Civic Map
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Explore reported civic issues across your community. Real-time data from CivicPulse AI.
          </p>
        </div>

        {/* ── Map Card ── */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          {/* Map Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-50 dark:bg-sky-950/50 rounded-xl text-sky-600 dark:text-sky-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)]">Geographic Civic Intelligence</h2>
                <p className="text-xs text-[var(--muted)]">
                  {loading ? 'Loading issues...' : `${mappedReports.length} mapped civic issue${mappedReports.length !== 1 ? 's' : ''} • OpenStreetMap`}
                </p>
              </div>
            </div>

            {/* Locate Me Button */}
            <button
              onClick={handleLocate}
              disabled={isLocating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isLocating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Locating...</span></>
              ) : (
                <><Navigation className="w-3.5 h-3.5 text-[var(--primary)]" /><span>Locate Me</span></>
              )}
            </button>
          </div>

          {locationError && (
            <div className="flex items-center gap-2 px-5 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Map Container */}
          <div className="relative" style={{ height: '520px' }}>
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--surface-secondary)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                <p className="text-xs text-[var(--muted)] font-medium">Loading civic issues...</p>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <p className="text-sm font-medium text-[var(--muted)]">{error}</p>
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User Location Marker */}
                {userLocation && (
                  <Marker
                    position={[userLocation.lat, userLocation.lng]}
                    icon={createUserLocationIcon()}
                    zIndexOffset={2000}
                  >
                    <Popup>
                      <div className="text-xs font-semibold text-[#17233c] min-w-[120px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Navigation className="w-3.5 h-3.5 text-[#3b6ea8]" />
                          <strong>You are here</strong>
                        </div>
                        <span className="text-[#52627a]">
                          {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Report Markers */}
                {mappedReports.map((report) => (
                  <Marker
                    key={report.id}
                    position={[report.latitude, report.longitude]}
                    icon={createPriorityIcon(report.priority)}
                    zIndexOffset={PRIORITY_CONFIG[report.priority?.toLowerCase()]?.zIndex || 800}
                  >
                    <Popup minWidth={220}>
                      <div className="text-xs space-y-2 min-w-[200px]">
                        {/* Case ID + Priority */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-black text-[#3b6ea8] text-[11px]">
                            {report.case_number}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            report.priority === 'critical' ? 'bg-rose-100 text-rose-700 border-rose-300' :
                            report.priority === 'high' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                            report.priority === 'moderate' ? 'bg-sky-100 text-sky-700 border-sky-300' :
                            'bg-emerald-100 text-emerald-700 border-emerald-300'
                          }`}>
                            {(report.priority || 'moderate').toUpperCase()}
                          </span>
                        </div>

                        {/* Title */}
                        <p className="font-bold text-[#17233c] leading-snug">{report.title}</p>

                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 gap-1 text-[#52627a]">
                          <div><span className="font-semibold text-[#17233c]">Category:</span><br/>{report.category || '—'}</div>
                          <div><span className="font-semibold text-[#17233c]">Status:</span><br/>{(report.status || '').replace('_', ' ')}</div>
                        </div>

                        {/* View Case Button */}
                        <button
                          onClick={() => navigate(`/reports/${report.id}`)}
                          className="w-full mt-1 py-1.5 px-3 rounded-lg bg-[#3b6ea8] text-white text-[11px] font-bold hover:bg-[#2e598b] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Case
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Locate Me flyto button within map context */}
                <LocateMeControl userLocation={userLocation} onLocate={handleLocate} />
              </MapContainer>
            )}

            {/* Empty State Overlay */}
            {!loading && !error && mappedReports.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none" style={{ zIndex: 500 }}>
                <div className="bg-white/90 dark:bg-[#111c38]/90 backdrop-blur-sm rounded-2xl px-6 py-5 text-center border border-[var(--border)] shadow-lg">
                  <Inbox className="w-8 h-8 text-[var(--muted)] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[var(--foreground)]">No mapped civic issues yet</p>
                  <p className="text-xs text-[var(--muted)] mt-1">Submit reports with GPS to see them appear here.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Map Legend ── */}
          <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-secondary)]/50">
            <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Priority Legend</p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: cfg.color }} />
                  <span className="text-xs font-semibold text-[var(--foreground)]">{cfg.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-white bg-[#3b6ea8] shadow-sm" />
                <span className="text-xs font-semibold text-[var(--foreground)]">Your Location</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Nearby Issues Section ── */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)]">Recent Civic Issues</h2>
                <p className="text-xs text-[var(--muted)]">Community reports — click to view case details</p>
              </div>
            </div>
            {!loading && (
              <span className="text-xs font-bold text-[var(--muted)] bg-[var(--surface-secondary)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                {allReports.length} total
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 gap-3 text-[var(--muted)]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs font-medium">Loading community issues...</span>
            </div>
          ) : nearbyIssues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {nearbyIssues.map((report) => (
                <button
                  key={report.id}
                  onClick={() => navigate(`/reports/${report.id}`)}
                  className="text-left p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 hover:bg-[var(--surface-secondary)] hover:border-[var(--primary)] transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] font-black text-[var(--primary)]">
                      {report.case_number}
                    </span>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="text-sm font-bold text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors mb-2">
                    {report.title}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <PriorityBadge priority={report.priority} />
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <Inbox className="w-8 h-8 text-[var(--muted)] mx-auto" />
              <p className="text-sm font-medium text-[var(--muted)]">No community reports available yet.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-4 px-6 text-center text-xs text-[var(--muted)] font-medium">
        CivicPulse AI • Public Service Platform •{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-[var(--primary)]"
        >
          © OpenStreetMap contributors
        </a>
      </footer>
    </div>
  );
};
