// src/api/analyticsService.js
import { supabase } from '../lib/supabaseClient';

// Get dashboard overview statistics
export const getDashboardOverview = async () => {
  try {
    // Get total documents (only approved)
    const { count: totalDocuments } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo.toISOString());

    // Get recent uploads (last 30 days, only approved)
    const { count: recentUploads } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get pending documents
    const { count: pendingDocuments } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_approval');

    // Get total downloads
    const { count: totalDownloads } = await supabase
      .from('document_downloads')
      .select('*', { count: 'exact', head: true });

    // Get total views (only from approved documents)
    const { data: viewsData } = await supabase
      .from('documents')
      .select('views_count')
      .eq('status', 'approved');
    
    const totalViews = viewsData?.reduce((sum, doc) => sum + (doc.views_count || 0), 0) || 0;

    return {
      data: {
        totalDocuments: totalDocuments || 0,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        recentUploads: recentUploads || 0,
        pendingDocuments: pendingDocuments || 0,
        totalDownloads: totalDownloads || 0,
        totalViews: totalViews
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    return { data: null, error };
  }
};

// Get document statistics
export const getDocumentStats = async () => {
  try {
    // Documents by category (only approved)
    const { data: byCategory } = await supabase
      .from('documents')
      .select(`
        category_id,
        category:categories(name)
      `)
      .eq('status', 'approved')
      .eq('is_published', true);

    const categoryCounts = byCategory?.reduce((acc, doc) => {
      const categoryName = doc.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {});

    // Documents by status
    const { data: byStatus } = await supabase
      .from('documents')
      .select('status');

    const statusCounts = byStatus?.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {});

    // Top viewed documents (only approved)
    const { data: topViewed } = await supabase
      .from('documents')
      .select('id, title, views_count, category:categories(name)')
      .eq('status', 'approved')
      .order('views_count', { ascending: false })
      .limit(10);

    // Top downloaded documents (only approved)
    const { data: downloads } = await supabase
      .from('document_downloads')
      .select('document_id');

    const downloadCounts = downloads?.reduce((acc, item) => {
      acc[item.document_id] = (acc[item.document_id] || 0) + 1;
      return acc;
    }, {});

    const topDownloadedIds = Object.entries(downloadCounts || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    const { data: topDownloaded } = await supabase
      .from('documents')
      .select('id, title, category:categories(name)')
      .eq('status', 'approved')
      .in('id', topDownloadedIds);

    const topDownloadedWithCounts = topDownloaded?.map(doc => ({
      ...doc,
      download_count: downloadCounts[doc.id]
    }));

    return {
      data: {
        byCategory: categoryCounts,
        byStatus: statusCounts,
        topViewed: topViewed || [],
        topDownloaded: topDownloadedWithCounts || []
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching document stats:', error);
    return { data: null, error };
  }
};

// Get user activity statistics
export const getUserActivityStats = async () => {
  try {
    // Recent user registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: newUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Most active users (by document uploads - only approved documents)
    const { data: activeUsers } = await supabase
      .from('documents')
      .select(`
        created_by,
        creator:profiles!documents_created_by_fkey(full_name, email)
      `)
      .eq('status', 'approved')
      .not('created_by', 'is', null);

    const userCounts = activeUsers?.reduce((acc, doc) => {
      const userId = doc.created_by;
      if (!acc[userId]) {
        acc[userId] = {
          user: doc.creator,
          count: 0
        };
      }
      acc[userId].count++;
      return acc;
    }, {});

    const topContributors = Object.values(userCounts || {})
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // User roles distribution
    const { data: roleData } = await supabase
      .from('profiles')
      .select('role');

    const roleCounts = roleData?.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {});

    return {
      data: {
        newUsers: newUsers || 0,
        topContributors: topContributors || [],
        roleDistribution: roleCounts || {}
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching user activity stats:', error);
    return { data: null, error };
  }
};

// Get activity timeline (last 7 days)
export const getActivityTimeline = async (days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Documents uploaded per day (only approved)
    const { data: documents } = await supabase
      .from('documents')
      .select('created_at')
      .eq('status', 'approved')
      .gte('created_at', startDate.toISOString());

    // Views per day
    const { data: views } = await supabase
      .from('user_document_views')
      .select('viewed_at')
      .gte('viewed_at', startDate.toISOString());

    // Downloads per day
    const { data: downloads } = await supabase
      .from('document_downloads')
      .select('downloaded_at')
      .gte('downloaded_at', startDate.toISOString());

    // Group by day
    const timeline = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const docsCount = documents?.filter(d => 
        d.created_at.startsWith(dateStr)
      ).length || 0;

      const viewsCount = views?.filter(v => 
        v.viewed_at.startsWith(dateStr)
      ).length || 0;

      const downloadsCount = downloads?.filter(d => 
        d.downloaded_at.startsWith(dateStr)
      ).length || 0;

      timeline.unshift({
        date: dateStr,
        documents: docsCount,
        views: viewsCount,
        downloads: downloadsCount
      });
    }

    return {
      data: timeline,
      error: null
    };
  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    return { data: null, error };
  }
};

// Get recent activity logs
export const getRecentActivityLogs = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        user:profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return { data: null, error };
  }
};

// Get system health metrics
export const getSystemHealth = async () => {
  try {
    // Storage usage (approximate)
    const { data: attachments } = await supabase
      .from('attachments')
      .select('file_size');

    const totalStorage = attachments?.reduce((sum, att) => 
      sum + (att.file_size || 0), 0
    ) || 0;

    // Database size (row counts) - only approved documents
    const { count: documentsCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: logsCount } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true });

    return {
      data: {
        storageUsed: totalStorage,
        storageUsedMB: (totalStorage / (1024 * 1024)).toFixed(2),
        documentCount: documentsCount || 0,
        userCount: usersCount || 0,
        logCount: logsCount || 0,
        status: 'healthy'
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching system health:', error);
    return { 
      data: { status: 'error' }, 
      error 
    };
  }
};