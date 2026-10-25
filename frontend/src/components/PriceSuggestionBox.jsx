import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Sparkles, TrendingUp, AlertCircle, Check } from 'lucide-react';

const PriceSuggestionBox = ({
  category,
  condition,
  title,
  listingType = 'Sell',
  excludeId = null,
  onApplyPrice
}) => {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    // If listing type is Donate, price is ₹0 by definition
    if (listingType === 'Donate') {
      setSuggestion(null);
      return;
    }

    if (!category) {
      setSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          category,
          condition: condition || '',
          listingType: listingType || 'Sell'
        });
        if (title && title.trim().length >= 3) {
          params.append('title', title.trim());
        }
        if (excludeId) {
          params.append('excludeId', excludeId);
        }

        const res = await api.get(`/products/price-suggestion?${params.toString()}`);
        if (res.data.success) {
          setSuggestion(res.data.data);
          setApplied(false);
        }
      } catch (err) {
        console.error('Failed to fetch price suggestion:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [category, condition, title, listingType, excludeId]);

  if (listingType === 'Donate') {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-2 p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center space-x-2 text-xs text-emerald-700 animate-pulse">
        <Sparkles className="h-4 w-4 text-emerald-500 animate-spin" />
        <span>Calculating intelligent market price suggestion...</span>
      </div>
    );
  }

  if (!suggestion) {
    return null;
  }

  if (!suggestion.hasSuggestion) {
    return (
      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-start space-x-2 text-xs text-gray-500">
        <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-medium text-gray-600">Smart Price Suggestion: </span>
          <span>{suggestion.message || 'Not enough recent listings in this category yet to estimate price.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-xl shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Smart Market Estimate
            </span>
          </div>
          <div className="text-sm font-bold text-gray-900">
            Suggested: ₹{suggestion.suggestedPrice?.toLocaleString('en-IN')}{' '}
            <span className="text-xs font-normal text-gray-600">
              (Typical range: ₹{suggestion.minPrice?.toLocaleString('en-IN')} – ₹{suggestion.maxPrice?.toLocaleString('en-IN')})
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {suggestion.details || `Based on ${suggestion.sampleSize} comparable campus listings`}
          </p>
        </div>

        {onApplyPrice && (
          <button
            type="button"
            onClick={() => {
              onApplyPrice(suggestion.suggestedPrice);
              setApplied(true);
              setTimeout(() => setApplied(false), 2000);
            }}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
              applied
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
          >
            {applied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                <span>Applied</span>
              </>
            ) : (
              <>
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                <span>Apply ₹{suggestion.suggestedPrice}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default PriceSuggestionBox;
