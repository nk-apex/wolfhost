import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Github, Zap, Search, X, Eye, EyeOff, Wallet, AlertCircle, Terminal, Server, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const TAG_COLORS = {
  bot:      'text-blue-400 bg-blue-500/10 border-blue-500/20',
  whatsapp: 'text-green-400 bg-green-500/10 border-green-500/20',
  telegram: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  discord:  'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  ai:       'text-purple-400 bg-purple-500/10 border-purple-500/20',
  api:      'text-orange-400 bg-orange-500/10 border-orange-500/20',
  utility:  'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  game:     'text-pink-400 bg-pink-500/10 border-pink-500/20',
};
const getTagColor = (tag) => TAG_COLORS[tag?.toLowerCase()] || TAG_COLORS.bot;

const isSecret = (key) => /key|secret|token|password|pass|auth|sid/i.test(key);

const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

export default function AvailableBots() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deploying, setDeploying] = useState(null);

  // Modal state
  const [selected, setSelected] = useState(null);
  const [deployMode, setDeployMode] = useState('panel'); // 'panel' | 'direct'
  const [serverName, setServerName] = useState('');
  const [envValues, setEnvValues] = useState({}); // { KEY: value }
  const [showSecrets, setShowSecrets] = useState({}); // { KEY: bool }

  // Live app.json state
  const [liveEnv, setLiveEnv] = useState(null);   // appJsonEnv from GitHub (fresh)
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(false);

  // Wallet
  const [balance, setBalance] = useState(null);

  useEffect(() => { fetchBots(); fetchBalance(); }, []);

  const fetchBots = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bots/catalog', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setBots(data.bots);
      else toast.error('Failed to load bots');
    } catch { toast.error('Failed to load bots'); }
    finally { setLoading(false); }
  };

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/wallet/balance', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setBalance(data.balance ?? data.balanceKES ?? 0);
    } catch {}
  };

  // Fetch live app.json when modal opens
  const fetchLiveAppJson = async (bot) => {
    setLiveEnv(null);
    setLiveError(false);
    setLiveLoading(true);
    try {
      const res = await fetch(`/api/bots/catalog/${bot.id}/live-appjson`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.appJsonEnv && Object.keys(data.appJsonEnv).length > 0) {
        setLiveEnv(data.appJsonEnv);
        // Pre-fill env values with empty strings
        const initial = {};
        Object.keys(data.appJsonEnv).forEach(k => { initial[k] = ''; });
        setEnvValues(initial);
      } else {
        // Fallback to cached
        const cached = bot.appJsonEnv || {};
        setLiveEnv(Object.keys(cached).length > 0 ? cached : null);
        const initial = {};
        Object.keys(cached).forEach(k => { initial[k] = ''; });
        setEnvValues(initial);
      }
    } catch {
      setLiveError(true);
      const cached = bot.appJsonEnv || {};
      setLiveEnv(Object.keys(cached).length > 0 ? cached : null);
    } finally {
      setLiveLoading(false);
    }
  };

  const openDeploy = (bot, mode = 'panel') => {
    setSelected(bot);
    setDeployMode(mode);
    setServerName(bot.name.replace(/[^a-zA-Z0-9_\-. ]/g, '').slice(0, 50));
    setEnvValues({});
    setShowSecrets({});
    fetchLiveAppJson(bot);
  };

  const closeModal = () => {
    if (deploying) return;
    setSelected(null);
    setLiveEnv(null);
  };

  const envSchema = liveEnv || selected?.appJsonEnv || {};
  const envKeys = Object.keys(envSchema);

  const handlePanelDeploy = async () => {
    if (!serverName.trim()) { toast.error('Server name is required'); return; }
    if (!/^[a-zA-Z0-9_\-. ]+$/.test(serverName)) { toast.error('Server name can only contain letters, numbers, spaces, _ - .'); return; }

    // Validate required fields
    const missing = envKeys.filter(k => envSchema[k]?.required && !envValues[k]?.trim());
    if (missing.length > 0) { toast.error(`Required: ${missing.join(', ')}`); return; }

    setDeploying(selected.id);
    try {
      // SESSION_ID is passed separately for backward compat; others go in envOverrides
      const sessionId = envValues['SESSION_ID'] || undefined;
      const envOverrides = {};
      envKeys.forEach(k => { if (k !== 'SESSION_ID' && envValues[k]?.trim()) envOverrides[k] = envValues[k].trim(); });

      const res = await fetch('/api/bots/deploy', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ botId: selected.id, serverName: serverName.trim(), sessionId, envOverrides }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${selected.name}" is deploying!`);
        closeModal();
        navigate(`/bots/deploying/${data.server.id}`, { state: { botName: selected.name, serverName: data.server.name } });
      } else {
        toast.error(data.message || 'Deployment failed');
      }
    } catch { toast.error('Deployment failed. Please try again.'); }
    finally { setDeploying(null); }
  };

  const handleDirectDeploy = async () => {
    if (!serverName.trim()) { toast.error('Server name is required'); return; }
    if (!selected.repoUrl) { toast.error('This bot has no repository URL for direct deployment.'); return; }

    const missing = envKeys.filter(k => envSchema[k]?.required && !envValues[k]?.trim());
    if (missing.length > 0) { toast.error(`Required: ${missing.join(', ')}`); return; }

    setDeploying(selected.id);
    try {
      const builtEnv = {};
      envKeys.forEach(k => { if (envValues[k]?.trim()) builtEnv[k] = envValues[k].trim(); });

      const res = await fetch('/api/bots/direct-deploy', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ botId: selected.id, serverName: serverName.trim(), envVars: builtEnv }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${selected.name}" is starting!`);
        closeModal();
        navigate(`/bots/direct/${data.deploymentId}/logs`, { state: { botName: selected.name, serverName: serverName.trim() } });
      } else {
        toast.error(data.message || 'Deployment failed');
      }
    } catch { toast.error('Deployment failed. Please try again.'); }
    finally { setDeploying(null); }
  };

  const handleDeploy = () => deployMode === 'direct' ? handleDirectDeploy() : handlePanelDeploy();

  const filtered = bots.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.description.toLowerCase().includes(search.toLowerCase()) ||
    (b.tag || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
            <Bot className="text-primary w-5 h-5 sm:w-6 sm:h-6" />
            Available Bots
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 font-mono">Deploy a bot to your server in one click</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/20 bg-black/30 self-start">
          <Wallet className="w-4 h-4 text-primary/70" />
          <span className="text-xs font-mono text-gray-400">Balance:</span>
          <span className="text-sm font-mono font-bold text-green-400" data-testid="text-wallet-balance">
            {balance === null ? '...' : `KES ${(balance || 0).toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          data-testid="input-search-bots"
          type="text"
          placeholder="Search bots by name or tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-primary/20 rounded-lg text-sm text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <Bot className="w-12 h-12 text-gray-700" />
          <p className="text-gray-500 font-mono text-sm">
            {search ? 'No bots match your search' : 'No bots available yet. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((bot, i) => (
            <motion.div
              key={bot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              data-testid={`card-bot-${bot.id}`}
              className="group relative p-4 rounded-xl border border-primary/15 bg-black/30 backdrop-blur-sm hover:border-primary/35 transition-all"
              style={{ boxShadow: '0 0 20px rgba(0,0,0,0.4)' }}
            >
              {/* Tag */}
              <span className={`absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full border ${getTagColor(bot.tag)}`}>
                {bot.tag || 'bot'}
              </span>

              {/* Icon + Name */}
              <div className="flex items-start gap-3 mb-3 pr-16">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white font-mono truncate" data-testid={`text-bot-name-${bot.id}`}>{bot.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-mono">KES {bot.priceKES}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-400 font-mono leading-relaxed mb-3 line-clamp-3" data-testid={`text-bot-desc-${bot.id}`}>
                {bot.description}
              </p>

              {/* Specs */}
              <div className="flex items-center gap-3 mb-4 text-[10px] font-mono text-gray-600">
                <span>{bot.ramMB || 512} MB RAM</span>
                <span>·</span>
                <span>{bot.diskMB || 1024} MB Disk</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  data-testid={`button-deploy-${bot.id}`}
                  onClick={() => openDeploy(bot, 'panel')}
                  title="Deploy to Pterodactyl panel (isolated container)"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-semibold hover:bg-primary/20 transition-all group-hover:border-primary/50"
                >
                  <Server className="w-3.5 h-3.5" />
                  Panel
                </button>
                {bot.repoUrl && (
                  <button
                    data-testid={`button-direct-deploy-${bot.id}`}
                    onClick={() => openDeploy(bot, 'direct')}
                    title="Deploy directly — live logs, no panel"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold hover:bg-emerald-500/20 transition-all"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Direct
                  </button>
                )}
                {bot.repoUrl && (
                  <a
                    href={bot.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`link-repo-${bot.id}`}
                    className="p-2 rounded-lg border border-gray-700/50 hover:border-primary/30 text-gray-500 hover:text-primary/80 transition-all"
                    title="View source"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Deploy Modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="w-full max-w-lg bg-black/95 border border-primary/30 rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
                {/* Modal header */}
                <div className="p-5 pb-4 border-b border-gray-700/40">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white font-mono">{selected.name}</h2>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getTagColor(selected.tag)}`}>
                          {selected.tag || 'bot'}
                        </span>
                      </div>
                    </div>
                    <button
                      data-testid="button-close-deploy-modal"
                      onClick={closeModal}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mode tabs */}
                  <div className="flex rounded-lg border border-gray-700/50 p-1 mt-4 gap-1">
                    <button
                      data-testid="tab-panel-deploy"
                      onClick={() => setDeployMode('panel')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
                        deployMode === 'panel'
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Server className="w-3.5 h-3.5" />
                      Panel Deploy
                    </button>
                    <button
                      data-testid="tab-direct-deploy"
                      onClick={() => setDeployMode('direct')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
                        deployMode === 'direct'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      Direct Deploy
                    </button>
                  </div>

                  <div className={`text-[10px] font-mono px-3 py-1.5 rounded-lg mt-2 ${
                    deployMode === 'direct'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300/80'
                      : 'bg-primary/5 border border-primary/15 text-gray-500'
                  }`}>
                    {deployMode === 'direct'
                      ? '⚡ Runs as a process on WolfHost server. Real-time logs. No panel needed.'
                      : '🐦 Isolated Docker container on Pterodactyl panel. Persistent.'}
                  </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">

                  {/* Balance warning */}
                  {balance !== null && balance < selected.priceKES && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300 font-mono">
                        Insufficient balance. Need KES {selected.priceKES}, have KES {(balance || 0).toFixed(2)}.{' '}
                        <a href="/billing" className="text-red-400 underline">Top up</a>
                      </p>
                    </div>
                  )}

                  {/* Server name */}
                  <div>
                    <label className="block text-xs text-gray-400 font-mono mb-1.5">Server Name *</label>
                    <input
                      data-testid="input-deploy-server-name"
                      type="text"
                      value={serverName}
                      onChange={e => setServerName(e.target.value)}
                      placeholder="e.g. my-whatsapp-bot"
                      maxLength={100}
                      className="w-full px-3 py-2.5 bg-black/60 border border-primary/20 rounded-lg text-sm text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <p className="text-[10px] text-gray-600 font-mono mt-1">Letters, numbers, spaces, _ - . only</p>
                  </div>

                  {/* Env vars from app.json — dynamic */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                        Configuration Variables
                        {liveLoading && <RefreshCw className="w-3 h-3 animate-spin text-primary/50" />}
                        {!liveLoading && liveError && <span className="text-[9px] text-yellow-500/70">(using cached)</span>}
                        {!liveLoading && !liveError && liveEnv && <span className="text-[9px] text-emerald-500/70">✓ live from repo</span>}
                      </label>
                      {envKeys.length > 0 && (
                        <span className="text-[9px] font-mono text-gray-600">{envKeys.length} var{envKeys.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>

                    {liveLoading ? (
                      <div className="flex items-center gap-2 py-4 px-3 rounded-lg border border-gray-700/30 bg-black/20">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary/50" />
                        <span className="text-xs text-gray-600 font-mono">Fetching latest config from repo…</span>
                      </div>
                    ) : envKeys.length === 0 ? (
                      <p className="text-[10px] text-gray-600 font-mono py-2">No configuration variables required.</p>
                    ) : (
                      <div className="space-y-3">
                        {envKeys.map(key => {
                          const cfg = envSchema[key] || {};
                          const secret = isSecret(key);
                          const visible = showSecrets[key];
                          return (
                            <div key={key}>
                              <label className="block text-[10px] font-mono text-gray-400 mb-1">
                                <span className="font-bold text-gray-300">{key}</span>
                                {cfg.required && <span className="text-red-400 ml-1">*</span>}
                                {!cfg.required && <span className="text-gray-600 ml-1">(optional)</span>}
                              </label>
                              <div className="relative">
                                <input
                                  data-testid={`input-env-${key.toLowerCase()}`}
                                  type={secret && !visible ? 'password' : 'text'}
                                  value={envValues[key] || ''}
                                  onChange={e => setEnvValues(v => ({ ...v, [key]: e.target.value }))}
                                  placeholder={cfg.placeholder || cfg.description || `Enter ${key}…`}
                                  className="w-full px-3 py-2.5 pr-10 bg-black/60 border border-primary/20 rounded-lg text-xs text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-primary/50 transition-colors"
                                />
                                {secret && (
                                  <button
                                    type="button"
                                    onClick={() => setShowSecrets(s => ({ ...s, [key]: !s[key] }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                                  >
                                    {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                              {cfg.description && (
                                <p className="text-[9px] text-gray-600 font-mono mt-0.5 leading-relaxed">{cfg.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Cost + specs */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/15">
                    <div className="text-xs font-mono text-gray-400">Deployment cost</div>
                    <div className="text-sm font-bold text-yellow-400 font-mono">KES {selected.priceKES}</div>
                  </div>
                  {deployMode === 'panel' && (
                    <div className="flex items-center gap-4 text-[10px] font-mono text-gray-600">
                      <span>RAM: {selected.ramMB || 512} MB</span>
                      <span>·</span>
                      <span>Disk: {selected.diskMB || 1024} MB</span>
                      <span>·</span>
                      <span>Auto-start: yes</span>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="p-5 pt-0 flex gap-3">
                  <button
                    data-testid="button-cancel-deploy"
                    onClick={closeModal}
                    disabled={!!deploying}
                    className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 text-sm font-mono hover:bg-white/5 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    data-testid="button-confirm-deploy"
                    onClick={handleDeploy}
                    disabled={!!deploying || liveLoading || (balance !== null && balance < selected.priceKES)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-mono font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      deployMode === 'direct'
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30'
                    }`}
                  >
                    {deploying === selected.id ? (
                      <><LoadingSpinner size="sm" /> Deploying…</>
                    ) : (
                      <>
                        {deployMode === 'direct' ? <Terminal className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        {deployMode === 'direct' ? 'Deploy Direct' : 'Deploy to Panel'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
