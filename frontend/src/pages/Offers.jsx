import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { DollarSign, Check, X, ArrowRight, MessageSquare, Clock } from 'lucide-react';

const Offers = () => {
  const { user } = useContext(AuthContext);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('received'); // 'received' or 'sent'
  const [counterModal, setCounterModal] = useState(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) fetchOffers();
  }, [user, tab]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const role = tab === 'received' ? 'seller' : 'buyer';
      const res = await api.get(`/offers?role=${role}`);
      setOffers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offerId) => {
    setActionLoading(true);
    try {
      await api.patch(`/offers/${offerId}/accept`);
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept offer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (offerId) => {
    setActionLoading(true);
    try {
      await api.patch(`/offers/${offerId}/reject`);
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject offer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async (offerId) => {
    if (!window.confirm('Withdraw this offer?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/offers/${offerId}/withdraw`);
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw offer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCounterSubmit = async (e) => {
    e.preventDefault();
    if (!counterAmount || Number(counterAmount) <= 0) {
      alert('Please enter a valid counter amount');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/offers/${counterModal._id}/counter`, {
        counterAmount: Number(counterAmount),
        counterMessage
      });
      setCounterModal(null);
      setCounterAmount('');
      setCounterMessage('');
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send counter offer');
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      Pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      Accepted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      Rejected: 'bg-red-50 text-red-800 border-red-200',
      Countered: 'bg-blue-50 text-blue-800 border-blue-200',
      Withdrawn: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${map[status] || map.Pending}`}>
        {status}
      </span>
    );
  };

  if (!user) return <div className="text-center py-20 text-gray-500">Please log in to manage offers.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="h-6 w-6 mr-1.5 text-emerald-600" /> Offers & Negotiations
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage price offers on your listings and sent proposals</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('received')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === 'received' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Received Offers
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === 'sent' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Sent Offers
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-2xl h-32 border border-gray-100 p-4"></div>
          ))}
        </div>
      ) : offers.length > 0 ? (
        <div className="space-y-4">
          {offers.map(offer => (
            <div key={offer._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="h-16 w-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {offer.product?.images?.[0] ? (
                    <img src={`http://localhost:5000${offer.product.images[0]}`} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-300">
                      <DollarSign className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <Link to={`/product/${offer.product?._id}`} className="font-semibold text-gray-900 hover:text-emerald-600 line-clamp-1">
                      {offer.product?.title || 'Listing'}
                    </Link>
                    {statusBadge(offer.status)}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    {tab === 'received' ? (
                      <>From: <span className="font-medium text-gray-800">{offer.buyer?.name}</span> ({offer.buyer?.college})</>
                    ) : (
                      <>To Seller: <span className="font-medium text-gray-800">{offer.seller?.name}</span></>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Offered: <strong className="text-emerald-700 text-sm">₹{offer.amount}</strong></span>
                    <span>Listed at: ₹{offer.product?.price}</span>
                    <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {new Date(offer.createdAt).toLocaleDateString()}</span>
                  </div>
                  {offer.message && (
                    <p className="text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg mt-2 italic">
                      "{offer.message}"
                    </p>
                  )}
                  {offer.status === 'Countered' && (
                    <div className="mt-2 text-xs bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg font-medium">
                      Counter Offer: ₹{offer.counterAmount} {offer.counterMessage ? `— "${offer.counterMessage}"` : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                {tab === 'received' && (offer.status === 'Pending' || offer.status === 'Countered') && (
                  <>
                    <button
                      onClick={() => handleAccept(offer._id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Accept
                    </button>
                    <button
                      onClick={() => setCounterModal(offer)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold"
                    >
                      Counter
                    </button>
                    <button
                      onClick={() => handleReject(offer._id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Decline
                    </button>
                  </>
                )}
                {tab === 'sent' && offer.status === 'Pending' && (
                  <button
                    onClick={() => handleWithdraw(offer._id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                  >
                    Withdraw
                  </button>
                )}
                {offer.product && (
                  <Link
                    to={`/messages/${offer.product._id}/${tab === 'received' ? offer.buyer?._id : offer.seller?._id}`}
                    className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-gray-50"
                    title="Open Chat"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {tab === 'received' ? 'No offers received yet' : 'You haven’t made any offers yet'}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {tab === 'received'
              ? 'When buyers propose a deal on your listings, they will show up here.'
              : 'Find items you like on the marketplace and negotiate with sellers.'}
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
          >
            Explore Marketplace
          </Link>
        </div>
      )}

      {/* Counter Offer Modal */}
      {counterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Make Counter Offer</h3>
            <p className="text-xs text-gray-500 mb-4">
              Buyer offered ₹{counterModal.amount} for "{counterModal.product?.title}"
            </p>
            <form onSubmit={handleCounterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Counter Price (₹) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="Enter counter price"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <textarea
                  rows={3}
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="e.g. Can meet in the middle at ₹..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCounterModal(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm disabled:bg-gray-400"
                >
                  {actionLoading ? 'Sending...' : 'Send Counter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Offers;
