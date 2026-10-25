import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import PriceSuggestionBox from '../components/PriceSuggestionBox';

const EditListing = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Other',
    condition: 'Used',
    listingType: 'Sell',
    location: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const product = res.data.data;
        if (user && product.seller._id !== user._id && user.role !== 'admin') {
          navigate(`/product/${id}`);
          return;
        }
        setFormData({
          title: product.title || '',
          description: product.description || '',
          price: product.price || '',
          category: product.category || 'Other',
          condition: product.condition || 'Used',
          listingType: product.listingType || 'Sell',
          location: product.location || ''
        });
      } catch (err) {
        setError('Failed to fetch listing details.');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProduct();
  }, [id, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put(`/products/${id}`, formData);
      setSuccess('Listing updated successfully!');
      setTimeout(() => navigate(`/product/${id}`), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
      Loading listing data...
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/product/${id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-emerald-600 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Product
      </Link>
      
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Edit Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
        {error && <div className="text-red-600 bg-red-50 p-3 rounded-xl text-sm">{error}</div>}
        {success && (
          <div className="text-emerald-600 bg-emerald-50 p-3 rounded-xl text-sm flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
            <select
              name="listingType"
              value={formData.listingType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Sell">Sell</option>
              <option value="Rent">Rent</option>
              <option value="Exchange">Exchange</option>
              <option value="Donate">Donate</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.listingType === 'Donate' ? 'Price (₹) — Free' : 'Price (₹)'}
            </label>
            <input
              type="number"
              name="price"
              required={formData.listingType !== 'Donate'}
              min="0"
              disabled={formData.listingType === 'Donate'}
              value={formData.listingType === 'Donate' ? 0 : formData.price}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        <PriceSuggestionBox
          category={formData.category}
          condition={formData.condition}
          title={formData.title}
          listingType={formData.listingType}
          excludeId={id}
          onApplyPrice={(suggested) => setFormData(prev => ({ ...prev, price: suggested }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {['Books', 'Electronics', 'Furniture', 'Cycles', 'Fashion', 'Stationery', 'Hostel Essentials', 'Other'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {['New', 'Like New', 'Good', 'Fair', 'Used'].map(cond => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location / Hostel Area</label>
          <input
            type="text"
            name="location"
            required
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:bg-gray-400 shadow-sm"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditListing;
