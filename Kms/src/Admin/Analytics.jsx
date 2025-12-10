import './css/Analytics.css';
import { Eye, Download, FileText, TrendingUp, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostViewedDocs, setMostViewedDocs] = useState([]);
  const [mostDownloadedDocs, setMostDownloadedDocs] = useState([]);
  const [newlyAddedDocs, setNewlyAddedDocs] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [mostActiveUsers, setMostActiveUsers] = useState([]);
  const [uploadTrends, setUploadTrends] = useState([]);
  const [kpiStats, setKpiStats] = useState({
    totalDocs: 0,
    totalViews: 0,
    totalDownloads: 0,
  });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load documents with category names
      const { data: documents, error: docsError } = await supabase
  .from('documents')
  .select(`
    id,
    title,
    views_count,
    downloads_count,
    created_at,
    created_by,
    category_id,
    categories ( name )
  `)
  .eq('status', 'approved')   // SHOW APPROVED ONLY
  .eq('is_published', true)   // OPTIONAL BUT CLEANER
  .order('created_at', { ascending: false });


      if (docsError) throw docsError;

      const docsArray = documents || [];

      // --- KPI STATS (top-right "Wallet" style card) ---
      const totalDocs = docsArray.length;
      let totalViews = 0;
      let totalDownloads = 0;

      docsArray.forEach(doc => {
        totalViews += doc.views_count || 0;
        totalDownloads += doc.downloads_count || 0;
      });

      setKpiStats({
        totalDocs,
        totalViews,
        totalDownloads,
      });

      // Most viewed documents
      const viewedDocs = [...docsArray]
        .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
        .slice(0, 5)
        .map(doc => ({
          id: doc.id,
          title: doc.title || 'Untitled',
          view_count: doc.views_count || 0,
          category: { name: doc.categories?.name || 'Uncategorized' }
        }));
      setMostViewedDocs(viewedDocs);

      // Most downloaded documents
      const downloadedDocs = [...docsArray]
        .sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0))
        .slice(0, 5)
        .map(doc => ({
          id: doc.id,
          title: doc.title || 'Untitled',
          download_count: doc.downloads_count || 0,
          category: { name: doc.categories?.name || 'Uncategorized' }
        }));
      setMostDownloadedDocs(downloadedDocs);

      // Newly added documents - get user info for authors
      const recentDocs = await Promise.all(
        docsArray.slice(0, 5).map(async (doc) => {
          let authorName = 'Unknown';
          
          if (doc.created_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', doc.created_by)
              .single();
            
            authorName = profile?.full_name || profile?.email?.split('@')[0] || 'Unknown';
          }

          return {
            id: doc.id,
            title: doc.title || 'Untitled',
            created_at: doc.created_at,
            user: { full_name: authorName }
          };
        })
      );
      setNewlyAddedDocs(recentDocs);

      // Calculate upload trends
      const trends = calculateUploadTrends(docsArray);
      setUploadTrends(trends);

      // Calculate top categories
      const categoryMap = {};
      docsArray.forEach(doc => {
        const categoryName = doc.categories?.name || 'Uncategorized';
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + 1;
      });

      const categories = Object.entries(categoryMap)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalDocs > 0 ? Math.round((count / totalDocs) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      setTopCategories(categories);

      // Load most active users from profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!profilesError && profiles) {
        const usersWithActivity = await Promise.all(
          profiles.map(async (profile) => {
            const { count: uploads } = await supabase
              .from('documents')
              .select('*', { count: 'exact', head: true })
              .eq('created_by', profile.id);

            const { count: downloads } = await supabase
              .from('document_downloads')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id);

            return {
              id: profile.id,
              name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
              uploads: uploads || 0,
              downloads: downloads || 0,
              totalActivity: (uploads || 0) + (downloads || 0)
            };
          })
        );

        // Sort by total activity and take top 5
        const activeUsers = usersWithActivity
          .sort((a, b) => b.totalActivity - a.totalActivity)
          .slice(0, 5)
          .map(user => ({
            ...user,
            lastActive: 'Recently'
          }));
        
        setMostActiveUsers(activeUsers);
      }

    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateUploadTrends = (documents) => {
    const months = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('en', { month: 'short' });
      
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = documents.filter(doc => {
        const docDate = new Date(doc.created_at);
        return docDate >= startOfMonth && docDate <= endOfMonth;
      }).length;

      months.push({
        month: monthName,
        uploads: count
      });
    }

    return months;
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-loading">
          <div className="analytics-spinner" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1 className="analytics-title">Analytics</h1>
        <p className="analytics-subtitle">
          Overview of document activity, categories, and user engagement
        </p>
      </div>

      {error && (
        <div className="analytics-error">
          <p>{error}</p>
        </div>
      )}

      {/* DASHBOARD GRID LIKE THE SAMPLE IMAGE */}
      <div className="analytics-grid">

        {/* TOP LEFT - Upload Trends (wide card) */}
        <section className="analytics-section card-span-8">
          <div className="section-header">
            <div className="section-title-group">
              <TrendingUp size={20} />
              <h2>Upload Activity (Last 7 Months)</h2>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={uploadTrends} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="uploads"
                  barSize={32}
                  radius={[12, 12, 0, 0]}
                  fill="#3b82f6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* TOP RIGHT - KPI SUMMARY ("Wallet"-style card) */}
        <section className="analytics-section card-span-4 analytics-kpi-card">
          <div className="section-header kpi-header">
            <h2>Library Overview</h2>
          </div>
          <div className="kpi-main-value">
            <span className="kpi-label">Total Documents</span>
            <span className="kpi-number">
              {kpiStats.totalDocs.toLocaleString()}
            </span>
          </div>

          <div className="kpi-row">
            <div className="kpi-item">
              <span className="kpi-label">Total Views</span>
              <span className="kpi-small-number">
                {kpiStats.totalViews.toLocaleString()}
              </span>
            </div>
            <div className="kpi-item">
              <span className="kpi-label">Total Downloads</span>
              <span className="kpi-small-number">
                {kpiStats.totalDownloads.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="kpi-footnote">
            Data is based on all documents currently in the knowledge base.
          </div>
        </section>

        {/* ROW 2 - Three cards */}
        {/* Most Viewed */}
        <section className="analytics-section card-span-4">
          <div className="section-header">
            <div className="section-title-group">
              <Eye size={20} />
              <h2>Most Viewed</h2>
            </div>
          </div>
          <div className="analytics-table">
            {mostViewedDocs.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {mostViewedDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="doc-name">{doc.title}</td>
                      <td>
                        <span className="category-badge">
                          {doc.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="stat-number">
                        {(doc.view_count || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="analytics-empty">
                <Eye size={40} />
                <p>No view data available</p>
              </div>
            )}
          </div>
        </section>

        {/* Most Downloaded */}
        <section className="analytics-section card-span-4">
          <div className="section-header">
            <div className="section-title-group">
              <Download size={20} />
              <h2>Most Downloaded</h2>
            </div>
          </div>
          <div className="analytics-table">
            {mostDownloadedDocs.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {mostDownloadedDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="doc-name">{doc.title}</td>
                      <td>
                        <span className="category-badge">
                          {doc.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="stat-number">
                        {(doc.download_count || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="analytics-empty">
                <Download size={40} />
                <p>No download data available</p>
              </div>
            )}
          </div>
        </section>

        {/* Newly Added */}
        <section className="analytics-section card-span-4">
          <div className="section-header">
            <div className="section-title-group">
              <FileText size={20} />
              <h2>Newly Added</h2>
            </div>
          </div>
          <div className="analytics-table">
            {newlyAddedDocs.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Author</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {newlyAddedDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="doc-name">{doc.title}</td>
                      <td>{doc.user?.full_name || 'Unknown'}</td>
                      <td className="date-text">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="analytics-empty">
                <FileText size={40} />
                <p>No recent documents</p>
              </div>
            )}
          </div>
        </section>

        {/* ROW 3 - Categories & Active Users */}
        <section className="analytics-section card-span-6">
          <div className="section-header">
            <div className="section-title-group">
              <TrendingUp size={20} />
              <h2>Top Categories</h2>
            </div>
          </div>
          <div className="category-grid">
            {topCategories.length > 0 ? (
              topCategories.map((category, index) => (
                <div key={index} className="category-card">
                  <h3>{category.name}</h3>
                  <p className="category-count">
                    {category.count} document{category.count !== 1 && 's'}
                  </p>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                  <p className="category-percentage">
                    {category.percentage}%
                  </p>
                </div>
              ))
            ) : (
              <div className="analytics-empty">
                <TrendingUp size={40} />
                <p>No category data</p>
              </div>
            )}
          </div>
        </section>

        <section className="analytics-section card-span-6">
          <div className="section-header">
            <div className="section-title-group">
              <Users size={20} />
              <h2>Most Active Users</h2>
            </div>
          </div>
          <div className="analytics-table">
            {mostActiveUsers.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Uploads</th>
                    <th>Downloads</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {mostActiveUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="user-name">{user.name}</td>
                      <td className="stat-number">{user.uploads}</td>
                      <td className="stat-number">{user.downloads}</td>
                      <td className="date-text">{user.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="analytics-empty">
                <Users size={40} />
                <p>No user activity data</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
