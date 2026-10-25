import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Upload, X } from 'lucide-react';
import PriceSuggestionBox from '../components/PriceSuggestionBox';

const CreateListing = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Other',
    condition: 'Used',
    listingType: 'Sell',
    location: ''
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError('You can only upload up to 5 images.');
      return;
    }
    setImages([...images, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews([...previews, ...newPreviews]);
    setError(null);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (images.length === 0) {
      setError('Please upload at least one image.');
      setLoading(false);
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    images.forEach(image => data.append('images', image));

    try {
      const res = await api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/product/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-center mt-20 text-gray-500">Please log in to create a listing.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Create a Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
        {error && <div className="text-red-600 bg-red-50 p-3 rounded-xl text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
          <input type="text" name="title" required value={formData.title} onChange={handleChange} maxLength={100}
            className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea name="description" required value={formData.description} onChange={handleChange} rows={4} maxLength={1000}
            className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type *</label>
            <select name="listingType" value={formData.listingType} onChange={handleChange}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
              <option value="Sell">Sell (Direct Sale)</option>
              <option value="Rent">Rent (Borrow for time)</option>
              <option value="Exchange">Exchange (Barter/Swap)</option>
              <option value="Donate">Donate (Free giveaway)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.listingType === 'Donate' ? 'Price (₹) — Auto-free' : 'Price (₹) *'}
            </label>
            <input
              type="number"
              name="price"
              required={formData.listingType !== 'Donate'}
              min="0"
              value={formData.listingType === 'Donate' ? 0 : formData.price}
              disabled={formData.listingType === 'Donate'}
              onChange={handleChange}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        <PriceSuggestionBox
          category={formData.category}
          condition={formData.condition}
          title={formData.title}
          listingType={formData.listingType}
          onApplyPrice={(suggested) => setFormData(prev => ({ ...prev, price: suggested }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
              {['Books', 'Electronics', 'Furniture', 'Cycles', 'Fashion', 'Stationery', 'Hostel Essentials', 'Other'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
            <select name="condition" value={formData.condition} onChange={handleChange}
              className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
              {['New', 'Like New', 'Good', 'Fair', 'Used'].map(cond => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campus Location / Hostel *</label>
          <input type="text" name="location" required value={formData.location} onChange={handleChange}
            placeholder="e.g. Hostel 5, Room 204 or Campus Central Library"
            className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Images (Max 5) *</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {previews.map((preview, i) => (
              <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden border border-gray-200">
                <img src={preview} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors">
                <Upload className="h-5 w-5 text-gray-400" />
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-gray-400 transition-colors shadow-sm">
          {loading ? 'Creating Listing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
};

export default CreateListing;
