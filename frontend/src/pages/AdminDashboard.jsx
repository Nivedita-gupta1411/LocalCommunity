import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Users, Package, AlertTriangle, MessageSquare, TrendingUp, ShoppingBag, BarChart3, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-6 border border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  const cards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue', sub: `+${stats.newUsersThisWeek} this week` },
    { title: 'Active Listings', value: stats.activeProducts, icon: Package, color: 'emerald', sub: `${stats.soldProducts} sold` },
    { title: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, color: 'amber', sub: `${stats.totalReports} total` },
    { title: 'Total Messages', value: stats.totalMessages, icon: MessageSquare, color: 'purple', sub: 'conversations' },
  ];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your marketplace</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{card.title}</span>
                <div className={`p-2 rounded-lg ${colorMap[card.color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Category Breakdown & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Stats */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-emerald-600" /> Listings by Category
          </h3>
          <div className="space-y-3">
            {stats.categoryStats?.map(cat => {
              const percentage = stats.totalProducts > 0 ? Math.round((cat.count / stats.totalProducts) * 100) : 0;
              return (
                <div key={cat._id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 w-32 truncate">{cat._id || 'Unknown'}</span>
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-emerald-600" /> Quick Actions
          </h3>
          <div className="space-y-3">
            <Link to="/admin/users" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-3" />
                <span className="font-medium text-gray-900">Manage Users</span>
              </div>
              <span className="text-sm text-gray-400">{stats.totalUsers} users</span>
            </Link>
            <Link to="/admin/products" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-emerald-500 mr-3" />
                <span className="font-medium text-gray-900">Manage Products</span>
              </div>
              <span className="text-sm text-gray-400">{stats.totalProducts} products</span>
            </Link>
            <Link to="/admin/reports" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-3" />
                <span className="font-medium text-gray-900">Review Reports</span>
              </div>
              <span className="text-sm text-gray-400">{stats.pendingReports} pending</span>
            </Link>
          </div>

          <div className="mt-6 p-4 bg-emerald-50 rounded-xl">
            <h4 className="text-sm font-semibold text-emerald-800 mb-1">This Week</h4>
            <p className="text-sm text-emerald-700">
              {stats.newUsersThisWeek} new users, {stats.newListingsThisWeek} new listings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
