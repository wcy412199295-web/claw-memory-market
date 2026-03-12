import { useEffect } from 'react';
import { useStore } from '../store';

export default function StatsBar() {
  const marketStats = useStore(s => s.marketStats);

  if (!marketStats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-mako-200 border border-mako-300 rounded-xl p-4 text-center animate-pulse">
            <div className="w-8 h-8 bg-mako-300 rounded-full mx-auto mb-2"></div>
            <div className="h-6 bg-mako-300 rounded w-12 mx-auto mb-1"></div>
            <div className="h-3 bg-mako-300 rounded w-16 mx-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard label="上架记忆包" value={marketStats.totalListings} icon="📦" />
      <StatCard label="注册用户" value={marketStats.totalUsers} icon="👥" />
      <StatCard label="交易笔数" value={marketStats.totalTransactions} icon="🔄" />
      <StatCard label="交易总额" value={`$${marketStats.totalVolume}`} icon="💰" />
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-mako-200 border border-mako-300 rounded-xl p-4 text-center glow-border">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-xl font-bold text-mako-900">{value}</p>
      <p className="text-xs text-mako-600">{label}</p>
    </div>
  );
}
