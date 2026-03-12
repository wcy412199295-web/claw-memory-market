import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { User, LogOut, Wallet, Github } from 'lucide-react';

export default function Header() {
  const user = useStore(s => s.user);
  const logout = useStore(s => s.logout);
  const setShowAuthModal = useStore(s => s.setShowAuthModal);

  return (
    <header className="border-b border-mako-300 bg-mako-200/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="text-2xl">🧠</span>
            <div>
              <h1 className="text-lg font-bold gradient-text leading-tight">
                SaveClaw 记忆存储市场
              </h1>
              <p className="text-xs text-mako-600 leading-tight">
                AI Agent 记忆的安全港
              </p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm text-mako-700 hover:text-claw-primary transition-colors"
            >
              浏览市场
            </Link>

            <Link
              to="/upload"
              className="text-sm bg-claw-primary/10 text-claw-primary px-4 py-2 rounded-lg
                         hover:bg-claw-primary/20 transition-all border border-claw-primary/20"
            >
              📦 上传记忆
            </Link>

            <Link
              to="/feedback"
              className="text-sm text-mako-700 hover:text-claw-primary transition-colors"
            >
              💬 反馈
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                {/* Balance */}
                <div className="flex items-center gap-1 text-xs text-claw-green bg-claw-green/10 px-2 py-1 rounded-md">
                  <Wallet size={12} />
                  <span>{(user.balance || 0).toFixed(2)}</span>
                </div>

                {/* Profile */}
                <Link
                  to="/profile"
                  className="w-8 h-8 rounded-full bg-claw-primary/20 flex items-center justify-center
                            text-xs text-claw-primary border border-claw-primary/30 cursor-pointer
                            hover:border-claw-primary transition-colors overflow-hidden"
                  title={user.displayName || user.username}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user.displayName || user.username || 'U')[0].toUpperCase()
                  )}
                </Link>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="text-mako-600 hover:text-claw-accent transition-colors"
                  title="退出登录"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1 text-sm text-mako-700 hover:text-claw-primary
                          transition-colors border border-mako-400 px-3 py-1.5 rounded-lg
                          hover:border-claw-primary/50"
              >
                <Github size={14} />
                登录
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
