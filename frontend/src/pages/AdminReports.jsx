import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AlertTriangle, CheckCircle, XCircle, ArrowLeft, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/admin/reports');
      setReports(res.data.data);
    } catch (err) {
      console.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/reports/${id}`, { status });
      setReports(reports.map(r => r._id === id ? { ...r, status } : r));
    } catch (err) {
      alert('Failed to update report');
    }
  };

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-800'
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link to="/admin" className="text-gray-400 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">{reports.length} total reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        {['all', 'pending', 'reviewed', 'resolved', 'dismissed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => (
            <div key={report._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
                      {report.status}
                    </span>
                    <span className="text-sm font-medium text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">
                      {report.reason}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 mb-1">
                    Product: {report.product?.title || 'Deleted Product'}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    Reported by: {report.reporter?.name || 'Unknown'} ({report.reporter?.email})
                  </p>
                  {report.description && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">{report.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                  {report.product && (
                    <Link to={`/product/${report.product._id}`} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="View Product">
                      <Eye className="h-4 w-4" />
                    </Link>
                  )}
                  {report.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(report._id, 'resolved')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Resolve">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button onClick={() => updateStatus(report._id, 'dismissed')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Dismiss">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
