import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Package, ShoppingCart, DollarSign, Trash2, Download, Plus, Wallet } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const user = useStore(s => s.user);
  const myListings = useStore(s => s.myListings);
  const myPurchases = useStore(s => s.myPurchases);
  const mySales = useStore(s => s.mySales);
  const fetchMyListings = useStore(s => s.fetchMyListings);
  const fetchMyPurchases = useStore(s => s.fetchMyPurchases);
  const fetchMySales = useStore(s => s.fetchMySales);
  const deleteListing = useStore(s => s.deleteListing);
  const downloadListing = useStore(s => s.downloadListing);
  const deposit = useStore(s => s.deposit);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('listings');
  const [depositAmount, setDepositAmount] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchMyListings();
    fetchMyPurchases();
    fetchMySales();
  }, [user]);

  if (!user) return null;

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (amt > 0) {
      await deposit(amt);
      setDepositAmount('');
      setShowDeposit(false);
    }
  };

  const tabs = [
    { id: 'listings', label: '我的记忆包', icon: Package, count: myListings.length },
    { id: 'purchases', label: '已购买', icon: ShoppingCart, count: myPurchases.length },
    { id: 'sales', label: '销售记录', icon: DollarSign, count: mySales.length },
  ];

  return (
    <div className="space-y-6">
      {/* User card */}
      <div className="bg-mako-200 rounded-xl border border-mako-300 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-claw-primary/20 flex items-center justify-center
                          text-2xl text-claw-primary border-2 border-claw-primary/30">
              {(user.displayName || user.username || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-mako-900">{user.displayName || user.username}</h2>
              <p className="text-sm text-mako-600">@{user.username}</p>
              {user.bio && <p className="text-sm text-mako-700 mt-1">{user.bio}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Balance */}
            <div className="text-right">
              <p className="text-xs text-mako-600">余额</p>
              <p className="text-xl font-mono font-bold text-claw-green">
                {(user.balance || 0).toFixed(2)} <span className="text-xs text-mako-600">USDT</span>
              </p>
            </div>
            <button
              onClick={() => setShowDeposit(!showDeposit)}
              className="flex items-center gap-1 text-sm bg-claw-green/10 text-claw-green px-3 py-2
                        rounded-lg border border-claw-green/20 hover:bg-claw-green/20 transition-colors"
            >
              <Wallet size={14} /> 充值
            </button>
          </div>
        </div>

        {/* Deposit form */}
        {showDeposit && (
          <div className="mt-4 flex items-center gap-3 pt-4 border-t border-mako-300">
            <input
              type="number"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              placeholder="充值金额 (USDT)"
              className="bg-mako-100 border border-mako-300 rounded-lg px-3 py-2 text-sm
                        text-mako-900 focus:outline-none focus:border-claw-green w-48"
              min="0.01"
              step="0.01"
            />
            <button
              onClick={handleDeposit}
              className="bg-claw-green text-white px-4 py-2 rounded-lg text-sm hover:bg-claw-green/80 transition-colors"
            >
              确认充值
            </button>
            <span className="text-xs text-mako-500">（模拟充值，无需真实支付）</span>
          </div>
        )}

        {/* Stats */}
        {user.stats && (
          <div className="flex gap-6 mt-4 pt-4 border-t border-mako-300">
            <div className="text-center">
              <p className="text-lg font-bold text-mako-900">{user.stats.listings}</p>
              <p className="text-xs text-mako-600">上架</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-mako-900">{user.stats.sales}</p>
              <p className="text-xs text-mako-600">售出</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-mako-900">{user.stats.purchases}</p>
              <p className="text-xs text-mako-600">购入</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-mako-300 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors
              ${activeTab === tab.id
                ? 'bg-claw-primary/10 text-claw-primary border border-claw-primary/20'
                : 'text-mako-600 hover:text-mako-800 hover:bg-mako-200'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
            <span className="text-xs bg-mako-300 px-1.5 py-0.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'listings' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link
              to="/upload"
              className="flex items-center gap-1 text-sm bg-claw-primary text-white px-4 py-2
                        rounded-lg hover:bg-claw-primary/90 transition-colors"
            >
              <Plus size={14} /> 上传新记忆
            </Link>
          </div>
          {myListings.length === 0 ? (
            <p className="text-center text-mako-600 py-12">还没有上架记忆包</p>
          ) : (
            myListings.map(item => (
              <div key={item.id} className="bg-mako-200 rounded-lg border border-mako-300 p-4 flex items-center justify-between">
                <div>
                  <Link to={`/listing/${item.id}`} className="font-medium text-mako-900 hover:text-claw-primary transition-colors">
                    {item.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-mako-600">
                    <span>{item.status === 'active' ? '🟢 上架中' : item.status === 'delisted' ? '⚫ 已下架' : '🟡 ' + item.status}</span>
                    <span>💰 {item.price > 0 ? `${item.price} USDT` : '免费'}</span>
                    <span>⬇️ {item.downloads} 次下载</span>
                    <span>⭐ {item.rating || '—'}</span>
                  </div>
                </div>
                {item.status === 'active' && (
                  <button
                    onClick={() => { if (confirm('确定下架？')) deleteListing(item.id); }}
                    className="text-claw-accent/60 hover:text-claw-accent transition-colors"
                    title="下架"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="space-y-3">
          {myPurchases.length === 0 ? (
            <p className="text-center text-mako-600 py-12">还没有购买记忆包</p>
          ) : (
            myPurchases.map(item => (
              <div key={item.id} className="bg-mako-200 rounded-lg border border-mako-300 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-mako-900">{item.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-mako-600">
                    <span>💰 {item.price > 0 ? `${item.price} USDT` : '免费'}</span>
                    <span>📅 {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}</span>
                  </div>
                </div>
                <button
                  onClick={() => downloadListing(item.listing_id)}
                  className="flex items-center gap-1 text-sm text-claw-primary hover:text-claw-primary/80 transition-colors"
                >
                  <Download size={14} /> 下载
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-3">
          {mySales.length === 0 ? (
            <p className="text-center text-mako-600 py-12">还没有销售记录</p>
          ) : (
            <>
              <div className="bg-claw-green/10 rounded-lg p-4 border border-claw-green/20">
                <p className="text-sm text-claw-green">
                  总收入: <span className="font-bold text-lg">{mySales.reduce((s, i) => s + i.price * 0.9, 0).toFixed(2)} USDT</span>
                  <span className="text-xs text-mako-600 ml-2">（扣除 10% 平台手续费）</span>
                </p>
              </div>
              {mySales.map(item => (
                <div key={item.id} className="bg-mako-200 rounded-lg border border-mako-300 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-mako-900">{item.title}</p>
                    <p className="text-xs text-mako-600 mt-1">
                      买家: {item.buyer_name} · {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                  <span className="text-claw-green font-mono font-bold">
                    +{(item.price * 0.9).toFixed(2)}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
