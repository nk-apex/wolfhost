import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, ExternalLink, Trash2, RefreshCw, Terminal, Zap, Clock, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const PANEL_URL = 'https://panel.xwolf.space';

export default function MyBots() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bots/my-deployments', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setDeployments(data.deployments);
      else toast.error('Failed to load deployments');
    } catch {
      toast.error('Failed to load deployments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dep) => {
    if (!window.confirm(`Delete "${dep.serverName}" bot? This will stop and remove the server.`)) return;
    setDeleting(dep.id);
    try {
      const res = await fetch(`/api/bots/my-deployments/${dep.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Bot removed');
        setDeployments(prev => prev.filter(d => d.id !== dep.id));
      } else {
        toast.error(data.message || 'Failed to remove bot');
      }
    } catch {
      toast.error('Failed to remove bot');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
    } catch { return iso; }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
            <Terminal className="text-primary w-5 h-5 sm:w-6 sm:h-6" />
            My Bots
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 font-mono">Your deployed bot instances</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="button-refresh-bots"
            onClick={fetchDeployments}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 text-xs text-primary font-mono hover:bg-primary/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <Link
            to="/available-bots"
            data-testid="link-browse-bots"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-xs text-primary font-mono font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Deploy New
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : deployments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center">
            <Bot className="w-8 h-8 text-gray-700" />
          </div>
          <div>
            <p className="text-gray-400 font-mono text-sm mb-1">No bots deployed yet</p>
            <p className="text-gray-600 font-mono text-xs">Browse the catalog and deploy your first bot</p>
          </div>
          <Link
            to="/available-bots"
            data-testid="link-go-to-catalog"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-sm text-primary font-mono font-semibold hover:bg-primary/20 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Browse Available Bots
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {deployments.map((dep, i) => (
            <motion.div
              key={dep.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              data-testid={`card-deployment-${dep.id}`}
              className="p-4 rounded-xl border border-primary/15 bg-black/30 backdrop-blur-sm hover:border-primary/25 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Icon + Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white font-mono truncate" data-testid={`text-bot-server-name-${dep.id}`}>
                        {dep.serverName}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-mono">
                        {dep.status || 'running'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-0.5" data-testid={`text-bot-name-${dep.id}`}>
                      {dep.botName}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] text-gray-600 font-mono">
                        <Clock className="w-3 h-3" />
                        {formatDate(dep.deployedAt)}
                      </span>
                      <span className="text-[10px] text-gray-700">·</span>
                      <span className="text-[10px] text-yellow-600 font-mono">KES {dep.priceKES} paid</span>
                      {dep.serverIdentifier && (
                        <>
                          <span className="text-[10px] text-gray-700">·</span>
                          <span className="text-[10px] text-gray-600 font-mono">ID: {dep.serverIdentifier}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {dep.serverIdentifier && (
                    <a
                      href={`${PANEL_URL}/server/${dep.serverIdentifier}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`link-panel-${dep.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 text-xs text-primary font-mono hover:bg-primary/10 transition-colors"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      Console
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    data-testid={`button-delete-bot-${dep.id}`}
                    onClick={() => handleDelete(dep)}
                    disabled={deleting === dep.id}
                    className="p-2 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all disabled:opacity-40"
                    title="Remove bot"
                  >
                    {deleting === dep.id ? <LoadingSpinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg border border-yellow-500/15 bg-yellow-500/5">
        <AlertCircle className="w-4 h-4 text-yellow-500/60 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 font-mono leading-relaxed">
          Click <strong className="text-gray-400">Console</strong> to open your bot on the panel — you can view logs, restart, and manage files. Deleting a bot here permanently removes its server.
        </p>
      </div>
    </div>
  );
}
