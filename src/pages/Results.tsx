import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { 
  TrendingUp, 
  Calendar, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Menu,
  X,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDynamic } from "@/hooks/useDynamic";
import { getAnalysisWithResults, subscribeToAnalysis } from "@/lib/api";
import type { Analysis, ModelPrediction, Timeline, Insights, Sources } from "@/lib/supabase";

export default function Results() {
  const [, params] = useRoute("/results/:id");
  const [, setLocation] = useLocation();
  const { walletAddress, radarBalance, connectWallet, disconnectWallet } = useDynamic();

  const analysisId = params?.id;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [predictions, setPredictions] = useState<ModelPrediction[]>([]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [sources, setSources] = useState<Sources | null>(null);
  const [expandedPredictions, setExpandedPredictions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('predictions');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs for sections
  const predictionsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const sourcesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!analysisId) {
      setLocation('/');
      return;
    }

    getAnalysisWithResults(analysisId).then((data) => {
      setAnalysis(data.analysis);
      setPredictions(data.predictions);
      setTimeline(data.timeline);
      setInsights(data.insights);
      setSources(data.sources);
      setIsLoading(false);
    }).catch((error) => {
      console.error('Failed to load analysis:', error);
      setIsLoading(false);
    });

    const unsubscribe = subscribeToAnalysis(analysisId, (update) => {
      if (update.analysis) setAnalysis(update.analysis);
      if (update.predictions) setPredictions(update.predictions);
      if (update.timeline) setTimeline(update.timeline);
      if (update.insights) setInsights(update.insights);
      if (update.sources) setSources(update.sources);
    });

    return () => unsubscribe();
  }, [analysisId, setLocation]);

  // Scroll to section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>, section: string) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Intersection observer for active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id) setActiveSection(id);
          }
        });
      },
      { 
        threshold: 0.3,
        rootMargin: '-100px 0px -50% 0px'
      }
    );

    if (predictionsRef.current) observer.observe(predictionsRef.current);
    if (timelineRef.current) observer.observe(timelineRef.current);
    if (insightsRef.current) observer.observe(insightsRef.current);
    if (sourcesRef.current) observer.observe(sourcesRef.current);

    return () => observer.disconnect();
  }, [predictions, timeline, insights, sources]);

  const togglePrediction = (modelName: string) => {
    setExpandedPredictions(prev => {
      const next = new Set(prev);
      if (next.has(modelName)) {
        next.delete(modelName);
      } else {
        next.add(modelName);
      }
      return next;
    });
  };

  const getModelIcon = (modelName: string) => {
    const iconClass = "w-5 h-5";
    switch (modelName) {
      case 'model1':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        );
      case 'model2':
        return <Lightbulb className={iconClass} />;
      case 'model3':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      case 'model4':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
          </svg>
        );
      default:
        return <TrendingUp className={iconClass} />;
    }
  };

  const getModelGradient = (modelName: string) => {
    switch (modelName) {
      case 'model1':
        return 'from-purple-500 to-purple-600';
      case 'model2':
        return 'from-pink-500 to-pink-600';
      case 'model3':
        return 'from-cyan-500 to-cyan-600';
      case 'model4':
        return 'from-amber-500 to-amber-600';
      default:
        return 'from-purple-500 to-purple-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'from-purple-500 to-purple-600';
    if (confidence >= 60) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading analysis...</p>
        </motion.div>
      </div>
    );
  }

  const NavButton = ({ section, icon: Icon, label, ref }: any) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => scrollToSection(ref, section)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        activeSection === section
          ? 'bg-purple-950/50 text-purple-400 border border-purple-500/50'
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </motion.button>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Desktop Sidebar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:block w-60 p-6 sticky top-20 h-screen"
      >
        <div className="space-y-2">
          <NavButton section="predictions" icon={TrendingUp} label="Predictions" ref={predictionsRef} />
          <NavButton section="timeline" icon={Calendar} label="Timeline" ref={timelineRef} />
          <NavButton section="insights" icon={Lightbulb} label="Key Insights" ref={insightsRef} />
          <NavButton section="sources" icon={ExternalLink} label="Sources" ref={sourcesRef} />
        </div>
      </motion.div>

      {/* Mobile Menu Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-20 left-4 z-50 p-3 rounded-lg"
        style={{ backgroundColor: '#1a1a1a', border: '1px solid #333333' }}
      >
        {isMobileMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
      </motion.button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="md:hidden fixed inset-y-0 left-0 z-40 w-64 p-6"
            style={{ backgroundColor: '#1a1a1a', borderRight: '1px solid #333333' }}
          >
            <div className="mt-24 space-y-2">
              <NavButton section="predictions" icon={TrendingUp} label="Predictions" ref={predictionsRef} />
              <NavButton section="timeline" icon={Calendar} label="Timeline" ref={timelineRef} />
              <NavButton section="insights" icon={Lightbulb} label="Key Insights" ref={insightsRef} />
              <NavButton section="sources" icon={ExternalLink} label="Sources" ref={sourcesRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header
          walletAddress={walletAddress}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
          radarBalance={radarBalance}
        />

        <main className="flex-1 p-4 md:p-8 space-y-16">
          {/* PREDICTIONS Section */}
          <motion.div
            ref={predictionsRef}
            data-section="predictions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-white">
              PREDICTIONS
            </h2>
            
            {predictions.length === 0 ? (
              <div className="p-8 rounded-xl text-center text-gray-400" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333333' }}>
                No predictions available yet
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333333', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                {/* Table Header - Desktop Only */}
                <div className="hidden md:grid grid-cols-5 gap-4 p-4 border-b" style={{ borderColor: 'rgba(51,51,51,0.3)' }}>
                  <div className="text-sm font-semibold text-gray-400">Model</div>
                  <div className="text-sm font-semibold text-gray-400">Outcome</div>
                  <div className="text-sm font-semibold text-gray-400">Confidence</div>
                  <div className="text-sm font-semibold text-gray-400">Reasoning</div>
                  <div className="text-sm font-semibold text-gray-400 text-center">Sources</div>
                </div>

                {/* Table Rows */}
                {predictions.map((prediction, index) => (
                  <motion.div
                    key={prediction.model_name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b last:border-b-0 hover:bg-gray-900/30 transition-all duration-200"
                    style={{ borderColor: 'rgba(51,51,51,0.3)' }}
                  >
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-4 items-center">
                        {/* Model */}
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 bg-gradient-to-br ${getModelGradient(prediction.model_name)} rounded-lg flex items-center justify-center text-white`}>
                            {getModelIcon(prediction.model_name)}
                          </div>
                          <span className="font-semibold text-white">
                            Model {prediction.model_name.replace('model', '')}
                          </span>
                        </div>

                        {/* Outcome */}
                        <div className="flex items-center gap-2">
                          {prediction.status === 'success' ? (
                            <span className="inline-block px-3 py-1 rounded-md font-semibold text-base" style={{ backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                              {prediction.outcome}
                            </span>
                          ) : prediction.status === 'error' ? (
                            <>
                              <XCircle className="h-5 w-5 text-red-400" />
                              <span className="text-red-400">Error</span>
                            </>
                          ) : (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                              <span className="text-gray-400">Processing...</span>
                            </>
                          )}
                        </div>

                        {/* Confidence */}
                        <div className="space-y-2">
                          {prediction.status === 'success' && prediction.confidence_percent !== null ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-white">{prediction.confidence_percent}%</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#333333', width: '80px' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${prediction.confidence_percent}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                                  className={`h-full bg-gradient-to-r ${getConfidenceColor(prediction.confidence_percent)} rounded-full`}
                                />
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </div>

                        {/* Reasoning */}
                        <div>
                          {prediction.status === 'success' && prediction.reasoning ? (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => togglePrediction(prediction.model_name)}
                              className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors duration-200"
                            >
                              View Details
                              {expandedPredictions.has(prediction.model_name) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </motion.button>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </div>

                        {/* Sources */}
                        <div className="text-center">
                          {prediction.status === 'success' && prediction.sources_count !== null ? (
                            <span className="font-mono text-gray-400 text-sm">
                              {prediction.sources_count}
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Reasoning */}
                      <AnimatePresence>
                        {expandedPredictions.has(prediction.model_name) && prediction.reasoning && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6 pt-6 border-t"
                            style={{ borderColor: 'rgba(51,51,51,0.3)', backgroundColor: 'rgba(139,92,246,0.05)' }}
                          >
                            <div className="p-6 rounded-lg">
                              <p className="text-gray-300 leading-relaxed text-sm">{prediction.reasoning}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* TIMELINE Section */}
          <motion.div
            ref={timelineRef}
            data-section="timeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-white">
              TIMELINE
            </h2>
            
            {!timeline || timeline.status === 'processing' ? (
              <div className="p-12 rounded-xl" style={{ backgroundColor: 'rgba(26, 26, 26, 0.3)', border: '1px solid rgba(51, 51, 51, 0.3)' }}>
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 text-purple-400 animate-spin mb-4" />
                  <p className="text-gray-300 text-lg font-medium mb-2">Analyzing Timeline</p>
                  <p className="text-gray-500 text-sm">Extracting key events and dates...</p>
                </div>
              </div>
            ) : timeline.status === 'success' && timeline.events && timeline.events.length > 0 ? (
              <TooltipProvider>
                {(() => {
                  const sortedEvents = [...timeline.events].sort((a, b) => {
                    const dateA = new Date(a.date || '9999-12-31').getTime();
                    const dateB = new Date(b.date || '9999-12-31').getTime();
                    return dateA - dateB;
                  });
                  
                  return (
                <div className="py-12 px-12 rounded-xl" style={{ backgroundColor: 'rgba(26, 26, 26, 0.3)', border: '1px solid rgba(51, 51, 51, 0.3)' }}>
                  {/* Desktop: Horizontal Timeline */}
                  <div className="hidden md:block relative w-full py-12">
                    {/* Enhanced gradient line */}
                    <div 
                      className="absolute left-0 right-0"
                      style={{ 
                        top: '50%',
                        height: '2px',
                        zIndex: 1,
                        background: 'linear-gradient(to right, rgba(139,92,246,0.5) 0%, rgba(236,72,153,0.5) 50%, rgba(139,92,246,0.5) 100%)',
                        transform: 'translateY(-50%)'
                      }}
                    />
                    
                    {/* Events */}
                    <div className="relative flex justify-between items-center" style={{ zIndex: 10 }}>
                      {sortedEvents.map((event, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.2 + 0.5 }}
                              className="flex flex-col items-center cursor-pointer group"
                            >
                              {/* Enhanced circle with glow on hover */}
                              <div 
                                className="w-5 h-5 rounded-full border-2 transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg"
                                style={{ 
                                  backgroundColor: '#0a0a0a',
                                  borderColor: '#8b5cf6',
                                  position: 'relative',
                                  zIndex: 10,
                                  boxShadow: '0 0 0 rgba(139, 92, 246, 0)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.6)';
                                  e.currentTarget.style.borderWidth = '3px';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.boxShadow = '0 0 0 rgba(139, 92, 246, 0)';
                                  e.currentTarget.style.borderWidth = '2px';
                                }}
                              />
                              
                              {/* Brighter date with hover effect */}
                              <div className="text-[15px] font-semibold font-mono text-gray-200 mt-3 group-hover:text-purple-400 transition-colors duration-200">
                                {event.date || 'TBD'}
                              </div>
                              
                              {/* Better label */}
                              <div className="text-[13px] text-gray-400 mt-1.5">
                                {event.title}
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent 
                            className="max-w-xs rounded-lg p-3"
                            style={{ 
                              backgroundColor: '#1a1a1a', 
                              border: '1px solid rgba(139,92,246,0.5)',
                              boxShadow: '0 10px 15px rgba(139,92,246,0.2)'
                            }}
                          >
                            <p className="text-sm text-gray-300">{event.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  {/* Mobile: Vertical Timeline */}
                  <div className="md:hidden space-y-6">
                    {sortedEvents.map((event, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4"
                      >
                        {/* Marker and Line */}
                        <div className="flex flex-col items-center">
                          <div 
                            className="w-4 h-4 rounded-full border-3"
                            style={{ 
                              backgroundColor: '#0a0a0a',
                              borderWidth: '3px',
                              borderColor: '#8b5cf6'
                            }}
                          />
                          {index < sortedEvents.length - 1 && (
                            <div 
                              className="w-0.5 flex-1 mt-2"
                              style={{ backgroundColor: 'rgba(139,92,246,0.3)', minHeight: '40px' }}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-6">
                          <div className="font-mono text-sm text-gray-300 mb-1">
                            {event.date || 'TBD'}
                          </div>
                          <div className="text-sm font-semibold text-white mb-2">
                            {event.title}
                          </div>
                          <div className="text-xs text-gray-400">
                            {event.description}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                  );
                })()}
              </TooltipProvider>
            ) : (
              <div className="p-8 rounded-xl text-center text-gray-400" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333333' }}>
                Timeline not available yet
              </div>
            )}
          </motion.div>

          {/* KEY INSIGHTS Section */}
          <motion.div
            ref={insightsRef}
            data-section="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-white">
              KEY INSIGHTS
            </h2>
            
            {!insights || insights.status === 'processing' ? (
              <div className="p-12 rounded-xl" style={{ backgroundColor: 'rgba(26, 26, 26, 0.3)', border: '1px solid rgba(51, 51, 51, 0.3)' }}>
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 text-purple-400 animate-spin mb-4" />
                  <p className="text-gray-300 text-lg font-medium mb-2">Generating Insights</p>
                  <p className="text-gray-500 text-sm">Analyzing predictions and identifying key patterns...</p>
                </div>
              </div>
            ) : insights.status === 'success' && insights.content ? (
              <div className="space-y-4">
                {/* Agreement */}
                {insights.content.agreement && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-xl transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(139,92,246,0.08)',
                      borderLeft: '4px solid #8b5cf6'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">{insights.content.agreement.title}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{insights.content.agreement.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Divergence */}
                {insights.content.divergence && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 rounded-xl transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(245,158,11,0.08)',
                      borderLeft: '4px solid #f59e0b'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-6 w-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">{insights.content.divergence.title}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{insights.content.divergence.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Risks */}
                {insights.content.risks && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="p-6 rounded-xl transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(245,158,11,0.08)',
                      borderLeft: '4px solid #f59e0b'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-6 w-6 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-3">{insights.content.risks.title}</h3>
                        <ul className="space-y-2">
                          {insights.content.risks.items.map((risk, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + index * 0.1 }}
                              className="flex items-start gap-2 text-gray-300 text-sm"
                            >
                              <span className="text-amber-400 mt-1">•</span>
                              <span>{risk}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-xl text-center text-gray-400" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333333' }}>
                Insights not available yet
              </div>
            )}
          </motion.div>

          {/* SOURCES Section */}
          <motion.div
            ref={sourcesRef}
            data-section="sources"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-white">
              SOURCES
            </h2>
            
            {!sources || sources.status === 'processing' ? (
              <div className="p-12 rounded-xl" style={{ backgroundColor: 'rgba(26, 26, 26, 0.3)', border: '1px solid rgba(51, 51, 51, 0.3)' }}>
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 text-purple-400 animate-spin mb-4" />
                  <p className="text-gray-300 text-lg font-medium mb-2">Collecting Sources</p>
                  <p className="text-gray-500 text-sm">Gathering relevant news articles and references...</p>
                </div>
              </div>
            ) : sources.status === 'success' && sources.links && sources.links.length > 0 ? (
              <div className="space-y-3">
                {sources.links.map((link, index) => (
                  <motion.a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 group"
                    style={{ 
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333333'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a1a1a';
                      e.currentTarget.style.borderColor = '#333333';
                    }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}>
                      <span className="text-sm font-mono font-semibold text-purple-400">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate group-hover:text-purple-300 transition-colors">
                        {link}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                  </motion.a>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl text-center text-gray-400" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333333' }}>
                Sources not available yet
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

