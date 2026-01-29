




// import { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { 
//   Server, 
//   Plus, 
//   Grid, 
//   List, 
//   Search,
//   AlertCircle,
//   CheckCircle,
//   X,
//   ArrowUpRight,
//   Play,
//   StopCircle,
//   RefreshCw,
//   Terminal,
//   Trash2
// } from 'lucide-react';
// import { serverAPI } from '../services/api';
// import LoadingSpinner from '../components/LoadingSpinner';

// const Servers = () => {
//   const [servers, setServers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [viewMode, setViewMode] = useState('grid');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showConsoleModal, setShowConsoleModal] = useState(false);
//   const [selectedServer, setSelectedServer] = useState(null);
//   const [message, setMessage] = useState({ type: '', text: '' });

//   // New server form state
//   const [newServer, setNewServer] = useState({ name: '', plan: 'Basic' });
//   const [creating, setCreating] = useState(false);

//   useEffect(() => {
//     fetchServers();
//   }, []);

//   const fetchServers = async () => {
//     try {
//       const result = await serverAPI.getServers();
//       if (result.success) {
//         setServers(result.servers);
//       }
//     } catch (err) {
//       showMessage('error', 'Failed to fetch servers');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showMessage = (type, text) => {
//     setMessage({ type, text });
//     setTimeout(() => setMessage({ type: '', text: '' }), 3000);
//   };

//   const handleStart = async (serverId) => {
//     const result = await serverAPI.startServer(serverId);
//     if (result.success) {
//       setServers(servers.map(s => s.id === serverId ? result.server : s));
//       showMessage('success', 'Server started successfully');
//     }
//   };

//   const handleStop = async (serverId) => {
//     const result = await serverAPI.stopServer(serverId);
//     if (result.success) {
//       setServers(servers.map(s => s.id === serverId ? result.server : s));
//       showMessage('success', 'Server stopped');
//     }
//   };

//   const handleRestart = async (serverId) => {
//     const result = await serverAPI.restartServer(serverId);
//     if (result.success) {
//       setServers(servers.map(s => s.id === serverId ? result.server : s));
//       showMessage('success', 'Server restarted');
//     }
//   };

//   const handleDelete = async (serverId) => {
//     if (!window.confirm('Are you sure you want to delete this server?')) return;
    
//     const result = await serverAPI.deleteServer(serverId);
//     if (result.success) {
//       setServers(servers.filter(s => s.id !== serverId));
//       showMessage('success', 'Server deleted');
//     }
//   };

//   const handleConsole = (serverId) => {
//     setSelectedServer(servers.find(s => s.id === serverId));
//     setShowConsoleModal(true);
//   };

//   const handleCreateServer = async (e) => {
//     e.preventDefault();
//     if (!newServer.name.trim()) {
//       showMessage('error', 'Server name is required');
//       return;
//     }

//     setCreating(true);
//     try {
//       const result = await serverAPI.createServer(newServer);
//       if (result.success) {
//         setServers([...servers, result.server]);
//         setShowCreateModal(false);
//         setNewServer({ name: '', plan: 'Basic' });
//         showMessage('success', 'Server created successfully');
//       }
//     } catch (err) {
//       showMessage('error', 'Failed to create server');
//     } finally {
//       setCreating(false);
//     }
//   };

//   const filteredServers = servers.filter(server =>
//     server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     server.ip.includes(searchQuery)
//   );

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-[60vh]">
//         <LoadingSpinner size="lg" text="Loading servers..." />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       {/* Header */}
//       <div className="flex justify-between items-end">
//         <div>
//           <h1 className="text-3xl font-bold mb-2">Server Management</h1>
//           <p className="text-gray-400 font-mono">
//             Deploy and manage your infrastructure
//             <span className="text-primary ml-4">
//               Total Servers: <span className="text-primary">{servers.length}</span>
//             </span>
//           </p>
//         </div>
//         <motion.button
//           className="group px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-all hover:scale-105 flex items-center gap-2"
//           onClick={() => setShowCreateModal(true)}
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.98 }}
//         >
//           <div className="flex items-center text-sm font-mono">
//             <Plus className="w-4 h-4 mr-2" />
//             Deploy Server
//             <ArrowUpRight className="w-4 h-4 ml-2 group-hover:rotate-45 transition-transform" />
//           </div>
//         </motion.button>
//       </div>

//       {/* Message Toast */}
//       <AnimatePresence>
//         {message.text && (
//           <motion.div
//             className={`
//               fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl
//               ${message.type === 'success' ? 'bg-primary/5 border border-primary/30 text-primary' : ''}
//               ${message.type === 'error' ? 'bg-red-500/5 border border-red-500/30 text-red-400' : ''}
//             `}
//             initial={{ opacity: 0, x: 100 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: 100 }}
//           >
//             {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
//             <span className="text-sm font-mono">{message.text}</span>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Controls */}
//       <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
//         <div className="flex flex-col md:flex-row gap-4 items-center">
//           {/* Search */}
//           <div className="relative flex-1 w-full">
//             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search servers by name or IP..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full bg-black/40 border border-primary/20 rounded-lg px-4 py-2 pl-10 text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
//             />
//           </div>

//           {/* View Toggle */}
//           <div className="flex items-center gap-2 border border-primary/20 rounded-lg p-1 bg-black/40">
//             <button
//               className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-300'}`}
//               onClick={() => setViewMode('grid')}
//             >
//               <Grid size={18} />
//             </button>
//             <button
//               className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-300'}`}
//               onClick={() => setViewMode('list')}
//             >
//               <List size={18} />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Servers Grid/List */}
//       {filteredServers.length === 0 ? (
//         <div className="p-12 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm text-center">
//           <Server size={48} className="mx-auto text-gray-500 mb-4" />
//           <h3 className="text-lg font-bold mb-2">No servers found</h3>
//           <p className="text-gray-500 mb-6 font-mono">
//             {searchQuery ? 'Try a different search term' : 'Deploy your first server to get started'}
//           </p>
//           {!searchQuery && (
//             <button
//               className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-all inline-flex items-center gap-2 font-mono text-sm"
//               onClick={() => setShowCreateModal(true)}
//             >
//               <Plus size={16} />
//               Deploy Server
//             </button>
//           )}
//         </div>
//       ) : (
//         <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
//           {filteredServers.map((server, index) => (
//             <motion.div
//               key={server.id}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//             >
//               <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm hover:border-primary/40 transition-all hover:scale-[1.02] group">
//                 {/* Server Header */}
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <div className="flex items-center gap-2 mb-2">
//                       <Server className="w-5 h-5 text-primary" />
//                       <h3 className="font-bold truncate">{server.name}</h3>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <div className={`w-2 h-2 rounded-full ${server.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
//                       <span className="text-xs font-mono text-gray-400">{server.status.toUpperCase()}</span>
//                       <span className="text-xs font-mono text-primary">·</span>
//                       <span className="text-xs font-mono text-gray-400">{server.ip}</span>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-1">
//                     <span className={`px-2 py-1 rounded text-xs font-mono ${server.plan === 'Enterprise' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : server.plan === 'Pro' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
//                       {server.plan}
//                     </span>
//                   </div>
//                 </div>

//                 {/* Server Stats */}
//                 <div className="grid grid-cols-2 gap-3 mb-4">
//                   <div className="p-3 rounded-lg border border-primary/10 bg-black/20">
//                     <p className="text-xs text-gray-500 mb-1">CPU</p>
//                     <p className="font-mono text-sm">{server.cpu || '4 vCPU'}</p>
//                   </div>
//                   <div className="p-3 rounded-lg border border-primary/10 bg-black/20">
//                     <p className="text-xs text-gray-500 mb-1">RAM</p>
//                     <p className="font-mono text-sm">{server.ram || '8GB'}</p>
//                   </div>
//                   <div className="p-3 rounded-lg border border-primary/10 bg-black/20">
//                     <p className="text-xs text-gray-500 mb-1">Storage</p>
//                     <p className="font-mono text-sm">{server.storage || '80GB'}</p>
//                   </div>
//                   <div className="p-3 rounded-lg border border-primary/10 bg-black/20">
//                     <p className="text-xs text-gray-500 mb-1">Uptime</p>
//                     <p className="font-mono text-sm">{server.uptime || '99.9%'}</p>
//                   </div>
//                 </div>

//                 {/* Action Buttons */}
//                 <div className="flex flex-wrap gap-2">
//                   <motion.button
//                     onClick={() => server.status === 'online' ? handleStop(server.id) : handleStart(server.id)}
//                     className="flex-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all"
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                   >
//                     {server.status === 'online' ? <StopCircle size={14} /> : <Play size={14} />}
//                     {server.status === 'online' ? 'Stop' : 'Start'}
//                   </motion.button>
//                   <motion.button
//                     onClick={() => handleRestart(server.id)}
//                     className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all"
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                   >
//                     <RefreshCw size={14} />
//                     Restart
//                   </motion.button>
//                   <motion.button
//                     onClick={() => handleConsole(server.id)}
//                     className="flex-1 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all"
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                   >
//                     <Terminal size={14} />
//                     Console
//                   </motion.button>
//                   <motion.button
//                     onClick={() => handleDelete(server.id)}
//                     className="flex-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all"
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                   >
//                     <Trash2 size={14} />
//                     Delete
//                   </motion.button>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       )}

//       {/* Create Server Modal */}
//       <AnimatePresence>
//         {showCreateModal && (
//           <motion.div
//             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setShowCreateModal(false)}
//           >
//             <motion.div
//               className="w-full max-w-md bg-black/90 backdrop-blur-sm border border-primary/20 rounded-xl shadow-2xl"
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="p-6">
//                 <div className="flex items-center justify-between mb-6">
//                   <h2 className="text-xl font-bold flex items-center gap-2">
//                     <Plus className="w-5 h-5 text-primary" />
//                     Deploy New Server
//                   </h2>
//                   <button
//                     onClick={() => setShowCreateModal(false)}
//                     className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-gray-400 hover:text-white"
//                   >
//                     <X size={20} />
//                   </button>
//                 </div>

//                 <form onSubmit={handleCreateServer} className="space-y-4">
//                   <div>
//                     <label className="block text-sm text-gray-400 mb-2 font-mono">
//                       Server Name
//                     </label>
//                     <input
//                       type="text"
//                       value={newServer.name}
//                       onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
//                       className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
//                       placeholder="my-awesome-server"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm text-gray-400 mb-2 font-mono">
//                       Server Plan
//                     </label>
//                     <div className="grid grid-cols-3 gap-3">
//                       {['Basic', 'Pro', 'Enterprise'].map((plan) => (
//                         <button
//                           key={plan}
//                           type="button"
//                           onClick={() => setNewServer({ ...newServer, plan })}
//                           className={`p-3 rounded-lg border text-sm font-mono transition-all ${newServer.plan === plan ? 'bg-primary/10 border-primary/30 text-primary' : 'border-primary/10 hover:border-primary/20 text-gray-400 hover:text-gray-300'}`}
//                         >
//                           {plan}
//                           <div className="text-xs text-gray-500 mt-1">
//                             {plan === 'Basic' ? '$5/mo' : plan === 'Pro' ? '$15/mo' : '$50/mo'}
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   </div>

//                   <div className="flex gap-3 pt-4">
//                     <button
//                       type="button"
//                       onClick={() => setShowCreateModal(false)}
//                       className="flex-1 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 border border-gray-700 rounded-lg font-mono text-sm transition-all"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="submit"
//                       className="flex-1 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg font-mono text-sm flex items-center justify-center gap-2 transition-all"
//                       disabled={creating}
//                     >
//                       {creating ? <LoadingSpinner size="sm" /> : <Plus size={16} />}
//                       {creating ? 'Deploying...' : 'Deploy Server'}
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Console Modal */}
//       <AnimatePresence>
//         {showConsoleModal && selectedServer && (
//           <motion.div
//             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setShowConsoleModal(false)}
//           >
//             <motion.div
//               className="w-full max-w-2xl bg-black/90 backdrop-blur-sm border border-primary/20 rounded-xl shadow-2xl"
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="p-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <h2 className="text-xl font-bold flex items-center gap-2">
//                     <Terminal className="w-5 h-5 text-primary" />
//                     Console - {selectedServer.name}
//                   </h2>
//                   <button
//                     onClick={() => setShowConsoleModal(false)}
//                     className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-gray-400 hover:text-white"
//                   >
//                     <X size={20} />
//                   </button>
//                 </div>

//                 <div className="bg-black/40 border border-primary/10 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
//                   <div className="text-primary">$ systemctl start wolfhost</div>
//                   <div className="text-gray-500">[INFO] Starting server instance...</div>
//                   <div className="text-gray-500">[INFO] Loading configuration from /etc/wolfhost/server.conf</div>
//                   <div className="text-primary">[OK] Server initialized on {selectedServer.ip}:25565</div>
//                   <div className="text-gray-500">[INFO] Memory allocated: {selectedServer.ram || '8GB'}</div>
//                   <div className="text-gray-500">[INFO] CPU cores: {selectedServer.cpu || '4'}</div>
//                   <div className="text-primary">[SUCCESS] Ready for connections!</div>
//                   <div className="mt-4">
//                     <div className="text-green-500">[STATUS] Server is running normally</div>
//                     <div className="text-gray-500">[METRICS] CPU: 12% | RAM: 45% | NET: 1.2MB/s</div>
//                   </div>
//                   <div className="mt-4 flex items-center">
//                     <span className="text-primary">wolfhost@server:~$ </span>
//                     <span className="ml-1 bg-primary/20 px-1 animate-pulse">█</span>
//                   </div>
//                 </div>

//                 <div className="mt-4 flex gap-2">
//                   <button className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded text-xs font-mono transition-all">
//                     Ctrl+C
//                   </button>
//                   <button className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded text-xs font-mono transition-all">
//                     Clear
//                   </button>
//                   <button className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded text-xs font-mono transition-all ml-auto">
//                     Copy Logs
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default Servers;






















import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, 
  Plus, 
  Grid, 
  List, 
  Search,
  AlertCircle,
  CheckCircle,
  X,
  ArrowUpRight,
  Play,
  StopCircle,
  RefreshCw,
  Terminal,
  Trash2
} from 'lucide-react';
import { serverAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Servers = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConsoleModal, setShowConsoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serverToDelete, setServerToDelete] = useState(null);
  const [selectedServer, setSelectedServer] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // New server form state
  const [newServer, setNewServer] = useState({ name: '', plan: 'Basic' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const result = await serverAPI.getServers();
      if (result.success) {
        setServers(result.servers);
      }
    } catch (err) {
      showMessage('error', 'Failed to fetch servers');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleStart = async (serverId) => {
    const result = await serverAPI.startServer(serverId);
    if (result.success) {
      setServers(servers.map(s => s.id === serverId ? result.server : s));
      showMessage('success', 'Server started successfully');
    }
  };

  const handleStop = async (serverId) => {
    const result = await serverAPI.stopServer(serverId);
    if (result.success) {
      setServers(servers.map(s => s.id === serverId ? result.server : s));
      showMessage('success', 'Server stopped');
    }
  };

  const handleRestart = async (serverId) => {
    const result = await serverAPI.restartServer(serverId);
    if (result.success) {
      setServers(servers.map(s => s.id === serverId ? result.server : s));
      showMessage('success', 'Server restarted');
    }
  };

  const handleDelete = async (serverId) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    setServerToDelete(server);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!serverToDelete) return;
    
    const result = await serverAPI.deleteServer(serverToDelete.id);
    if (result.success) {
      setServers(servers.filter(s => s.id !== serverToDelete.id));
      showMessage('success', `Server "${serverToDelete.name}" deleted successfully`);
    } else {
      showMessage('error', 'Failed to delete server');
    }
    
    setShowDeleteModal(false);
    setServerToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setServerToDelete(null);
  };

  const handleConsole = (serverId) => {
    setSelectedServer(servers.find(s => s.id === serverId));
    setShowConsoleModal(true);
  };

  const handleCreateServer = async (e) => {
    e.preventDefault();
    if (!newServer.name.trim()) {
      showMessage('error', 'Server name is required');
      return;
    }

    setCreating(true);
    try {
      const result = await serverAPI.createServer(newServer);
      if (result.success) {
        setServers([...servers, result.server]);
        setShowCreateModal(false);
        setNewServer({ name: '', plan: 'Basic' });
        showMessage('success', 'Server created successfully');
      }
    } catch (err) {
      showMessage('error', 'Failed to create server');
    } finally {
      setCreating(false);
    }
  };

  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.ip.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" text="Loading servers..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Server Management</h1>
          <p className="text-gray-400 font-mono">
            Deploy and manage your infrastructure
            <span className="text-primary ml-4">
              Total Servers: <span className="text-primary">{servers.length}</span>
            </span>
          </p>
        </div>
        <motion.button
          className="group px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-all hover:scale-105 flex items-center gap-2"
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center text-sm font-mono">
            <Plus className="w-4 h-4 mr-2" />
            Deploy Server
            <ArrowUpRight className="w-4 h-4 ml-2 group-hover:rotate-45 transition-transform" />
          </div>
        </motion.button>
      </div>

      {/* Message Toast */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            className={`
              fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl
              ${message.type === 'success' ? 'bg-primary/5 border border-primary/30 text-primary' : ''}
              ${message.type === 'error' ? 'bg-red-500/5 border border-red-500/30 text-red-400' : ''}
            `}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-mono">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search servers by name or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-primary/20 rounded-lg px-4 py-2 pl-10 text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 border border-primary/20 rounded-lg p-1 bg-black/40">
            <button
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={18} />
            </button>
            <button
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Servers Grid/List */}
      {filteredServers.length === 0 ? (
        <div className="p-12 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm text-center">
          <Server size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-bold mb-2">No servers found</h3>
          <p className="text-gray-500 mb-6 font-mono">
            {searchQuery ? 'Try a different search term' : 'Deploy your first server to get started'}
          </p>
          {!searchQuery && (
            <button
              className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-all inline-flex items-center gap-2 font-mono text-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              Deploy Server
            </button>
          )}
        </div>
      ) : (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredServers.map((server, index) => (
            <motion.div
              key={server.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="p-6 rounded-xl border border-primary/20 bg-black/30 backdrop-blur-sm hover:border-primary/40 transition-all hover:scale-[1.02] group">
                {/* Server Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="w-5 h-5 text-primary" />
                      <h3 className="font-bold truncate">{server.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${server.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-xs font-mono text-gray-400">{server.status.toUpperCase()}</span>
                      <span className="text-xs font-mono text-primary">·</span>
                      <span className="text-xs font-mono text-gray-400">{server.ip}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-1 rounded text-xs font-mono ${server.plan === 'Enterprise' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : server.plan === 'Pro' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                      {server.plan}
                    </span>
                  </div>
                </div>

                {/* Server Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg border border-primary/10 bg-black/20">
                    <p className="text-xs text-gray-500 mb-1">CPU</p>
                    <p className="font-mono text-sm">{server.cpu || '4 vCPU'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-primary/10 bg-black/20">
                    <p className="text-xs text-gray-500 mb-1">RAM</p>
                    <p className="font-mono text-sm">{server.ram || '8GB'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-primary/10 bg-black/20">
                    <p className="text-xs text-gray-500 mb-1">Storage</p>
                    <p className="font-mono text-sm">{server.storage || '80GB'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-primary/10 bg-black/20">
                    <p className="text-xs text-gray-500 mb-1">Uptime</p>
                    <p className="font-mono text-sm">{server.uptime || '99.9%'}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    onClick={() => server.status === 'online' ? handleStop(server.id) : handleStart(server.id)}
                    className="flex-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {server.status === 'online' ? <StopCircle size={14} /> : <Play size={14} />}
                    {server.status === 'online' ? 'Stop' : 'Start'}
                  </motion.button>
                  <motion.button
                    onClick={() => handleRestart(server.id)}
                    className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw size={14} />
                    Restart
                  </motion.button>
                  <motion.button
                    onClick={() => handleConsole(server.id)}
                    className="flex-1 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Terminal size={14} />
                    Console
                  </motion.button>
                  <motion.button
                    onClick={() => handleDelete(server.id)}
                    className="flex-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Server Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="w-full max-w-md bg-black/90 backdrop-blur-sm border border-primary/20 rounded-xl shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Deploy New Server
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateServer} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-mono">
                      Server Name
                    </label>
                    <input
                      type="text"
                      value={newServer.name}
                      onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                      className="w-full bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
                      placeholder="my-awesome-server"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-mono">
                      Server Plan
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Basic', 'Pro', 'Enterprise'].map((plan) => (
                        <button
                          key={plan}
                          type="button"
                          onClick={() => setNewServer({ ...newServer, plan })}
                          className={`p-3 rounded-lg border text-sm font-mono transition-all ${newServer.plan === plan ? 'bg-primary/10 border-primary/30 text-primary' : 'border-primary/10 hover:border-primary/20 text-gray-400 hover:text-gray-300'}`}
                        >
                          {plan}
                          <div className="text-xs text-gray-500 mt-1">
                            {plan === 'Basic' ? '$5/mo' : plan === 'Pro' ? '$15/mo' : '$50/mo'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 border border-gray-700 rounded-lg font-mono text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg font-mono text-sm flex items-center justify-center gap-2 transition-all"
                      disabled={creating}
                    >
                      {creating ? <LoadingSpinner size="sm" /> : <Plus size={16} />}
                      {creating ? 'Deploying...' : 'Deploy Server'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Console Modal */}
      <AnimatePresence>
        {showConsoleModal && selectedServer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConsoleModal(false)}
          >
            <motion.div
              className="w-full max-w-2xl bg-black/90 backdrop-blur-sm border border-primary/20 rounded-xl shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    Console - {selectedServer.name}
                  </h2>
                  <button
                    onClick={() => setShowConsoleModal(false)}
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-black/40 border border-primary/10 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                  <div className="text-primary">$ systemctl start wolfhost</div>
                  <div className="text-gray-500">[INFO] Starting server instance...</div>
                  <div className="text-gray-500">[INFO] Loading configuration from /etc/wolfhost/server.conf</div>
                  <div className="text-primary">[OK] Server initialized on {selectedServer.ip}:25565</div>
                  <div className="text-gray-500">[INFO] Memory allocated: {selectedServer.ram || '8GB'}</div>
                  <div className="text-gray-500">[INFO] CPU cores: {selectedServer.cpu || '4'}</div>
                  <div className="text-primary">[SUCCESS] Ready for connections!</div>
                  <div className="mt-4">
                    <div className="text-green-500">[STATUS] Server is running normally</div>
                    <div className="text-gray-500">[METRICS] CPU: 12% | RAM: 45% | NET: 1.2MB/s</div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-primary">wolfhost@server:~$ </span>
                    <span className="ml-1 bg-primary/20 px-1 animate-pulse">█</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded text-xs font-mono transition-all">
                    Ctrl+C
                  </button>
                  <button className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded text-xs font-mono transition-all">
                    Clear
                  </button>
                  <button className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded text-xs font-mono transition-all ml-auto">
                    Copy Logs
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && serverToDelete && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelDelete}
          >
            <motion.div
              className="w-full max-w-md bg-black/90 backdrop-blur-sm border border-red-500/20 rounded-xl shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    Confirm Deletion
                  </h2>
                  <button
                    onClick={cancelDelete}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg mb-4">
                    <Server className="w-5 h-5 text-red-400" />
                    <div>
                      <h3 className="font-bold">{serverToDelete.name}</h3>
                      <p className="text-xs text-gray-400 font-mono">{serverToDelete.ip} • {serverToDelete.plan} Plan</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-300">
                    <p className="mb-3">Are you sure you want to delete this server? This action <span className="text-red-400 font-bold">cannot be undone</span>.</p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li className="flex items-center gap-2">
                        <X size={12} className="text-red-400" />
                        All server data will be permanently deleted
                      </li>
                      <li className="flex items-center gap-2">
                        <X size={12} className="text-red-400" />
                        Any running services will be stopped immediately
                      </li>
                      <li className="flex items-center gap-2">
                        <X size={12} className="text-red-400" />
                        This action is irreversible
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 border border-gray-700 rounded-lg font-mono text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-mono text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Trash2 size={16} />
                    Yes, Delete Server
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Servers;