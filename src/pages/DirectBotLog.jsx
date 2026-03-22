import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, Bot, RefreshCw, Square, Trash2, RotateCcw, ArrowLeft, Circle } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';

const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const LOG_COLOR = {
  info:    'text-gray-300',
  warn:    'text-yellow-400',
  error:   'text-red-400',
  success: 'text-emerald-400',
};
const LOG_PREFIX = {
  info:    'INFO ',
  warn:    'WARN ',
  error:   'ERR  ',
  success: 'OK   ',
};

const STATUS_META = {
  queued:    { color: 'text-yellow-400', dot: 'bg-yellow-400', label: 'Queued' },
  deploying: { color: 'text-blue-400',   dot: 'bg-blue-400 animate-pulse', label: 'Installing…' },
  running:   { color: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse', label: 'Running' },
  stopped:   { color: 'text-gray-400',   dot: 'bg-gray-500', label: 'Stopped' },
  failed:    { color: 'text-red-400',    dot: 'bg-red-500', label: 'Failed' },
};

export default function DirectBotLog() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('queued');
  const [botName] = useState(state?.botName || 'Bot');
  const [serverName] = useState(state?.serverName || '');
  const [fetchedCount, setFetchedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef(null);
  const logBoxRef = useRef(null);
  const startTime = useRef(Date.now());
  const pollRef = useRef(null);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchLogs = async (since = 0) => {
    try {
      const res = await fetch(`/api/bots/direct/${id}/logs?since=${since}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success) return;
      setStatus(data.status);
      if (data.logs.length > 0) {
        setLogs(prev => [...prev, ...data.logs]);
        setFetchedCount(data.total);
      }
    } catch {}
    finally { setLoading(false); }
  };

  // Poll every 2.5s, stop when stopped/failed
  useEffect(() => {
    fetchLogs(0);
    pollRef.current = setInterval(() => {
      setFetchedCount(prev => {
        fetchLogs(prev);
        return prev;
      });
    }, 2500);
    return () => clearInterval(pollRef.current);
  }, [id]);

  // Stop polling when terminal state reached
  useEffect(() => {
    if (status === 'stopped' || status === 'failed') {
      clearInterval(pollRef.current);
    }
  }, [status]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    const el = logBoxRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(atBottom);
  };

  const doAction = async (endpoint, method = 'POST', successMsg, onSuccess) => {
    setActionBusy(true);
    try {
      const res = await fetch(`/api/bots/direct/${id}/${endpoint}`, { method, headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        toast.success(successMsg);
        if (onSuccess) onSuccess();
      } else {
        toast.error(data.message || 'Action failed');
      }
    } catch { toast.error('Action failed'); }
    finally { setActionBusy(false); }
  };

  const handleStop = () => doAction('stop', 'POST', 'Bot stopped', () => setStatus('stopped'));
  const handleRestart = () => {
    doAction('restart', 'POST', 'Bot restarting…', () => {
      setLogs([]);
      setFetchedCount(0);
      setStatus('queued');
      startTime.current = Date.now();
      clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        setFetchedCount(prev => { fetchLogs(prev); return prev; });
      }, 2500);
      fetchLogs(0);
    });
  };
  const handleDelete = () => {
    if (!window.confirm(`Delete "${serverName || botName}" permanently? This cannot be undone.`)) return;
    doAction('', 'DELETE', 'Deployment deleted', () => navigate('/my-bots'));
  };

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const meta = STATUS_META[status] || STATUS_META.queued;

  return (
    <div className="space-y-5 pb-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/my-bots')}
            className="p-2 rounded-lg border border-gray-700/50 text-gray-500 hover:text-white hover:border-primary/30 transition-all"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              {serverName || botName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${meta.color} border-current/20 bg-current/5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
              <span className="text-[10px] font-mono text-gray-600">⏱ {fmtTime(elapsed)}</span>
              <span className="text-[10px] font-mono text-gray-600">{logs.length} lines</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {(status === 'running' || status === 'deploying') && (
            <button
              data-testid="button-stop-bot"
              onClick={handleStop}
              disabled={actionBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-400 text-xs font-mono hover:bg-yellow-500/10 transition-all disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
          )}
          {(status === 'stopped' || status === 'failed') && (
            <button
              data-testid="button-restart-bot"
              onClick={handleRestart}
              disabled={actionBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 text-xs font-mono hover:bg-emerald-500/10 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart
            </button>
          )}
          <button
            data-testid="button-delete-bot"
            onClick={handleDelete}
            disabled={actionBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-mono hover:bg-red-500/10 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Terminal log box */}
      <div
        className="rounded-xl border border-emerald-500/20 bg-black/80 backdrop-blur-sm overflow-hidden"
        style={{ boxShadow: '0 0 40px rgba(0,0,0,0.6)' }}
      >
        {/* Terminal titlebar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-500/15 bg-black/60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            <span className="text-[10px] font-mono text-gray-600 ml-2">stdout/stderr — {botName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(v => !v)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                autoScroll ? 'border-emerald-500/40 text-emerald-400' : 'border-gray-700 text-gray-600'
              }`}
              data-testid="button-autoscroll"
            >
              auto-scroll {autoScroll ? 'on' : 'off'}
            </button>
            <button
              onClick={() => { setLogs([]); setFetchedCount(0); fetchLogs(0); }}
              className="text-[10px] font-mono text-gray-600 hover:text-gray-400 transition-colors"
              data-testid="button-clear-logs"
            >
              clear
            </button>
          </div>
        </div>

        {/* Log lines */}
        <div
          ref={logBoxRef}
          onScroll={handleScroll}
          className="h-[420px] overflow-y-auto p-4 font-mono space-y-0.5"
          style={{ scrollBehavior: 'smooth' }}
          data-testid="log-terminal"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="md" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Terminal className="w-8 h-8 text-gray-700" />
              <p className="text-xs text-gray-600 font-mono">
                {status === 'queued' ? 'Waiting for deployment to start…' : 'No logs yet.'}
              </p>
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 leading-5">
                <span className="text-[9px] text-gray-700 flex-shrink-0 mt-0.5 w-16 text-right">
                  {log.ts ? new Date(log.ts).toLocaleTimeString('en-GB', { hour12: false }) : ''}
                </span>
                <span className={`text-[10px] flex-shrink-0 font-bold w-10 ${LOG_COLOR[log.level] || 'text-gray-400'}`}>
                  {LOG_PREFIX[log.level] || '     '}
                </span>
                <span className={`text-[11px] break-all ${LOG_COLOR[log.level] || 'text-gray-300'}`}>
                  {log.msg}
                </span>
              </div>
            ))
          )}

          {/* Blinking cursor while running */}
          {(status === 'running' || status === 'deploying' || status === 'queued') && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[11px] text-emerald-500 font-mono">$</span>
              <span className="w-2 h-3.5 bg-emerald-500/80 animate-pulse rounded-sm" />
            </div>
          )}

          <div ref={logEndRef} />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Type', value: 'Direct Process' },
          { label: 'Bot', value: botName },
          { label: 'Status', value: meta.label },
          { label: 'Uptime', value: fmtTime(elapsed) },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 rounded-lg border border-gray-700/40 bg-black/30">
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-xs font-mono text-white truncate">{value}</div>
          </div>
        ))}
      </div>

      {/* Notice about direct deployments */}
      <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-[10px] font-mono text-yellow-300/70 leading-relaxed">
        ⚠ Direct deployments run as a process on the WolfHost server. They will stop if the server restarts. Use{' '}
        <span className="text-yellow-300 font-bold">Restart</span> to bring the bot back up, or deploy to the{' '}
        <span className="text-yellow-300 font-bold">Panel</span> for persistent container hosting.
      </div>
    </div>
  );
}
