import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Clock, User, Heart, Flag, Edit, Trash2, MessageSquare, CheckCircle, Eye, X, DollarSign, Tag } from 'lucide-react';
import TrustScoreBadge from '../components/TrustScoreBadge';

const badgeColors = {
  Sell: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rent: 'bg-blue-50 text-blue-700 border-blue-200',
  Exchange: 'bg-purple-50 text-purple-700 border-purple-200',
  Donate: 'bg-amber-50 text-amber-700 border-amber-200'
};

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Offer Modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);

  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const isFavorited = user?.favorites?.includes(id);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`/products/${id}`);
        navigate('/my-listings');
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting product');
      }
    }
  };

  const handleMarkSold = async () => {
    try {
      const res = await api.patch(`/products/${id}/sold`);
      setProduct(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking as sold');
    }
  };

  const handleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      if (isFavorited) {
        await api.delete(`/products/${id}/favorite`);
      } else {
        await api.post(`/products/${id}/favorite`);
      }
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating favorites');
    }
  };

  const handleContactSeller = () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/messages/${id}/${product.seller._id}`);
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason) { alert('Please select a reason'); return; }
    setReportSubmitting(true);
    try {
      await api.post('/reports', { product: id, reason: reportReason, description: reportDescription });
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
      alert('Report submitted. Thank you!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (!offerAmount || Number(offerAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setOfferSubmitting(true);
    try {
      await api.post('/offers', {
        productId: id,
        amount: Number(offerAmount),
        message: offerMessage
      });
      setOfferSuccess(true);
      setTimeout(() => {
        setShowOfferModal(false);
        setOfferSuccess(false);
        setOfferAmount('');
        setOfferMessage('');
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send offer');
    } finally {
      setOfferSubmitting(false);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse bg-white rounded-2xl p-8">
        <div className="md:flex gap-8">
          <div className="md:w-1/2 h-80 bg-gray-200 rounded-xl"></div>
          <div className="md:w-1/2 space-y-4 mt-6 md:mt-0">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!product) return <div className="text-center py-20">Product not found.</div>;

  const isOwner = user && product.seller && user._id === product.seller._id;
  const listingType = product.listingType || 'Sell';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="md:flex">
          {/* Image Gallery */}
          <div className="md:w-1/2 p-6">
            <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-4 relative">
              <img
                src={product.images?.[selectedImage] ? `http://localhost:5000${product.images[selectedImage]}` : '/placeholder.png'}
                alt={product.title}
                className="object-cover w-full h-full"
              />
              <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-md border shadow-sm ${badgeColors[listingType] || badgeColors.Sell}`}>
                {listingType}
              </span>
            </div>
            {product.images?.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {product.images.map((img, index) => (
                  <button key={index} onClick={() => setSelectedImage(index)}
                    className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${selectedImage === index ? 'border-emerald-500' : 'border-gray-200 hover:border-gray-300'}`}>
                    <img src={`http://localhost:5000${img}`} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
            {product.status === 'sold' && (
              <div className="mb-4 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" /> This item has been sold
              </div>
            )}

            <div className="mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-extrabold text-emerald-600">
                  {listingType === 'Donate' ? 'Free Donation' : `₹${product.price}`}
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                  Listing Type: {listingType}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700">{product.category}</span>
              <span className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700">{product.condition}</span>
              <span className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm text-gray-600 flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1" /> {product.location}
              </span>
              <span className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm text-gray-600 flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1" /> {new Date(product.createdAt).toLocaleDateString()}
              </span>
              <span className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm text-gray-600 flex items-center">
                <Eye className="h-3.5 w-3.5 mr-1" /> {product.views} views
              </span>
            </div>

            <div className="mb-8 flex-grow">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{product.description}</p>
            </div>

            {/* Seller Info */}
            <div className="border-t border-gray-100 pt-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Seller & Community Trust</h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg mr-4 flex-shrink-0">
                    {product.seller.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{product.seller.name}</p>
                    <p className="text-sm text-gray-500">{product.seller.college}</p>
                  </div>
                </div>
                {product.seller?._id && (
                  <div>
                    <TrustScoreBadge sellerId={product.seller._id} />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-3">
              {isOwner ? (
                <>
                  <Link to={`/edit-listing/${product._id}`} className="flex justify-center items-center py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors">
                    <Edit className="h-5 w-5 mr-2" /> Edit Listing
                  </Link>
                  {product.status === 'active' && (
                    <button onClick={handleMarkSold} className="flex justify-center items-center py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors">
                      <CheckCircle className="h-5 w-5 mr-2" /> Mark as Sold
                    </button>
                  )}
                  <button onClick={handleDelete} className="flex justify-center items-center py-3 bg-white border border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-medium transition-colors">
                    <Trash2 className="h-5 w-5 mr-2" /> Delete Listing
                  </button>
                </>
              ) : (
                <>
                  {product.status === 'active' && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={handleContactSeller} className="flex-1 flex justify-center items-center py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors">
                        <MessageSquare className="h-5 w-5 mr-2" /> Contact Seller
                      </button>
                      {listingType !== 'Donate' && (
                        <button
                          onClick={() => { if (!user) { navigate('/login'); return; } setShowOfferModal(true); }}
                          className="flex-1 flex justify-center items-center py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                        >
                          <DollarSign className="h-5 w-5 mr-1.5" /> Make Offer
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button onClick={handleFavorite} className="flex-1 flex justify-center items-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors">
                      <Heart className={`h-5 w-5 mr-2 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                      {isFavorited ? 'Saved' : 'Save'}
                    </button>
                    <button onClick={() => { if (!user) { navigate('/login'); return; } setShowReportModal(true); }} className="flex-1 flex justify-center items-center py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors text-gray-600">
                      <Flag className="h-5 w-5 mr-2 text-red-400" /> Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <DollarSign className="h-5 w-5 mr-1.5 text-amber-600" /> Make an Offer
              </h3>
              <button onClick={() => setShowOfferModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {offerSuccess ? (
              <div className="py-8 text-center text-emerald-600 space-y-2">
                <CheckCircle className="h-12 w-12 mx-auto" />
                <p className="font-semibold text-lg">Offer sent to seller!</p>
              </div>
            ) : (
              <form onSubmit={handleOfferSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Offer Amount (₹) *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Original listing price: ₹{product.price}</p>
                  <input
                    type="number"
                    min="1"
                    required
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="Enter offer in ₹"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message to Seller (Optional)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder="e.g. Can pick up today at hostel library!"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOfferModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={offerSubmitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:bg-gray-400"
                  >
                    {offerSubmitting ? 'Sending...' : 'Submit Offer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Report Listing</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select a reason</option>
                  {['Spam', 'Fake product', 'Inappropriate content', 'Wrong information', 'Scam', 'Other'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional details</label>
                <textarea value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Describe the issue..." maxLength={500} />
              </div>
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={reportSubmitting}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:bg-gray-400 transition-colors">
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
