import { useState } from 'react';
import { useStore } from '../store';
import { X, Eye, EyeOff } from 'lucide-react';

export default function AuthModal() {
  const show = useStore(s => s.showAuthModal);
  const setShow = useStore(s => s.setShowAuthModal);
  const login = useStore(s => s.login);
  const register = useStore(s => s.register);
  const loading = useStore(s => s.authLoading);
  const error = useStore(s => s.authError);

  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      login(username, password);
    } else {
      register(username, password, displayName);
    }
  };

  const reset = () => {
    setUsername('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-mako-200 rounded-xl border border-mako-300 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-mako-300">
          <h2 className="text-lg font-semibold text-mako-900">
            {mode === 'login' ? '🔑 登录' : '✨ 注册'}
          </h2>
          <button
            onClick={() => { setShow(false); reset(); }}
            className="text-mako-600 hover:text-mako-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-mako-600 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-mako-100 border border-mako-300 rounded-lg px-3 py-2 text-sm
                        text-mako-900 placeholder-mako-500 focus:outline-none focus:border-claw-primary"
              placeholder="3-30 个字符"
              required
              minLength={3}
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-xs text-mako-600 mb-1">密码</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-mako-100 border border-mako-300 rounded-lg px-3 py-2 text-sm
                          text-mako-900 placeholder-mako-500 focus:outline-none focus:border-claw-primary pr-10"
                placeholder="至少 6 个字符"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mako-500 hover:text-mako-700"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs text-mako-600 mb-1">显示名称（可选）</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-mako-100 border border-mako-300 rounded-lg px-3 py-2 text-sm
                          text-mako-900 placeholder-mako-500 focus:outline-none focus:border-claw-primary"
                placeholder="不填则使用用户名"
              />
            </div>
          )}

          {error && (
            <p className="text-claw-accent text-xs bg-claw-accent/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-claw-primary text-white py-2.5 rounded-lg text-sm font-medium
                      hover:bg-claw-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>

          <p className="text-center text-xs text-mako-600">
            {mode === 'login' ? '没有账户？' : '已有账户？'}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); }}
              className="text-claw-primary hover:underline ml-1"
            >
              {mode === 'login' ? '注册' : '登录'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
