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
  X
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDynamic } from "@/hooks/useDynamic";
import { getAnalysisWithResults, subscribeToAnalysis } from "@/lib/api";
import type { Analysis, ModelPrediction, Timeline, Insights } from "@/lib/supabase";

export default function Results() {
  const [, params] = useRoute("/results/:id");
  const [, setLocation] = useLocation();
  const { walletAddress, radarBalance, connectWallet, disconnectWallet } = useDynamic();

  const analysisId = params?.id;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [predictions, setPredictions] = useState<ModelPrediction[]>([]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [expandedPredictions, setExpandedPredictions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('predictions');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs for sections
  const predictionsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);

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
      { threshold: 0.3 }
    );

    if (predictionsRef.current) observer.observe(predictionsRef.current);
    if (timelineRef.current) observer.observe(timelineRef.current);
    if (insightsRef.current) observer.observe(insightsRef.current);

    return () => observer.disconnect();
  }, []);

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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'from-purple-600 to-purple-500';
    if (confidence >= 70) return 'from-orange-500 to-orange-400';
    return 'from-orange-600 to-red-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
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
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => scrollToSection(ref, section)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeSection === section
          ? 'bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/30 shadow-lg shadow-purple-500/10'
          : 'hover:bg-gray-800/50'
      }`}
    >
      <Icon className={`h-5 w-5 ${activeSection === section ? 'text-purple-400' : 'text-gray-500'}`} />
      <span className={`font-medium ${activeSection === section ? 'text-white' : 'text-gray-400'}`}>
        {label}
      </span>
    </motion.button>
  );

  return (
    <div className="min-h-screen flex bg-black">
      {/* Desktop Sidebar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:block w-64 bg-gray-900/50 border-r border-gray-800 p-6 backdrop-blur-sm"
      >
        <div className="space-y-3">
          <NavButton section="predictions" icon={TrendingUp} label="Predictions" ref={predictionsRef} />
          <NavButton section="timeline" icon={Calendar} label="Timeline" ref={timelineRef} />
          <NavButton section="insights" icon={Lightbulb} label="Key Insights" ref={insightsRef} />
        </div>
      </motion.div>

      {/* Mobile Menu Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-gray-900 rounded-xl border border-gray-800"
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
            className="md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 p-6"
          >
            <div className="mt-16 space-y-3">
              <NavButton section="predictions" icon={TrendingUp} label="Predictions" ref={predictionsRef} />
              <NavButton section="timeline" icon={Calendar} label="Timeline" ref={timelineRef} />
              <NavButton section="insights" icon={Lightbulb} label="Key Insights" ref={insightsRef} />
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

        <main className="flex-1 p-4 md:p-8 space-y-12">
          {/* PREDICTIONS Section */}
          <motion.div
            ref={predictionsRef}
            data-section="predictions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              PREDICTIONS
            </h2>
            
            {predictions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 text-center text-gray-400">
                No predictions available yet
              </div>
            ) : (
              <div className="space-y-4">
                {predictions.map((prediction, index) => (
                  <motion.div
                    key={prediction.model_name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 overflow-hidden backdrop-blur-sm hover:border-purple-500/30 transition-all"
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                        {/* Model */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                            {getModelIcon(prediction.model_name)}
                          </div>
                          <span className="font-semibold text-white">
                            {prediction.model_name.replace('model', 'Model ')}
                          </span>
                        </div>

                        {/* Outcome */}
                        <div className="flex items-center gap-2">
                          {prediction.status === 'success' ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-400" />
                              <span className="font-medium text-green-400">{prediction.outcome}</span>
                            </>
                          ) : prediction.status === 'error' ? (
                            <>
                              <XCircle className="h-5 w-5 text-red-400" />
                              <span className="text-red-400">NO</span>
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
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Confidence</span>
                                <span className="font-semibold text-white">{prediction.confidence_percent}%</span>
                              </div>
                              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
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
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => togglePrediction(prediction.model_name)}
                              className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors"
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
                            <span className="inline-block px-4 py-2 bg-gray-800 rounded-lg text-white font-semibold">
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
                            className="mt-4 pt-4 border-t border-gray-800"
                          >
                            <p className="text-gray-300 leading-relaxed">{prediction.reasoning}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              TIMELINE
            </h2>
            
            {timeline && timeline.status === 'success' && timeline.events && timeline.events.length > 0 ? (
              <TooltipProvider>
                <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 backdrop-blur-sm">
                  <div className="relative">
                    {/* Gradient Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-gray-600 to-red-500 rounded-full transform -translate-y-1/2" />
                    
                    {/* Events */}
                    <div className="relative flex justify-between items-center">
                      {timeline.events.map((event, index) => {
                        const colors = ['purple', 'gray', 'red'];
                        const color = colors[Math.min(index, colors.length - 1)];
                        
                        return (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.2 + 0.5 }}
                                whileHover={{ scale: 1.5 }}
                                className="flex flex-col items-center cursor-pointer"
                              >
                                <div className={`w-4 h-4 rounded-full bg-${color}-500 border-4 border-black shadow-lg shadow-${color}-500/50 transition-all`} />
                                <div className="mt-4 text-center">
                                  <div className="text-sm font-semibold text-white mb-1">
                                    {event.date || 'TBD'}
                                  </div>
                                  <div className={`text-xs text-${color}-400`}>
                                    {event.title}
                                  </div>
                                </div>
                              </motion.div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                              <p className="text-sm text-gray-300">{event.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </TooltipProvider>
            ) : (
              <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 text-center text-gray-400">
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              KEY INSIGHTS
            </h2>
            
            {insights && insights.status === 'success' && insights.content ? (
              <div className="space-y-4">
                {/* Agreement */}
                {insights.content.agreement && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.01 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-500/30 backdrop-blur-sm hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{insights.content.agreement.title}</h3>
                        <p className="text-gray-300">{insights.content.agreement.description}</p>
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
                    whileHover={{ scale: 1.01 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-red-900/30 to-red-900/10 border border-red-500/30 backdrop-blur-sm hover:border-red-500/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
                        <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{insights.content.divergence.title}</h3>
                        <p className="text-gray-300">{insights.content.divergence.description}</p>
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
                    whileHover={{ scale: 1.01 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-orange-900/30 to-orange-900/10 border border-orange-500/30 backdrop-blur-sm hover:border-orange-500/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-3">{insights.content.risks.title}</h3>
                        <ul className="space-y-2">
                          {insights.content.risks.items.map((risk, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + index * 0.1 }}
                              className="flex items-start gap-2 text-gray-300"
                            >
                              <span className="text-orange-400 mt-1">•</span>
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
              <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 text-center text-gray-400">
                Insights not available yet
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

