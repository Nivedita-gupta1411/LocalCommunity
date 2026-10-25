const Product = require('../models/Product');

/**
 * Smart Price Suggestion Service
 * Statistically estimates reasonable market price range based on historical comparable listings.
 * 
 * Algorithm:
 * 1. Filter active/sold listings matching category and listingType.
 * 2. If excludeId is provided (e.g. in Edit mode), exclude that specific product.
 * 3. Match condition or condition tier, and check for keyword relevance in title if available.
 * 4. Filter prices that are positive numbers.
 * 5. Minimum sample size requirement: at least 3 comparable listings.
 *    If less than 3, fall back to general category + condition.
 *    If still less than 3, return insufficient data status gracefully.
 * 6. Calculate Interquartile Range (IQR) or Trimmed Mean to remove extreme outliers:
 *    - Sort prices ascending.
 *    - Discard lowest and highest 10% when n >= 5.
 *    - Compute median / trimmed mean, min, and max recommended price range.
 *    - Price range: [round(0.9 * median), round(1.1 * median)] bounded by sample min/max.
 */

exports.getSuggestedPrice = async ({ category, condition, title, listingType = 'Sell', excludeId = null }) => {
  if (!category) {
    return {
      hasSuggestion: false,
      message: 'Category is required to estimate price.'
    };
  }

  // Base query: match category and listingType, and only consider valid prices
  const baseQuery = {
    category,
    listingType: listingType || 'Sell',
    price: { $gt: 0 },
    status: { $in: ['active', 'sold'] }
  };

  if (excludeId) {
    baseQuery._id = { $ne: excludeId };
  }

  // Extract meaningful keywords from title (length >= 3, alphanumeric)
  let titleWords = [];
  if (title && typeof title === 'string') {
    titleWords = title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !['the', 'and', 'for', 'with', 'new', 'used'].includes(w));
  }

  // Step 1: Try strict match with condition + title keywords
  let candidates = [];

  if (titleWords.length > 0) {
    const keywordRegexes = titleWords.map(w => new RegExp(w, 'i'));
    const keywordQuery = {
      ...baseQuery,
      $or: [
        { title: { $in: keywordRegexes } },
        { description: { $in: keywordRegexes } }
      ]
    };
    if (condition) {
      keywordQuery.condition = condition;
    }

    candidates = await Product.find(keywordQuery).select('price title condition createdAt');
  }

  // Step 2: If insufficient (< 3), search by category + exact condition
  if (candidates.length < 3) {
    const categoryConditionQuery = { ...baseQuery };
    if (condition) {
      categoryConditionQuery.condition = condition;
    }
    candidates = await Product.find(categoryConditionQuery).select('price title condition createdAt');
  }

  // Step 3: If still insufficient (< 3), search by category alone
  if (candidates.length < 3) {
    candidates = await Product.find(baseQuery).select('price title condition createdAt');
  }

  // If still fewer than 3 listings, return graceful insufficient data response
  if (candidates.length < 3) {
    return {
      hasSuggestion: false,
      sampleSize: candidates.length,
      message: 'Not enough similar listings to estimate a price yet.'
    };
  }

  // Extract prices and sort ascending
  const prices = candidates.map(c => Number(c.price)).filter(p => !isNaN(p) && p > 0).sort((a, b) => a - b);

  if (prices.length < 3) {
    return {
      hasSuggestion: false,
      sampleSize: prices.length,
      message: 'Not enough similar listings to estimate a price yet.'
    };
  }

  // Outlier elimination: Trim bottom 10% and top 10% if n >= 5
  let filteredPrices = prices;
  if (prices.length >= 5) {
    const trimCount = Math.floor(prices.length * 0.1);
    filteredPrices = prices.slice(trimCount, prices.length - trimCount);
  }

  // Calculate Median
  const mid = Math.floor(filteredPrices.length / 2);
  const medianPrice = filteredPrices.length % 2 !== 0
    ? filteredPrices[mid]
    : Math.round((filteredPrices[mid - 1] + filteredPrices[mid]) / 2);

  // Suggested range: [0.9 * median, 1.1 * median] rounded to sensible values
  let minRange = Math.round(medianPrice * 0.9);
  let maxRange = Math.round(medianPrice * 1.1);

  // Ensure bounds respect actual sample spread
  minRange = Math.max(minRange, filteredPrices[0]);
  maxRange = Math.min(maxRange, filteredPrices[filteredPrices.length - 1]);
  if (minRange > maxRange) {
    minRange = filteredPrices[0];
    maxRange = filteredPrices[filteredPrices.length - 1];
  }

  return {
    hasSuggestion: true,
    suggestedPrice: medianPrice,
    minPrice: minRange,
    maxPrice: maxRange,
    sampleSize: candidates.length,
    message: `Suggested Price: ₹${minRange.toLocaleString('en-IN')} – ₹${maxRange.toLocaleString('en-IN')}`,
    details: `Based on ${candidates.length} comparable ${category} listing${candidates.length > 1 ? 's' : ''}`
  };
};
