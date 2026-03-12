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

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-mako-300" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-mako-200 px-2 text-mako-500">或</span></div>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await useStore.getState().githubLogin();
              } catch {
                // GitHub error handled separately, don't pollute login form
              }
            }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#24292f] text-white py-2.5 rounded-lg text-sm
                      border border-[#24292f] hover:bg-[#2f363d] transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub 登录
          </button>

          <p className="text-center text-[10px] text-mako-500 mt-2">
            微信 / QQ 登录需企业资质 + 备案域名，暂不可用
          </p>
        </form>
      </div>
    </div>
  );
}
