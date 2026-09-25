import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { getDepartments, createReport } from '../services/reports';
import {
  FilePlus,
  MapPin,
  Camera,
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';

export const ReportIssue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Roads & Infrastructure',
    address: '',
    latitude: null,
    longitude: null,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load municipal departments/categories
  useEffect(() => {
    getDepartments().then((res) => {
      if (res.success && res.data.length > 0) {
        setCategories(res.data);
      }
    });
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage('');
  };

  // HTML5 Browser Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser. Please enter your address manually.');
      return;
    }

    setIsLocating(true);
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          address: prev.address || `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        }));
        setLocationSuccess(true);
        setIsLocating(false);
      },
      (error) => {
        console.warn('Geolocation permission error:', error);
        setIsLocating(false);
        setErrorMessage('Location permission was denied or unavailable. You can enter the street address manually below.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Image Selection & Drag-and-drop
  const handleFileChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 10MB limit. Please choose a smaller photo.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrorMessage('');
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim()) {
      setErrorMessage('Please provide a brief title for the civic issue.');
      return;
    }

    if (!formData.description.trim()) {
      setErrorMessage('Please describe the problem in detail.');
      return;
    }

    setIsSubmitting(true);

    const result = await createReport({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      latitude: formData.latitude,
      longitude: formData.longitude,
      address: formData.address,
      imageFile: imageFile,
      userId: user?.id,
    });

    setIsSubmitting(false);

    if (result.success && result.data?.id) {
      navigate(`/reports/${result.data.id}`);
    } else {
      setErrorMessage(result.error || 'Failed to submit report. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col font-sans transition-colors duration-200">
      <Header subtitle="Report a Civic Issue" />

      <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1">
        <div className="space-y-6">
          {/* Page Headline */}
          <div className="space-y-1 text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233c] dark:text-white tracking-tight">
              Report a Civic Issue
            </h1>
            <p className="text-xs sm:text-sm text-[#52627a] dark:text-slate-400">
              Tell us what is happening. CivicPulse AI will help understand and route your report to the appropriate department.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-[#c85c5c]/10 border border-[#c85c5c]/30 rounded-xl text-[#c85c5c] dark:text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-[#c85c5c] dark:text-rose-400 mt-0.5 shrink-0" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="civic-card p-6 sm:p-8 space-y-6">
            {/* Issue Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17233c] dark:text-slate-200 block">
                Issue Title <span className="text-[#c85c5c]">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Deep pothole damaging vehicles near Main Street bus stop"
                className="w-full px-4 py-2.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 placeholder-[#718096] dark:placeholder-slate-500 focus:outline-none focus:border-[#3b6ea8] focus:ring-1 focus:ring-[#3b6ea8] transition font-medium"
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17233c] dark:text-slate-200 block">
                Civic Category <span className="text-[#c85c5c]">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 focus:outline-none focus:border-[#3b6ea8] focus:ring-1 focus:ring-[#3b6ea8] transition font-medium cursor-pointer"
              >
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                    <option value="Waste Management">Waste Management</option>
                    <option value="Water & Drainage">Water & Drainage</option>
                    <option value="Electricity & Public Lighting">Electricity & Public Lighting</option>
                    <option value="Public Safety">Public Safety</option>
                    <option value="Sanitation">Sanitation</option>
                    <option value="General Civic Services">General Civic Services</option>
                  </>
                )}
              </select>
            </div>

            {/* Problem Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17233c] dark:text-slate-200 block">
                Detailed Description <span className="text-[#c85c5c]">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the issue, how long it has been present, and any immediate safety hazards to pedestrians or vehicles..."
                className="w-full px-4 py-2.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 placeholder-[#718096] dark:placeholder-slate-500 focus:outline-none focus:border-[#3b6ea8] focus:ring-1 focus:ring-[#3b6ea8] transition font-medium resize-y"
              />
            </div>

            {/* Location Section */}
            <div className="space-y-2 pt-2 border-t border-[#dce5f0] dark:border-[#1e293b]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-[#17233c] dark:text-slate-200">
                  Location Information
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b6ea8] dark:text-blue-400 hover:text-[#2e598b] dark:hover:text-blue-300 transition cursor-pointer"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Detecting location...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Use My Current Location</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096] dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter street address, nearby landmark, or neighborhood"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 placeholder-[#718096] dark:placeholder-slate-500 focus:outline-none focus:border-[#3b6ea8] focus:ring-1 focus:ring-[#3b6ea8] transition font-medium"
                />
              </div>

              {locationSuccess && formData.latitude && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-[#3e9b72]/10 text-[#3e9b72] dark:text-emerald-400 border border-[#3e9b72]/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>GPS Coordinates Attached: {formData.latitude}, {formData.longitude}</span>
                </div>
              )}
            </div>

            {/* Photo Upload Area */}
            <div className="space-y-2 pt-2 border-t border-[#dce5f0] dark:border-[#1e293b]">
              <label className="text-xs font-bold text-[#17233c] dark:text-slate-200 block">
                Evidence Photograph (Optional)
              </label>

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#dce5f0] dark:border-[#1e293b] bg-[#f5f8fc] dark:bg-[#0b1329] max-w-sm">
                  <img
                    src={imagePreview}
                    alt="Issue Evidence Preview"
                    className="w-full h-48 object-cover rounded-2xl"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={removeImage}
                      aria-label="Remove image"
                      className="p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition cursor-pointer shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2.5 text-xs text-[#52627a] dark:text-slate-400 font-medium truncate flex items-center justify-between">
                    <span className="truncate">{imageFile?.name}</span>
                    <span className="text-[10px] text-[#718096]">
                      {imageFile && (imageFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileChange(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#dce5f0] dark:border-[#1e293b] hover:border-[#3b6ea8] dark:hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-[#f5f8fc]/50 dark:bg-[#0b1329]/50 transition group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 bg-[#3b6ea8]/10 text-[#3b6ea8] dark:bg-blue-950 dark:text-blue-400 rounded-xl group-hover:scale-105 transition">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-xs text-[#17233c] dark:text-slate-200 font-semibold">
                      Click to upload or drag and drop a photo
                    </div>
                    <div className="text-[11px] text-[#718096] dark:text-slate-500">
                      PNG, JPG, or WEBP up to 10MB
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit CTA */}
            <div className="pt-4 border-t border-[#dce5f0] dark:border-[#1e293b]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 bg-[#3b6ea8] hover:bg-[#2e598b] active:bg-[#25466e] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Submitting Report...</span>
                  </>
                ) : (
                  <>
                    <FilePlus className="w-4 h-4" />
                    <span>Submit Civic Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="border-t border-[#dce5f0] dark:border-[#1e293b] py-4 px-6 text-center text-xs text-[#718096] dark:text-slate-500 font-medium">
        CivicPulse AI • Public Service Platform
      </footer>
    </div>
  );
};
