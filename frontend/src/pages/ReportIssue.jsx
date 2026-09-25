import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  UploadCloud,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  Activity,
  Copy,
  ChevronRight,
  Loader2,
  Clock,
  Flame,
  Check
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { getDepartments, submitAndAnalyzeCivicReport } from '../services/reports';

export const ReportIssue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Let AI determine category');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Status & Progress State
  const [departments, setDepartments] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(0); // 1: received, 2: image, 3: AI analyzing, 4: case created
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCase, setCopiedCase] = useState(false);

  // Result State
  const [submissionResult, setSubmissionResult] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchDepts = async () => {
      const res = await getDepartments();
      if (res.success) {
        setDepartments(res.data);
      }
    };
    fetchDepts();
  }, []);

  // Geolocation Handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Detecting precise coordinates...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setIsLocating(false);
        setLocationStatus(`GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
        if (!address) {
          setAddress(`Nearby coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('Location permission denied. Please enter address manually.');
        } else {
          setLocationStatus('Could not detect location. Please enter manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Image Selection & Validation
  const handleImageChange = (file) => {
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a valid image (JPEG, PNG, or WEBP).');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image file is too large. Please select a photo under 10MB.');
      return;
    }

    setErrorMessage('');
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim()) {
      setErrorMessage('Please provide a brief title for the civic issue.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please describe the problem so AI can assess it.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    setSubmitStep(1);

    try {
      // Step 2: Image processed
      setTimeout(() => setSubmitStep(2), 600);
      // Step 3: AI Analyzing
      setTimeout(() => setSubmitStep(3), 1200);

      const result = await submitAndAnalyzeCivicReport({
        title,
        description,
        category,
        latitude,
        longitude,
        address,
        imageFile,
        userId: user?.id,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setSubmitStep(4);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmissionResult(result);
      }, 500);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
    }
  };

  const copyCaseId = () => {
    if (submissionResult?.caseNumber) {
      navigator.clipboard.writeText(submissionResult.caseNumber);
      setCopiedCase(true);
      setTimeout(() => setCopiedCase(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)] mb-6">
          <Link to="/dashboard" className="hover:text-[var(--primary)] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--foreground)] font-bold">Report an Issue</span>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: POST-SUBMISSION AI ASSESSMENT RESULT */}
        {/* ========================================================= */}
        {submissionResult ? (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Success Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full mb-1">
                    Report Registered
                  </span>
                  <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                    Civic Issue Analyzed
                  </h1>
                  <p className="text-sm text-[var(--muted)]">
                    CivicPulse AI has categorized, assessed urgency, and assigned your report.
                  </p>
                </div>
              </div>

              {/* Case Number Badge */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 text-center min-w-[200px] shadow-sm">
                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                  Civic Case ID
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-lg font-black text-[var(--primary)]">
                    {submissionResult.caseNumber}
                  </span>
                  <button
                    type="button"
                    onClick={copyCaseId}
                    className="p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] rounded-md transition-colors"
                    title="Copy Case ID"
                  >
                    {copiedCase ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Assessment Diagnostic Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-[var(--foreground)]">
                    AI Diagnostic Assessment
                  </h2>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Multimodal Evidence Analysis
                </span>
              </div>

              {/* Disagreement Notice if AI adjusted the category */}
              {submissionResult.aiAnalysis?.citizen_category_disagreement && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Category Refined by AI:</strong>
                    Citizen suggested <span className="font-semibold underline">{submissionResult.aiAnalysis.citizen_suggested_category}</span>. Gemini AI determined <span className="font-semibold underline">{submissionResult.aiAnalysis.category}</span> based on physical evidence.
                  </div>
                </div>
              )}

              {/* Assessment Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[var(--surface-secondary)] border border-[var(--border)] p-4 rounded-xl">
                  <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                    Severity
                  </span>
                  <span className="inline-flex items-center text-sm font-black text-rose-600 dark:text-rose-400">
                    {submissionResult.aiAnalysis?.severity_label || submissionResult.aiAnalysis?.severity || 'High'}
                  </span>
                </div>
                <div className="bg-[var(--surface-secondary)] border border-[var(--border)] p-4 rounded-xl">
                  <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                    Urgency
                  </span>
                  <span className="inline-flex items-center text-sm font-black text-amber-600 dark:text-amber-400">
                    {submissionResult.aiAnalysis?.urgency_label || submissionResult.aiAnalysis?.urgency || 'Medium'}
                  </span>
                </div>
                <div className="bg-[var(--surface-secondary)] border border-[var(--border)] p-4 rounded-xl">
                  <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                    Public Impact
                  </span>
                  <span className="inline-flex items-center text-sm font-black text-sky-600 dark:text-sky-400">
                    {submissionResult.aiAnalysis?.public_impact_label || submissionResult.aiAnalysis?.public_impact || 'Moderate'}
                  </span>
                </div>
                <div className="bg-[var(--surface-secondary)] border border-[var(--border)] p-4 rounded-xl">
                  <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                    Evidence Confidence
                  </span>
                  <span className="inline-flex items-center text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {submissionResult.aiAnalysis?.evidence_confidence_percent || `${Math.round((submissionResult.aiAnalysis?.evidence_confidence || 0.8) * 100)}%`}
                  </span>
                </div>
              </div>

              {/* Subcategory & Classification */}
              {submissionResult.aiAnalysis?.subcategory && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--muted)] font-semibold">Identified Subcategory:</span>
                  <span className="font-bold px-2.5 py-1 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)]">
                    {submissionResult.aiAnalysis.subcategory}
                  </span>
                </div>
              )}

              {/* Detailed Findings */}
              <div className="space-y-4 pt-2">
                <div className="bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
                  <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                    Issue Summary
                  </h3>
                  <p className="text-sm font-medium text-[var(--foreground)] leading-relaxed">
                    {submissionResult.aiAnalysis?.summary || submissionResult.report?.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
                    <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                      Recommended Department
                    </h3>
                    <p className="text-sm font-bold text-[var(--foreground)]">
                      {submissionResult.aiAnalysis?.recommended_department || submissionResult.report?.category}
                    </p>
                  </div>

                  <div className="bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
                    <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      Recommended Action
                    </h3>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {submissionResult.aiAnalysis?.recommended_action || 'Inspect and schedule municipal repair.'}
                    </p>
                  </div>
                </div>

                {submissionResult.aiAnalysis?.explanation && (
                  <div className="bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
                    <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                      Why this was classified
                    </h3>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      {submissionResult.aiAnalysis.explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionResult(null);
                    setTitle('');
                    setDescription('');
                    setCategory('Let AI determine category');
                    setAddress('');
                    setLatitude(null);
                    setLongitude(null);
                    removeImage();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  Submit Another Report
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/reports/${submissionResult.report?.id}`)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-bold shadow-md hover:opacity-90 transition-all"
                >
                  <span>View My Report</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: REPORT CREATION FORM */
          /* ========================================================= */
          <div className="space-y-8">
            {/* Header Title */}
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 px-3 py-1 rounded-full mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Smart Civic Reporting
              </span>
              <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">
                Report a Civic Issue
              </h1>
              <p className="text-base text-[var(--muted)] mt-1.5">
                Tell us what is happening. CivicPulse AI will analyze your report and help identify the right civic response.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Card 1: Issue Details */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[var(--primary)]" />
                  Problem Details
                </h2>

                {/* Title */}
                <div>
                  <label htmlFor="report-title" className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">
                    Issue Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="report-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Large pothole near the main road"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="report-desc" className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="report-desc"
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue, duration, safety risks, and impact on residents or vehicles..."
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-y"
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <label htmlFor="report-category" className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">
                    Civic Category
                  </label>
                  <select
                    id="report-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="Let AI determine category">✨ Let AI determine category (Recommended)</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Card 2: Photo Upload */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[var(--primary)]" />
                  Visual Evidence (Photo)
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Add a photo to give the AI visual context to estimate damage severity and urgency.
                </p>

                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-secondary)] p-2">
                    <img
                      src={imagePreview}
                      alt="Civic issue preview"
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                    <div className="mt-2 flex items-center justify-between px-2 py-1">
                      <div className="text-xs font-medium text-[var(--muted)] truncate max-w-[200px]">
                        {imageFile?.name} ({(imageFile?.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-md"
                      >
                        <X className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[var(--surface-secondary)]/50 hover:bg-[var(--surface-secondary)]"
                  >
                    <UploadCloud className="w-10 h-10 text-[var(--primary)] mx-auto mb-3" />
                    <p className="text-sm font-bold text-[var(--foreground)] mb-1">
                      Drag & drop photo here or click to browse
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Supports JPEG, PNG, WEBP up to 10MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageChange(e.target.files[0])}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Card 3: Location */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[var(--primary)]" />
                  Issue Location
                </h2>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors disabled:opacity-60"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Detecting GPS...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
                        <span>Use My Current Location</span>
                      </>
                    )}
                  </button>

                  {locationStatus && (
                    <span className="text-xs font-semibold text-[var(--muted)]">
                      {locationStatus}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="report-address" className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-2">
                    Address / Landmark
                  </label>
                  <input
                    id="report-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Near HDFC Bank, Road No 36, Jubilee Hills, Hyderabad"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Submission Status Indicator (during async processing) */}
              {isSubmitting && (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing your civic issue...</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className={`p-2.5 rounded-lg border ${submitStep >= 1 ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'border-[var(--border)] text-[var(--muted)]'}`}>
                      {submitStep >= 1 ? '✓' : '○'} Report received
                    </div>
                    <div className={`p-2.5 rounded-lg border ${submitStep >= 2 ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'border-[var(--border)] text-[var(--muted)]'}`}>
                      {submitStep >= 2 ? '✓' : '○'} Image processed
                    </div>
                    <div className={`p-2.5 rounded-lg border ${submitStep >= 3 ? 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 font-bold animate-pulse' : 'border-[var(--border)] text-[var(--muted)]'}`}>
                      {submitStep >= 3 ? '●' : '○'} AI analyzing issue
                    </div>
                    <div className={`p-2.5 rounded-lg border ${submitStep >= 4 ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'border-[var(--border)] text-[var(--muted)]'}`}>
                      {submitStep >= 4 ? '✓' : '○'} Creating civic case
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-[var(--primary)] text-white text-base font-bold shadow-lg shadow-[var(--primary)]/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing & Submitting Report...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Analyze & Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
