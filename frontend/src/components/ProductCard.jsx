import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Clock, Heart, Tag } from 'lucide-react';
import api from '../services/api';

const badgeColors = {
  Sell: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rent: 'bg-blue-50 text-blue-700 border-blue-200',
  Exchange: 'bg-purple-50 text-purple-700 border-purple-200',
  Donate: 'bg-amber-50 text-amber-700 border-amber-200'
};

const ProductCard = ({ product, onFavoriteToggle }) => {
  const { user } = useContext(AuthContext);
  const isFavorited = user?.favorites?.includes(product._id);
  const listingType = product.listingType || 'Sell';

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    try {
      if (isFavorited) {
        await api.delete(`/products/${product._id}/favorite`);
      } else {
        await api.post(`/products/${product._id}/favorite`);
      }
      if (onFavoriteToggle) onFavoriteToggle(product._id);
    } catch (err) {
      console.error('Favorite error:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group">
      <Link to={`/product/${product._id}`} className="block">
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          <img
            src={product.images && product.images[0] ? `http://localhost:5000${product.images[0]}` : '/placeholder.png'}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.status === 'sold' && (
            <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-sm">
              SOLD
            </span>
          )}
          {product.status !== 'sold' && (
            <span className={`absolute top-2.5 left-2.5 text-xs font-semibold px-2 py-0.5 rounded-md border shadow-sm ${badgeColors[listingType] || badgeColors.Sell}`}>
              {listingType}
            </span>
          )}
          {user && (
            <button
              onClick={handleFavorite}
              className="absolute top-2.5 right-2.5 p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
            </button>
          )}
        </div>
      </Link>
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-1 flex-grow pr-2">{product.title}</h3>
          <span className="text-base font-bold text-emerald-600 shrink-0">
            {listingType === 'Donate' ? 'Free' : `₹${product.price}`}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-2">{product.category} • {product.condition}</p>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
            <span className="line-clamp-1 max-w-[110px]">{product.location}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1 text-gray-400" />
            <span>{new Date(product.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <Link
          to={`/product/${product._id}`}
          className="mt-3 block w-full text-center py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
