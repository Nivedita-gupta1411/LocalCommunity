import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, ShieldAlert, Shield, Info, X, CheckCircle, Award } from 'lucide-react';

const TrustScoreBadge = ({ sellerId, initialData = null, showDetailsModal = true }) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData && !!sellerId);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      return;
    }
    if (!sellerId) return;

    let isMounted = true;
    const fetchScore = async () => {
      try {
        const res = await api.get(`/users/${sellerId}/trust-score`);
        if (isMounted && res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load trust score:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchScore();
    return () => { isMounted = false; };
  }, [sellerId, initialData]);

  if (loading) {
    return (
      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs animate-pulse">
        <Shield className="h-3.5 w-3.5" />
        <span>Loading trust...</span>
      </div>
    );
  }

  if (!data) return null;

  const getTierColors = (tier) => {
    switch (tier) {
      case 'Excellent':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Good':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Fair':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Caution':
      case 'Suspended':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getShieldIcon = (tier) => {
    if (tier === 'Suspended' || tier === 'Caution') {
      return <ShieldAlert className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />;
    }
    return <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => showDetailsModal && setModalOpen(true)}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${getTierColors(data.tier)} ${
          showDetailsModal ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'
        }`}
        title="Click to view transparent trust factors"
      >
        {getShieldIcon(data.tier)}
        <span>Trust Score: <strong>{data.score}/100</strong></span>
        <span className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">({data.tier})</span>
        {showDetailsModal && <Info className="h-3 w-3 opacity-60 ml-0.5" />}
      </button>

      {/* Trust Breakdown Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Seller Trust & Reliability</h3>
                <p className="text-xs text-gray-500">Transparent community performance metrics</p>
              </div>
            </div>

            {/* Score Banner */}
            <div className="p-4 bg-gray-50 rounded-xl mb-4 border border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-gray-900">
                  {data.score} <span className="text-sm font-normal text-gray-500">/ 100</span>
                </div>
                <div className="text-xs font-semibold text-gray-600 mt-0.5">
                  Rating: <span className="capitalize">{data.tier} Standing</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                {data.badges && data.badges.map((b, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                    <Award className="h-2.5 w-2.5 mr-1" />
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Scoring Breakdown Factors */}
            <div className="space-y-2 text-xs mb-5">
              <h4 className="font-semibold text-gray-700 uppercase tracking-wider text-[11px] mb-2">
                Factor Breakdown
              </h4>

              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-600">Base Community Standing</span>
                <span className="font-semibold text-gray-900">+{data.breakdown?.base || 70} pts</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <div>
                  <span className="text-gray-600">Completed Sales History</span>
                  <p className="text-[10px] text-gray-400">{data.stats?.completedSales || 0} items successfully sold</p>
                </div>
                <span className="font-semibold text-emerald-600">+{data.breakdown?.salesBonus || 0} pts</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <div>
                  <span className="text-gray-600">Offer Responsiveness</span>
                  <p className="text-[10px] text-gray-400">{data.stats?.responseRatePercent || 0}% response rate ({data.stats?.offersResponded || 0}/{data.stats?.offersReceived || 0})</p>
                </div>
                <span className="font-semibold text-emerald-600">+{data.breakdown?.reliabilityBonus || 0} pts</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <div>
                  <span className="text-gray-600">Campus Account Maturity</span>
                  <p className="text-[10px] text-gray-400">{data.stats?.memberDays || 0} days active on campus</p>
                </div>
                <span className="font-semibold text-emerald-600">+{data.breakdown?.accountMaturityBonus || 0} pts</span>
              </div>

              {data.breakdown?.violationPenalty > 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-rose-100 bg-rose-50/50 px-2 rounded-md">
                  <div>
                    <span className="text-rose-700 font-medium">Policy Violations</span>
                    <p className="text-[10px] text-rose-500">{data.stats?.resolvedReports || 0} verified reports</p>
                  </div>
                  <span className="font-semibold text-rose-600">-{data.breakdown.violationPenalty} pts</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-gray-400 text-center leading-relaxed">
              Trust scores are computed deterministically from verified platform interactions to keep local campus transactions honest and safe.
            </div>

            <button
              onClick={() => setModalOpen(false)}
              className="mt-4 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TrustScoreBadge;
