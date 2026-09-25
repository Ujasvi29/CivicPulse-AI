import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Convert a File object to base64 data string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Fetch list of departments
 */
export const getDepartments = async () => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, description')
      .order('name');

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.warn('Using fallback departments list:', error.message);
    return {
      success: true,
      data: [
        { id: 'dept-1', name: 'Roads & Infrastructure', description: 'Potholes, damaged footpaths, road maintenance' },
        { id: 'dept-2', name: 'Waste Management', description: 'Garbage accumulation, illegal dumping, bin collection' },
        { id: 'dept-3', name: 'Water & Drainage', description: 'Pipe leaks, water supply, clogged drains' },
        { id: 'dept-4', name: 'Electricity & Public Lighting', description: 'Broken streetlights, transformer issues' },
        { id: 'dept-5', name: 'Public Safety', description: 'Public hazards, open manholes, safety concerns' },
        { id: 'dept-6', name: 'Sanitation', description: 'Hygiene, public facilities cleanliness' },
        { id: 'dept-7', name: 'General Civic Services', description: 'General municipal complaints' },
      ],
    };
  }
};

/**
 * Phase 7: Submit and execute multimodal Gemini AI analysis
 * Sends report details + photographic evidence to backend
 */
export const submitAndAnalyzeCivicReport = async ({
  title,
  description,
  category,
  latitude = null,
  longitude = null,
  address = '',
  imageFile = null,
  userId = null,
}) => {
  try {
    let imageBase64 = null;
    let imageMimeType = 'image/jpeg';

    if (imageFile) {
      imageBase64 = await fileToBase64(imageFile);
      imageMimeType = imageFile.type || 'image/jpeg';
    }

    // Get active Supabase session token if available
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const activeUserId = userId || sessionData?.session?.user?.id;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: category || 'Let AI determine category',
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      address: address.trim() || 'Location specified by citizen',
      image_base64: imageBase64,
      image_mime_type: imageMimeType,
      user_id: activeUserId,
    };

    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/reports`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Server returned error ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      caseNumber: data.case_number,
      report: data.report,
      aiAnalysis: data.ai_analysis,
      metrics: data.metrics,
    };
  } catch (error) {
    console.error('Error submitting civic report:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit report. Please check backend connection.',
    };
  }
};

/**
 * Get all reports submitted by a specific user
 */
export const getUserReports = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*, departments(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get detailed report by ID including timeline updates and AI diagnostics
 */
export const getReportById = async (reportId) => {
  try {
    // 1. Fetch report details
    const { data: report, error: reportErr } = await supabase
      .from('reports')
      .select('*, departments(id, name, description)')
      .eq('id', reportId)
      .single();

    if (reportErr) throw reportErr;

    // 2. Fetch timeline updates
    const { data: updates, error: updatesErr } = await supabase
      .from('report_updates')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });

    // 3. Fetch AI analysis if available
    const { data: aiAnalysis } = await supabase
      .from('ai_analysis')
      .select('*')
      .eq('report_id', reportId)
      .maybeSingle();

    return {
      success: true,
      data: {
        ...report,
        updates: updates || [],
        ai_analysis: aiAnalysis || null,
      },
    };
  } catch (error) {
    console.error('Error fetching report details:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get public civic reports for community view
 */
export const getPublicReports = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, case_number, title, description, category, subcategory, status, priority, impact_score, address, latitude, longitude, created_at, image_url')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching community reports:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Phase 12: Update civic case status (admin/system only via backend)
 */
export const updateReportStatus = async (reportId, { status, message }) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, message }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Status update failed: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error updating report status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Phase 11: Get all reports that have GPS coordinates for the civic map
 */
export const getMappedReports = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, case_number, title, category, status, priority, severity, impact_score, address, latitude, longitude, created_at')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching mapped reports:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, { fullName, city }) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        city: city.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
};

// ─── Phase 13/14: Admin Services ─────────────────────────────────────────────

/**
 * Admin: Fetch ALL reports with AI analysis and departments joined
 */
export const adminGetAllReports = async ({ limit = 200, status: statusFilter, category } = {}) => {
  try {
    let query = supabase
      .from('reports')
      .select('*, departments(id, name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (category && category !== 'all') query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Admin: error fetching all reports:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Admin: Aggregate dashboard statistics from real Supabase data
 */
export const adminGetStats = async () => {
  try {
    const { data: all, error } = await supabase
      .from('reports')
      .select('id, status, priority, category, created_at, latitude, longitude, impact_score');

    if (error) throw error;
    const reports = all || [];

    const total = reports.length;
    const critical = reports.filter(r => (r.priority || '').toLowerCase() === 'critical').length;
    const resolved = reports.filter(r => (r.status || '').toLowerCase() === 'resolved').length;
    const pending = reports.filter(r => (r.status || '').toLowerCase() !== 'resolved').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Category distribution
    const catMap = {};
    reports.forEach(r => {
      const cat = r.category || 'General Civic Services';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const categoryDistribution = Object.entries(catMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Status distribution
    const statusMap = {};
    reports.forEach(r => {
      const s = r.status || 'submitted';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusMap)
      .map(([name, count]) => ({ name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), count }));

    // Priority distribution
    const priorityOrder = ['Critical', 'High', 'Moderate', 'Low'];
    const priorityMap = {};
    reports.forEach(r => {
      const p = r.priority ? (r.priority.charAt(0).toUpperCase() + r.priority.slice(1).toLowerCase()) : 'Moderate';
      priorityMap[p] = (priorityMap[p] || 0) + 1;
    });
    const priorityDistribution = priorityOrder
      .map(name => ({ name, count: priorityMap[name] || 0 }));

    // Critical cases
    const criticalCases = reports
      .filter(r => (r.priority || '').toLowerCase() === 'critical')
      .slice(0, 10);

    // Civic trends — last 30 days grouped by day
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const trendMap = {};
    reports.forEach(r => {
      const d = new Date(r.created_at);
      if (d >= thirtyDaysAgo) {
        const dayKey = d.toISOString().slice(0, 10);
        trendMap[dayKey] = (trendMap[dayKey] || 0) + 1;
      }
    });
    // Fill all days with 0 if missing
    const trendData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      trendData.push({ date: key, count: trendMap[key] || 0 });
    }

    // Hotspot detection — grid-based clustering (round to 2 decimal places ≈ ~1km)
    const hotspotMap = {};
    reports.forEach(r => {
      if (r.latitude && r.longitude) {
        const latKey = Math.round(r.latitude * 100) / 100;
        const lngKey = Math.round(r.longitude * 100) / 100;
        const key = `${latKey},${lngKey}`;
        if (!hotspotMap[key]) {
          hotspotMap[key] = { lat: latKey, lng: lngKey, reports: [] };
        }
        hotspotMap[key].reports.push(r);
      }
    });
    const hotspots = Object.values(hotspotMap)
      .filter(h => h.reports.length >= 1)
      .sort((a, b) => b.reports.length - a.reports.length)
      .slice(0, 5)
      .map(h => {
        const cats = {};
        let topPriority = 'Low';
        const priorOrder = ['Critical', 'High', 'Moderate', 'Low'];
        h.reports.forEach(r => {
          const c = r.category || 'General';
          cats[c] = (cats[c] || 0) + 1;
          const rp = r.priority ? (r.priority.charAt(0).toUpperCase() + r.priority.slice(1).toLowerCase()) : 'Low';
          if (priorOrder.indexOf(rp) < priorOrder.indexOf(topPriority)) topPriority = rp;
        });
        const topCategory = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
        return {
          lat: h.lat,
          lng: h.lng,
          count: h.reports.length,
          topCategory,
          topPriority,
        };
      });

    // AI civic insights — deterministic from data
    const topCategory = categoryDistribution[0]?.name || null;
    const topCategoryCount = categoryDistribution[0]?.count || 0;
    const insights = [];
    if (topCategory) {
      insights.push(`Most reported issue: ${topCategory} (${topCategoryCount} reports).`);
    }
    if (critical > 0) {
      insights.push(`${critical} critical case${critical > 1 ? 's' : ''} require immediate municipal attention.`);
    }
    if (resolutionRate > 0) {
      insights.push(`Current resolution rate: ${resolutionRate}% (${resolved} of ${total} cases resolved).`);
    }
    if (hotspots.length > 0) {
      insights.push(`Highest report concentration: near coordinates ${hotspots[0].lat}°, ${hotspots[0].lng}° (${hotspots[0].count} reports).`);
    }
    if (pending > 0 && resolved === 0) {
      insights.push(`${pending} report${pending > 1 ? 's are' : ' is'} pending action — no cases resolved yet.`);
    }

    return {
      success: true,
      stats: {
        total, critical, resolved, pending, resolutionRate,
        categoryDistribution,
        statusDistribution,
        priorityDistribution,
        criticalCases,
        trendData,
        hotspots,
        insights,
        mostReportedCategory: topCategory,
      },
    };
  } catch (error) {
    console.error('Admin: error fetching stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Admin: Assign department to a report via backend
 */
export const adminAssignDepartment = async (reportId, departmentId) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/department`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ department_id: departmentId }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Assignment failed: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Admin: error assigning department:', error);
    return { success: false, error: error.message };
  }
};
