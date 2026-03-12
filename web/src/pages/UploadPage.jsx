import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export default function UploadPage() {
  const navigate = useNavigate();
  const user = useStore(s => s.user);
  const setShowAuthModal = useStore(s => s.setShowAuthModal);
  const uploadListing = useStore(s => s.uploadListing);

  const [form, setForm] = useState({
    title: '',
    description: '',
    agentName: '',
    agentModel: '',
    price: '0',
    tags: '',
    file: null,
    isPublic: true,
  });
  const [step, setStep] = useState(1); // 1: form, 2: uploading, 3: done
  const [error, setError] = useState(null);
  const [createdId, setCreatedId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!form.file) {
      setError('请选择 .clawmem 文件');
      return;
    }

    setStep(2);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', form.file);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('agentName', form.agentName);
      formData.append('agentModel', form.agentModel);
      formData.append('price', form.price);
      if (form.tags) {
        formData.append('tags', JSON.stringify(
          form.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
        ));
      }

      const result = await uploadListing(formData);
      setCreatedId(result.id);
      setStep(3);
    } catch (err) {
      setError(err.error || 'Upload failed');
      setStep(1);
    }
  };

  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-2xl font-bold gradient-text mb-4">上传成功！</h2>
        <p className="text-mako-600 mb-8">
          你的记忆包已经上架到 SaveClaw 记忆存储市场。
        </p>
        <div className="flex gap-4 justify-center">
          {createdId && (
            <button
              onClick={() => navigate(`/listing/${createdId}`)}
              className="bg-claw-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-claw-primary/90 transition-all"
            >
              查看记忆包
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="bg-mako-300 text-mako-700 font-bold px-8 py-3 rounded-xl hover:bg-mako-400 transition-all"
          >
            返回市场
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="text-sm text-mako-600 hover:text-claw-primary transition-colors mb-6"
      >
        ← 返回市场
      </button>

      <h2 className="text-2xl font-bold gradient-text mb-2">上传记忆包</h2>
      <p className="text-mako-600 mb-4">
        将你的 .clawmem 文件上架到记忆存储市场
      </p>

      {/* 隐私脱敏提示 */}
      <div className="bg-claw-purple/10 border border-claw-purple/20 rounded-xl p-4 mb-8">
        <p className="text-sm text-claw-purple font-medium mb-2">🛡️ 隐私安全提示</p>
        <ul className="text-xs text-mako-600 space-y-1">
          <li>• 上传前请确保记忆文件中<strong className="text-mako-800">不包含 API 密钥、账号 ID、个人隐私数据</strong></li>
          <li>• 系统会自动检测并过滤常见的敏感信息模式（API Key / Token / 手机号等）</li>
          <li>• 建议使用 <code className="text-claw-primary">claw-memory pack --sanitize</code> 进行打包前脱敏</li>
        </ul>
      </div>

      {!user && (
        <div className="bg-claw-accent/10 border border-claw-accent/20 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-claw-accent">
            需要先
            <button
              onClick={() => setShowAuthModal(true)}
              className="underline font-bold mx-1"
            >
              登录
            </button>
            才能上传
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File upload */}
        <div className="bg-mako-200 border-2 border-dashed border-mako-400 rounded-xl p-8 text-center
                       hover:border-claw-primary/50 transition-colors cursor-pointer">
          <input
            type="file"
            accept=".clawmem,.zip"
            className="hidden"
            id="file-upload"
            onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="text-4xl mb-3">📦</div>
            {form.file ? (
              <div>
                <p className="text-claw-primary font-medium">{form.file.name}</p>
                <p className="text-xs text-mako-500 mt-1">
                  {(form.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-mako-700 font-medium">拖拽 .clawmem 文件到这里</p>
                <p className="text-xs text-mako-500 mt-1">或点击选择文件（最大 500MB）</p>
              </div>
            )}
          </label>
        </div>

        {/* CLI tip — 一键打包 */}
        <div className="bg-mako-100 border border-mako-300 rounded-xl p-4">
          <p className="text-xs text-mako-600 mb-2">💡 <strong>一键打包</strong>：还没有 .clawmem 文件？用 CLI 一键生成：</p>
          <code className="block bg-mako-200 rounded-lg px-4 py-2 text-sm text-claw-primary mb-2">
            npx claw-memory pack --agent main --output my-agent.clawmem
          </code>
          <p className="text-xs text-mako-500 mb-1">
            🛡️ 添加 <code className="text-claw-primary">--sanitize</code> 参数自动脱敏敏感信息（API Key / Token 等）
          </p>
          <p className="text-xs text-mako-500">
            🤖 打包时会自动读取 Claw bot 配置并作为记忆包头像
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm text-mako-700 mb-2">标题 *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="例：全栈开发助手 · 3个月精调记忆"
            className="w-full bg-mako-200 border border-mako-300 rounded-xl py-3 px-4
                       text-mako-800 placeholder-mako-500 text-sm
                       focus:outline-none focus:border-claw-primary transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-mako-700 mb-2">描述 *</label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="描述这个记忆包的能力、经验和特长..."
            className="w-full bg-mako-200 border border-mako-300 rounded-xl py-3 px-4
                       text-mako-800 placeholder-mako-500 text-sm resize-none
                       focus:outline-none focus:border-claw-primary transition-all"
          />
        </div>

        {/* Agent info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-mako-700 mb-2">Agent 名称</label>
            <input
              type="text"
              value={form.agentName}
              onChange={(e) => setForm({ ...form, agentName: e.target.value })}
              placeholder="例：main"
              className="w-full bg-mako-200 border border-mako-300 rounded-xl py-3 px-4
                         text-mako-800 placeholder-mako-500 text-sm
                         focus:outline-none focus:border-claw-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-mako-700 mb-2">AI 模型</label>
            <input
              type="text"
              value={form.agentModel}
              onChange={(e) => setForm({ ...form, agentModel: e.target.value })}
              placeholder="例：claude-3.5-sonnet"
              className="w-full bg-mako-200 border border-mako-300 rounded-xl py-3 px-4
                         text-mako-800 placeholder-mako-500 text-sm
                         focus:outline-none focus:border-claw-primary transition-all"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm text-mako-700 mb-2">定价 (USDT)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mako-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full bg-mako-200 border border-mako-300 rounded-xl py-3 pl-8 pr-4
                         text-mako-800 text-sm
                         focus:outline-none focus:border-claw-primary transition-all"
            />
          </div>
          <p className="text-xs text-mako-500 mt-1">设为 0 即为免费共享。平台收取 10% 手续费。</p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm text-mako-700 mb-2">标签（逗号分隔）</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="全栈, React, Python, DevOps"
            className="w-full bg-mako-200 border border-mako-300 rounded-xl py-3 px-4
                       text-mako-800 placeholder-mako-500 text-sm
                       focus:outline-none focus:border-claw-primary transition-all"
          />
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between bg-mako-200 border border-mako-300 rounded-xl p-4">
          <div>
            <p className="text-sm text-mako-700 font-medium">
              {form.isPublic ? '🌍 公开记忆' : '🔒 私有记忆'}
            </p>
            <p className="text-xs text-mako-500 mt-1">
              {form.isPublic
                ? '所有人可在市场浏览和购买'
                : '仅自己可见，不会出现在市场中'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              form.isPublic ? 'bg-claw-primary' : 'bg-mako-400'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                form.isPublic ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {error && (
          <div className="bg-claw-accent/10 border border-claw-accent/20 rounded-xl p-4 text-sm text-claw-accent">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={step === 2 || !user}
          className="w-full bg-claw-primary text-white font-bold py-4 rounded-xl
                   hover:bg-claw-primary/90 transition-all disabled:opacity-50"
        >
          {step === 2 ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> 上传中...
            </span>
          ) : (
            '🚀 上架到市场'
          )}
        </button>
      </form>
    </div>
  );
}
