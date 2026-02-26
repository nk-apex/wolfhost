import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, BookOpen, Search, X, ExternalLink, Loader2 } from 'lucide-react';

const categoryColors = {
  'General': 'primary',
  'Getting Started': 'green',
  'Payments': 'blue',
  'Deployment': 'purple',
  'Server Management': 'yellow',
};

const Tutorials = () => {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const res = await fetch('/api/tutorials');
      const data = await res.json();
      if (data.success) {
        setTutorials(data.tutorials);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(tutorials.map(t => t.category || 'General'))];

  const filtered = tutorials.filter(t => {
    const matchesSearch = !searchQuery || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getColorClasses = (category) => {
    const color = categoryColors[category] || 'primary';
    const map = {
      primary: 'border-primary/20 bg-primary/5 text-primary',
      green: 'border-green-500/20 bg-green-500/5 text-green-400',
      blue: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
      purple: 'border-purple-500/20 bg-purple-500/5 text-purple-400',
      yellow: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400',
    };
    return map[color] || map.primary;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Tutorials</h1>
          <p className="text-sm font-mono text-gray-400">Learn how to use WolfHost</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-primary/20 rounded-lg text-sm font-mono text-white placeholder:text-gray-500 focus:border-primary/50 focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-lg font-mono text-xs whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary/20 text-white border border-primary/30'
                  : 'text-gray-400 hover:text-white hover:bg-primary/5 border border-primary/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-mono">
            {tutorials.length === 0 ? 'No tutorials available yet.' : 'No tutorials match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tutorial, index) => (
            <motion.div
              key={tutorial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group rounded-xl border border-primary/10 bg-black/30 overflow-hidden hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => setActiveVideo(tutorial)}
            >
              <div className="relative aspect-video bg-black/50 flex items-center justify-center overflow-hidden">
                {tutorial.youtubeId ? (
                  <>
                    <img
                      src={`https://img.youtube.com/vi/${tutorial.youtubeId}/mqdefault.jpg`}
                      alt={tutorial.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <PlayCircle className="w-10 h-10 text-gray-600" />
                    <span className="text-xs font-mono text-gray-500">Video</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-2">{tutorial.title}</h3>
                </div>
                {tutorial.description && (
                  <p className="text-xs font-mono text-gray-400 line-clamp-2 mb-3">{tutorial.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getColorClasses(tutorial.category)}`}>
                    {tutorial.category || 'General'}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">
                    {new Date(tutorial.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl rounded-xl border border-primary/20 bg-black/95 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-primary/10">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">{activeVideo.title}</h3>
                  {activeVideo.description && (
                    <p className="text-xs font-mono text-gray-400 mt-1 line-clamp-1">{activeVideo.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {activeVideo.videoUrl && (
                    <a
                      href={activeVideo.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-gray-400 hover:text-primary"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => setActiveVideo(null)}
                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="aspect-video">
                {activeVideo.youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1`}
                    title={activeVideo.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <PlayCircle className="w-16 h-16 text-gray-600" />
                    <a
                      href={activeVideo.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-sm hover:bg-primary/20 transition-colors flex items-center gap-2"
                    >
                      <ExternalLink size={14} />
                      Open Video
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tutorials;
