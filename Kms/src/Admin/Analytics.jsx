import './css/Analytics.css';
import { Eye, Download, FileText, TrendingUp, Users, Activity } from 'lucide-react';
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
  const mostViewedDocs = [
    { id: 1, name: 'Company Policy 2025.pdf', views: 1245, category: 'HR' },
    { id: 2, name: 'Financial Report Q4.pdf', views: 987, category: 'Finance' },
    { id: 3, name: 'Marketing Strategy.pptx', views: 856, category: 'Marketing' },
    { id: 4, name: 'Employee Handbook.docx', views: 742, category: 'HR' },
    { id: 5, name: 'Sales Forecast 2025.xlsx', views: 631, category: 'Sales' }
  ];

  const mostDownloadedDocs = [
    { id: 1, name: 'Tax Forms 2025.pdf', downloads: 432, category: 'Finance' },
    { id: 2, name: 'Leave Application Form.docx', downloads: 389, category: 'HR' },
    { id: 3, name: 'Project Template.pptx', downloads: 312, category: 'Operations' },
    { id: 4, name: 'Expense Report Template.xlsx', downloads: 287, category: 'Finance' },
    { id: 5, name: 'Client Contract Template.pdf', downloads: 245, category: 'Legal' }
  ];

  const newlyAddedDocs = [
    { id: 1, name: 'Q1 2025 Budget.xlsx', date: '2025-01-20', author: 'John Smith' },
    { id: 2, name: 'New Product Launch.pptx', date: '2025-01-19', author: 'Sarah Johnson' },
    { id: 3, name: 'Security Policy Update.pdf', date: '2025-01-18', author: 'Mike Chen' },
    { id: 4, name: 'Team Meeting Notes.docx', date: '2025-01-17', author: 'Lisa Anderson' },
    { id: 5, name: 'Training Schedule.pdf', date: '2025-01-16', author: 'David Lee' }
  ];

  const topCategories = [
    { name: 'HR', count: 345, percentage: 28 },
    { name: 'Finance', count: 298, percentage: 24 },
    { name: 'Marketing', count: 187, percentage: 15 },
    { name: 'Operations', count: 156, percentage: 13 },
    { name: 'Sales', count: 142, percentage: 12 },
    { name: 'Legal', count: 98, percentage: 8 }
  ];

  const mostActiveUsers = [
    { id: 1, name: 'John Smith', uploads: 45, downloads: 123, lastActive: '2 hours ago' },
    { id: 2, name: 'Sarah Johnson', uploads: 38, downloads: 98, lastActive: '5 hours ago' },
    { id: 3, name: 'Mike Chen', uploads: 32, downloads: 87, lastActive: '1 day ago' },
    { id: 4, name: 'Lisa Anderson', uploads: 28, downloads: 76, lastActive: '3 hours ago' },
    { id: 5, name: 'David Lee', uploads: 24, downloads: 65, lastActive: '6 hours ago' }
  ];

  const uploadTrends = [
    { month: 'Jul', uploads: 45 },
    { month: 'Aug', uploads: 52 },
    { month: 'Sep', uploads: 48 },
    { month: 'Oct', uploads: 61 },
    { month: 'Nov', uploads: 58 },
    { month: 'Dec', uploads: 67 },
    { month: 'Jan', uploads: 73 }
  ];

  const faqAnalytics = [
    { question: 'How to upload documents?', views: 456, helpful: 423 },
    { question: 'How to download files?', views: 389, helpful: 367 },
    { question: 'How to share documents?', views: 312, helpful: 289 },
    { question: 'How to organize files?', views: 267, helpful: 245 },
    { question: 'How to search documents?', views: 198, helpful: 187 }
  ];

  const userActivityLogs = [
    { id: 1, user: 'John Smith', action: 'Uploaded', item: 'Q1 Budget.xlsx', time: '10 min ago' },
    { id: 2, user: 'Sarah Johnson', action: 'Downloaded', item: 'Policy Document.pdf', time: '25 min ago' },
    { id: 3, user: 'Mike Chen', action: 'Viewed', item: 'Marketing Strategy.pptx', time: '1 hour ago' },
    { id: 4, user: 'Lisa Anderson', action: 'Edited', item: 'Employee Handbook.docx', time: '2 hours ago' },
    { id: 5, user: 'David Lee', action: 'Deleted', item: 'Old Report.pdf', time: '3 hours ago' }
  ];

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1 className="analytics-title">Analytics</h1>
        <p className="analytics-subtitle">Comprehensive insights and statistics</p>
      </div>

      {/* Most Viewed Documents */}
      <section className="analytics-section">
        <div className="section-header">
          <div className="section-title-group">
            <Eye size={20} />
            <h2>Most Viewed Documents</h2>
          </div>
        </div>
        <div className="analytics-table">
          <table>
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {mostViewedDocs.map((doc) => (
                <tr key={doc.id}>
                  <td className="doc-name">{doc.name}</td>
                  <td><span className="category-badge">{doc.category}</span></td>
                  <td className="stat-number">{doc.views.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Most Downloaded Documents */}
      <section className="analytics-section">
        <div className="section-header">
          <div className="section-title-group">
            <Download size={20} />
            <h2>Most Downloaded Documents</h2>
          </div>
        </div>
        <div className="analytics-table">
          <table>
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>Downloads</th>
              </tr>
            </thead>
            <tbody>
              {mostDownloadedDocs.map((doc) => (
                <tr key={doc.id}>
                  <td className="doc-name">{doc.name}</td>
                  <td><span className="category-badge">{doc.category}</span></td>
                  <td className="stat-number">{doc.downloads.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Newly Added Documents */}
      <section className="analytics-section">
        <div className="section-header">
          <div className="section-title-group">
            <FileText size={20} />
            <h2>Newly Added Documents</h2>
          </div>
        </div>
        <div className="analytics-table">
          <table>
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Author</th>
                <th>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {newlyAddedDocs.map((doc) => (
                <tr key={doc.id}>
                  <td className="doc-name">{doc.name}</td>
                  <td>{doc.author}</td>
                  <td className="date-text">{doc.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top Categories */}
      <section className="analytics-section">
        <div className="section-header">
          <div className="section-title-group">
            <TrendingUp size={20} />
            <h2>Top Categories</h2>
          </div>
        </div>
        <div className="category-grid">
          {topCategories.map((category, index) => (
            <div key={index} className="category-card">
              <h3>{category.name}</h3>
              <p className="category-count">{category.count} documents</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${category.percentage}%` }}></div>
              </div>
              <p className="category-percentage">{category.percentage}%</p>
            </div>
          ))}
        </div>
      </section>

      {/* Most Active Users */}
      <section className="analytics-section">
        <div className="section-header">
          <div className="section-title-group">
            <Users size={20} />
            <h2>Most Active Users</h2>
          </div>
        </div>
        <div className="analytics-table">
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
        </div>
      </section>

      {/* Upload Trends */}
<section className="analytics-section">
  <div className="section-header">
    <div className="section-title-group">
      <TrendingUp size={20} />
      <h2>Upload Trends</h2>
    </div>
  </div>

  <div className="chart-wrap">
  <ResponsiveContainer width="100%" height={320}>



      <BarChart
        data={uploadTrends}
        barCategoryGap="10%"  
        barGap={4}             
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis />

        <Tooltip />

        <Bar 
          dataKey="uploads" 
          fill="#2563eb"
          barSize={70}          
          radius={[8, 8, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</section>




      {/* FAQ Analytics */}
      <section className="analytics-section">
        <div className="section-header">
          <div className="section-title-group">
            <Activity size={20} />
            <h2>FAQ Analytics</h2>
          </div>
        </div>
        <div className="analytics-table">
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Views</th>
                <th>Helpful Votes</th>
                <th>Helpfulness</th>
              </tr>
            </thead>
            <tbody>
              {faqAnalytics.map((faq, index) => (
                <tr key={index}>
                  <td className="doc-name">{faq.question}</td>
                  <td className="stat-number">{faq.views}</td>
                  <td className="stat-number">{faq.helpful}</td>
                  <td>
                    <span className="helpful-badge">
                      {((faq.helpful / faq.views) * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* User Activity Logs */}
      <section className="analytics-section">
        <div className="section-header">
          <div className="section-title-group">
            <Activity size={20} />
            <h2>User Activity Logs</h2>
          </div>
        </div>
        <div className="activity-logs">
          {userActivityLogs.map((log) => (
            <div key={log.id} className="activity-item">
              <div className="activity-content">
                <span className="activity-user">{log.user}</span>
                <span className="activity-action">{log.action}</span>
                <span className="activity-item-name">{log.item}</span>
              </div>
              <span className="activity-time">{log.time}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Analytics;