import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function ContactSidebar() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
      {expanded ? (
        <div className="bg-mako-200 border border-mako-300 rounded-l-xl shadow-2xl p-4 w-56 animate-slide-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-mako-900">📞 联系我们</p>
            <button
              onClick={() => setExpanded(false)}
              className="text-mako-500 hover:text-mako-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="space-y-3 text-xs">
            <div className="bg-mako-100 rounded-lg p-3">
              <p className="text-mako-500 mb-1">微信</p>
              <p className="text-mako-800 font-mono select-all">15914190020</p>
            </div>
            <div className="bg-mako-100 rounded-lg p-3">
              <p className="text-mako-500 mb-1">QQ</p>
              <p className="text-mako-800 font-mono select-all">412199295</p>
            </div>
            <div className="bg-mako-100 rounded-lg p-3">
              <p className="text-mako-500 mb-1">GitHub</p>
              <a
                href="https://github.com/wcy412199295-web"
                target="_blank"
                rel="noopener noreferrer"
                className="text-claw-primary hover:underline"
              >
                @wcy412199295-web
              </a>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="bg-claw-primary text-white p-3 rounded-l-xl shadow-lg
                     hover:bg-claw-primary/90 transition-all hover:pr-5"
          title="联系我们"
        >
          <MessageCircle size={20} />
        </button>
      )}
    </div>
  );
}
