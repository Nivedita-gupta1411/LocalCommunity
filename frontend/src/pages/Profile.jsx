import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Phone, MapPin, Building, Calendar, Edit3, Save, X, Package, CheckCircle } from 'lucide-react';
import TrustScoreBadge from '../components/TrustScoreBadge';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({ active: 0, sold: 0 });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setProfile(res.data.data);
      setFormData({
        name: res.data.data.name || '',
        phone: res.data.data.phone || '',
        college: res.data.data.college || '',
        location: res.data.data.location || ''
      });
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (!user) return;
      const res = await api.get(`/products?seller=${user._id}&limit=100`);
      const products = res.data.data;
      setStats({
        active: products.filter(p => p.status === 'active').length,
        sold: products.filter(p => p.status === 'sold').length
      });
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.put('/users/profile', formData);
      setProfile(res.data.data);
      setUser(prev => ({ ...prev, name: res.data.data.name }));
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="bg-white rounded-2xl p-8 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
              <div className="space-y-2"><div className="h-5 bg-gray-200 rounded w-32"></div><div className="h-4 bg-gray-200 rounded w-48"></div></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <div className="text-center py-20 text-gray-500">Please log in to view your profile.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
            <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors">
              <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setEditing(false); setError(null); }} className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <X className="h-4 w-4 mr-2" /> Cancel
            </button>
          </div>
        )}
      </div>

      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 text-emerald-600 bg-emerald-50 p-3 rounded-lg text-sm flex items-center"><CheckCircle className="h-4 w-4 mr-2" />{success}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-10">
          <div className="flex items-center space-x-6">
            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30">
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{profile?.name}</h2>
              <p className="text-emerald-100">{profile?.email}</p>
              <p className="text-emerald-200 text-sm mt-1">Member since {new Date(profile?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            <p className="text-sm text-gray-500">Active Listings</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.sold}</p>
            <p className="text-sm text-gray-500">Items Sold</p>
          </div>
          <div className="p-5 text-center flex flex-col items-center justify-center">
            {profile?._id && (
              <div className="my-auto">
                <TrustScoreBadge sellerId={profile._id} />
                <p className="text-xs text-gray-400 mt-1">Trust Standing</p>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-500 mb-1.5">
                <User className="h-4 w-4 mr-2" /> Full Name
              </label>
              {editing ? (
                <input name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              ) : (
                <p className="text-gray-900 font-medium">{profile?.name}</p>
              )}
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-gray-500 mb-1.5">
                <Mail className="h-4 w-4 mr-2" /> Email
              </label>
              <p className="text-gray-900">{profile?.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed</p>
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-gray-500 mb-1.5">
                <Phone className="h-4 w-4 mr-2" /> Phone
              </label>
              {editing ? (
                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              ) : (
                <p className="text-gray-900">{profile?.phone || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-gray-500 mb-1.5">
                <Building className="h-4 w-4 mr-2" /> College / Community
              </label>
              {editing ? (
                <input name="college" value={formData.college} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              ) : (
                <p className="text-gray-900">{profile?.college}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center text-sm font-medium text-gray-500 mb-1.5">
                <MapPin className="h-4 w-4 mr-2" /> Location
              </label>
              {editing ? (
                <input name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              ) : (
                <p className="text-gray-900">{profile?.location || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
