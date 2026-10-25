import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { Search, Filter, X } from 'lucide-react';

const categories = [
  'All',
  'Books',
  'Electronics',
  'Furniture',
  'Cycles',
  'Fashion',
  'Stationery',
  'Hostel Essentials',
  'Other'
];

const listingTypes = ['All', 'Sell', 'Rent', 'Exchange', 'Donate'];
const conditions = ['All', 'New', 'Like New', 'Good', 'Fair', 'Used'];
const sortOptions = [
  { label: 'Newest First', value: '-createdAt' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Most Viewed', value: '-views' }
];

const Browse = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || 'All';
  const initialType = queryParams.get('listingType') || 'All';
  const initialSearch = queryParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedListingType, setSelectedListingType] = useState(initialType);
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchProducts({ page: 1 });
    }, 350);

    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    const type = params.get('listingType');
    if (cat) setSelectedCategory(cat);
    if (type) setSelectedListingType(type);
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedListingType, selectedCondition, sort, page]);

  const fetchProducts = async (customParams = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedListingType && selectedListingType !== 'All') params.append('listingType', selectedListingType);
      if (selectedCondition && selectedCondition !== 'All') params.append('condition', selectedCondition);
      if (sort) params.append('sort', sort);
      if (page) params.append('page', page);
      if (search.trim()) params.append('search', search.trim());
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      Object.keys(customParams).forEach(k => {
        if (customParams[k]) params.set(k, customParams[k]);
        else params.delete(k);
      });

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalProducts(res.data.totalProducts || 0);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedListingType('All');
    setSelectedCondition('All');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    setSort('-createdAt');
    setPage(1);
    navigate('/browse');
    fetchProducts({
      category: null,
      listingType: null,
      condition: null,
      minPrice: null,
      maxPrice: null,
      search: null,
      sort: '-createdAt',
      page: 1
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, category, or hostel area..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>
      </div>

      {/* Listing Type Filter Pills */}
      <div className="flex space-x-2 overflow-x-auto pb-4 mb-6">
        {listingTypes.map((type) => (
          <button
            key={type}
            onClick={() => { setSelectedListingType(type); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              selectedListingType === type
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
            }`}
          >
            {type === 'All' ? 'All Types' : type}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center">
                <Filter className="h-4 w-4 mr-2 text-emerald-600" /> Filters
              </h2>
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-emerald-600 flex items-center"
              >
                <X className="h-3 w-3 mr-1" /> Reset
              </button>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Category</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setPage(1); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Condition</h3>
              <div className="space-y-1">
                {conditions.map((cond) => (
                  <button
                    key={cond}
                    onClick={() => { setSelectedCondition(cond); setPage(1); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedCondition === cond
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Price Range (₹)</h3>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={() => { setPage(1); fetchProducts({ page: 1 }); }}
                className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
              >
                Apply Price
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-2 border-b border-gray-100 gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Community Marketplace</h1>
              <p className="text-xs text-gray-500 mt-0.5">{totalProducts} active items found</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Sort:</span>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-2xl h-80 border border-gray-100 p-4 space-y-3">
                  <div className="bg-gray-200 h-44 rounded-xl w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-10">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 px-3">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center my-6">
              <p className="text-gray-500 mb-2">No listings found matching your search and filter criteria.</p>
              <button
                onClick={clearFilters}
                className="text-emerald-600 font-semibold hover:underline text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Browse;
