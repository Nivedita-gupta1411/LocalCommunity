import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, Package, Eye, Edit, Trash2, CheckCircle } from 'lucide-react';

const MyListings = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) fetchMyListings();
  }, [user]);

  const fetchMyListings = async () => {
    try {
      const res = await api.get(`/products?seller=${user._id}&limit=100`);
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting');
    }
  };

  const handleMarkSold = async (id) => {
    try {
      await api.patch(`/products/${id}/sold`);
      setProducts(products.map(p => p._id === id ? { ...p, status: 'sold' } : p));
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking as sold');
    }
  };

  const activeProducts = products.filter(p => p.status === 'active');
  const soldProducts = products.filter(p => p.status === 'sold');
  const displayProducts = tab === 'active' ? activeProducts : soldProducts;

  if (!user) return <div className="text-center py-20 text-gray-500">Please log in to view your listings.</div>;

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Link to="/create-listing" className="inline-flex items-center bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'active' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Active ({activeProducts.length})
        </button>
        <button
          onClick={() => setTab('sold')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'sold' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Sold ({soldProducts.length})
        </button>
      </div>

      {displayProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.map(product => (
            <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="relative h-48 bg-gray-100">
                <img
                  src={product.images?.[0] ? `http://localhost:5000${product.images[0]}` : '/placeholder.png'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.status === 'sold' && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">SOLD</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 flex-grow">{product.title}</h3>
                  <span className="font-bold text-emerald-600 ml-2">₹{product.price}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{product.category} • {product.condition}</p>
                <div className="text-xs text-gray-400 mb-4 flex items-center">
                  <Eye className="h-3 w-3 mr-1" /> {product.views || 0} views
                </div>
                <div className="flex space-x-2">
                  <Link to={`/product/${product._id}`} className="flex-1 text-center py-2 text-sm font-medium bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors">
                    <Eye className="h-3.5 w-3.5 inline mr-1" /> View
                  </Link>
                  {product.status === 'active' && (
                    <>
                      <Link to={`/edit-listing/${product._id}`} className="flex-1 text-center py-2 text-sm font-medium bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors">
                        <Edit className="h-3.5 w-3.5 inline mr-1" /> Edit
                      </Link>
                      <button onClick={() => handleMarkSold(product._id)} className="py-2 px-3 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 transition-colors" title="Mark Sold">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(product._id)} className="py-2 px-3 text-sm bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {tab === 'active' ? "You don't have any active listings." : "You haven't sold anything yet."}
          </p>
          {tab === 'active' && (
            <Link to="/create-listing" className="text-emerald-600 font-medium hover:underline">Create your first listing</Link>
          )}
        </div>
      )}
    </div>
  );
};

export default MyListings;
