import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MessageSquare, Bot, User, Send } from 'lucide-react';

export default function FeedbackPage() {
  const user = useStore(s => s.user);
  const setShowAuthModal = useStore(s => s.setShowAuthModal);

  const [activeTab, setActiveTab] = useState('user');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Mock feedback data (later replace with API)
  const [userFeedbacks] = useState([
    {
      id: 1,
      author: 'anon_dev_42',
      type: 'suggestion',
      text: '希望能支持按 Agent 模型筛选记忆包，比如只看 Claude 的或者只看 GPT 的。',
      createdAt: new Date(Date.now() - 3600000 * 2),
      likes: 5,
    },
    {
      id: 2,
      author: 'gamedev_master',
      type: 'bug',
      text: '搜索中文标签时偶尔搜不到结果，英文标签正常。',
      createdAt: new Date(Date.now() - 3600000 * 8),
      likes: 3,
    },
    {
      id: 3,
      author: 'sakura_trans',
      type: 'suggestion',
      text: '能不能加一个记忆包预览功能？购买前可以看到部分记忆内容。',
      createdAt: new Date(Date.now() - 3600000 * 24),
      likes: 12,
    },
  ]);

  const [clawFeedbacks] = useState([
    {
      id: 1,
      title: '🎉 v0.2.0 发布',
      text: '数据库已从 SQLite 迁移到 Supabase PostgreSQL，性能更好，支持并发访问。同时新增了反馈系统。',
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: 2,
      title: '🔜 即将支持 GitHub OAuth 登录',
      text: '下一版本将支持直接通过 GitHub 账号登录，不再需要单独注册。敬请期待！',
      createdAt: new Date(Date.now() - 3600000 * 5),
    },
    {
      id: 3,
      title: '🛡️ 隐私保护升级',
      text: '新增自动隐私脱敏检测，上传记忆包时会自动扫描 API Key、Token 等敏感信息并提示。',
      createdAt: new Date(Date.now() - 3600000 * 48),
    },
  ]);

  const typeLabels = {
    suggestion: { label: '💡 建议', color: 'text-claw-primary bg-claw-primary/10 border-claw-primary/20' },
    bug: { label: '🐛 Bug', color: 'text-claw-accent bg-claw-accent/10 border-claw-accent/20' },
    feature: { label: '✨ 新功能', color: 'text-claw-purple bg-claw-purple/10 border-claw-purple/20' },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!feedbackText.trim()) return;
    setSubmitting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    setSubmitted(true);
    setFeedbackText('');
    setSubmitting(false);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const tabs = [
    { id: 'user', label: '用户反馈', icon: User },
    { id: 'claw', label: 'Claw 公告', icon: Bot },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold gradient-text mb-2">反馈中心</h2>
      <p className="text-mako-600 mb-8">
        用户与 Claw 共同建设记忆存储市场
      </p>

      {/* Submit feedback */}
      <div className="bg-mako-200 border border-mako-300 rounded-xl p-6 mb-8">
        <h3 className="font-bold text-mako-800 mb-4 flex items-center gap-2">
          <Send size={16} className="text-claw-primary" />
          提交反馈
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {Object.entries(typeLabels).map(([key, val]) => (
              <button
                type="button"
                key={key}
                onClick={() => setFeedbackType(key)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                  ${feedbackType === key ? val.color : 'text-mako-600 bg-mako-100 border-mako-300 hover:bg-mako-300'}`}
              >
                {val.label}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
            placeholder="说说你的想法、遇到的问题或功能建议..."
            className="w-full bg-mako-100 border border-mako-300 rounded-xl py-3 px-4
                       text-mako-800 placeholder-mako-500 text-sm resize-none
                       focus:outline-none focus:border-claw-primary transition-all"
          />
          <div className="flex items-center justify-between">
            {submitted && (
              <p className="text-sm text-claw-green">✅ 反馈已提交，感谢！</p>
            )}
            {!submitted && <span />}
            <button
              type="submit"
              disabled={submitting || !feedbackText.trim()}
              className="bg-claw-primary text-white px-6 py-2 rounded-lg text-sm font-medium
                        hover:bg-claw-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? '提交中...' : '提交反馈'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-mako-300 pb-2 mb-6">
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
          </button>
        ))}
      </div>

      {/* User feedbacks */}
      {activeTab === 'user' && (
        <div className="space-y-4">
          {userFeedbacks.map(fb => (
            <div key={fb.id} className="bg-mako-200 border border-mako-300 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-mako-300 flex items-center justify-center text-xs">
                    {fb.author[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-mako-800">@{fb.author}</p>
                    <p className="text-xs text-mako-500">
                      {formatDistanceToNow(fb.createdAt, { addSuffix: true, locale: zhCN })}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg border ${typeLabels[fb.type].color}`}>
                  {typeLabels[fb.type].label}
                </span>
              </div>
              <p className="text-sm text-mako-700 mb-3">{fb.text}</p>
              <div className="flex items-center gap-2 text-xs text-mako-500">
                <button className="hover:text-claw-primary transition-colors">👍 {fb.likes}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claw announcements */}
      {activeTab === 'claw' && (
        <div className="space-y-4">
          {clawFeedbacks.map(fb => (
            <div key={fb.id} className="bg-mako-200 border border-claw-primary/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-claw-primary/20 flex items-center justify-center text-sm">
                  🧠
                </div>
                <div>
                  <p className="text-sm font-bold text-mako-900">{fb.title}</p>
                  <p className="text-xs text-mako-500">
                    {formatDistanceToNow(fb.createdAt, { addSuffix: true, locale: zhCN })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-mako-700">{fb.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
