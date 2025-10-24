import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import { TrendingUp, Calendar, Lightbulb, ChevronDown, ChevronUp, Loader2, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
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

  // Refs for sections
  const predictionsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!analysisId) {
      setLocation('/');
      return;
    }

    // Load initial data
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

    // Subscribe to updates
    const unsubscribe = subscribeToAnalysis(analysisId, (update) => {
      if (update.analysis) {
        setAnalysis(update.analysis);
      }
      if (update.predictions) {
        setPredictions(update.predictions);
      }
      if (update.timeline) {
        setTimeline(update.timeline);
      }
      if (update.insights) {
        setInsights(update.insights);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [analysisId, setLocation]);

  // Scroll to section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>, section: string) => {
    setActiveSection(section);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Intersection observer for active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
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
    const iconClass = "w-5 h-5 text-gray-400";
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
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        );
      default:
        return <Lightbulb className={iconClass} />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'from-gray-600 to-gray-500';
    if (confidence >= 70) return 'from-gray-500 to-gray-400';
    return 'from-gray-400 to-gray-300';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header 
          walletAddress={walletAddress}
          radarBalance={radarBalance}
          onConnect={connectWallet}
          onDisconnect={disconnectWallet}
        />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header 
        walletAddress={walletAddress}
        radarBalance={radarBalance}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
      />
      
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="fixed left-0 top-20 h-[calc(100vh-80px)] w-56 border-r border-gray-800/50 bg-black/50 backdrop-blur-sm">
          <nav className="p-6 space-y-2">
            <button
              onClick={() => scrollToSection(predictionsRef, 'predictions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeSection === 'predictions'
                  ? 'bg-gray-800/80 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Predictions</span>
            </button>
            
            <button
              onClick={() => scrollToSection(timelineRef, 'timeline')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeSection === 'timeline'
                  ? 'bg-gray-800/80 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Timeline</span>
            </button>
            
            <button
              onClick={() => scrollToSection(insightsRef, 'insights')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeSection === 'insights'
                  ? 'bg-gray-800/80 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              <span>Key Insights</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="ml-56 flex-1 p-8 space-y-16">
          {/* PREDICTIONS Section */}
          <section id="predictions" ref={predictionsRef} className="scroll-mt-8">
            <h2 className="text-2xl font-light mb-8 text-gray-200 tracking-wide">Predictions</h2>
            
            {predictions.length > 0 ? (
              <div className="space-y-3">
                {predictions.map((prediction) => {
                  const isExpanded = expandedPredictions.has(prediction.model_name);
                  const isPending = prediction.status === 'pending' || prediction.status === 'processing';
                  
                  return (
                    <div 
                      key={prediction.id}
                      className="group bg-gray-900/30 border border-gray-800/50 rounded-xl p-6 hover:bg-gray-900/50 hover:border-gray-700/50 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {/* Model Icon */}
                          <div className="opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                            {getModelIcon(prediction.model_name)}
                          </div>
                          
                          {/* Model Name */}
                          <div className="text-sm font-medium text-gray-400 w-24">
                            {prediction.model_name.replace('model', 'Model ')}
                          </div>
                          
                          {/* Outcome */}
                          <div className="flex-1">
                            {isPending ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                <span className="text-gray-500 text-sm">Processing...</span>
                              </div>
                            ) : (
                              <span className="text-white font-medium">{prediction.outcome}</span>
                            )}
                          </div>
                          
                          {/* Confidence */}
                          <div className="w-32">
                            {!isPending && prediction.confidence_percent && (
                              <div className="space-y-1">
                                <div className="text-xs text-gray-400">{prediction.confidence_percent}%</div>
                                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full bg-gradient-to-r ${getConfidenceColor(prediction.confidence_percent)} transition-all duration-1000 ease-out`}
                                    style={{ width: `${prediction.confidence_percent}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Sources */}
                          {!isPending && prediction.sources_count && (
                            <div className="text-sm text-gray-500 w-16 text-right">
                              {prediction.sources_count}
                            </div>
                          )}
                          
                          {/* Expand Button */}
                          {!isPending && prediction.reasoning && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePrediction(prediction.model_name)}
                              className="text-gray-400 hover:text-white hover:bg-gray-800/50"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Expanded Reasoning */}
                      {isExpanded && prediction.reasoning && (
                        <div className="mt-4 pt-4 border-t border-gray-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                          <p className="text-sm text-gray-400 leading-relaxed">{prediction.reasoning}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No predictions available yet
              </div>
            )}
          </section>

          {/* TIMELINE Section */}
          <section id="timeline" ref={timelineRef} className="scroll-mt-8">
            <h2 className="text-2xl font-light mb-8 text-gray-200 tracking-wide">Timeline</h2>
            
            {timeline && timeline.status === 'success' && timeline.events ? (
              <TooltipProvider>
                <div className="relative py-8">
                  {/* Timeline line */}
                  <div className="absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"></div>
                  
                  {/* Timeline points */}
                  <div className="relative flex justify-between">
                    {timeline.events.map((event: any, index: number) => (
                      <div key={index} className="flex flex-col items-center group">
                        <div className="text-xs font-medium text-gray-400 mb-3">{event.date || 'TBD'}</div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-3 h-3 rounded-full bg-gray-600 border-2 border-black relative z-10 cursor-pointer group-hover:scale-150 group-hover:bg-gray-400 transition-all duration-300"></div>
                          </TooltipTrigger>
                          {event.description && (
                            <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                              <p className="text-sm">{event.description}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                        <div className="text-xs text-gray-500 mt-3">{event.title || event.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </TooltipProvider>
            ) : timeline?.status === 'processing' ? (
              <div className="text-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Processing timeline...</p>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Timeline not available yet
              </div>
            )}
          </section>

          {/* KEY INSIGHTS Section */}
          <section id="insights" ref={insightsRef} className="scroll-mt-8">
            <h2 className="text-2xl font-light mb-8 text-gray-200 tracking-wide">Key Insights</h2>
            
            {insights && insights.status === 'success' && insights.content ? (
              <div className="space-y-4">
                {/* Agreement */}
                {insights.content.agreement && (
                  <div className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-6 hover:bg-gray-900/50 hover:border-gray-700/50 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-white mb-2">{insights.content.agreement.title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{insights.content.agreement.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Divergence */}
                {insights.content.divergence && (
                  <div className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-6 hover:bg-gray-900/50 hover:border-gray-700/50 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-white mb-2">{insights.content.divergence.title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{insights.content.divergence.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk Factors */}
                {insights.content.risks?.items && insights.content.risks.items.length > 0 && (
                  <div className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-6 hover:bg-gray-900/50 hover:border-gray-700/50 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-white mb-3">{insights.content.risks.title}</h3>
                        <ul className="space-y-2">
                          {insights.content.risks.items.map((risk: string, index: number) => (
                            <li key={index} className="text-sm text-gray-400 flex items-start gap-2 leading-relaxed">
                              <span className="text-gray-600 mt-1">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : insights?.status === 'processing' ? (
              <div className="text-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Generating insights...</p>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Insights not available yet
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

