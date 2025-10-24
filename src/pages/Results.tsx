import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import { TrendingUp, Calendar, Lightbulb, ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
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

    // Загружаем начальные данные
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

    // Подписываемся на обновления
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
    switch (modelName) {
      case 'model1':
        return (
          <div className="w-7 h-7 bg-purple-600 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
        );
      case 'model2':
        return (
          <div className="w-7 h-7 bg-purple-600 rounded flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-white" />
          </div>
        );
      case 'model3':
        return (
          <div className="w-7 h-7 border-2 border-purple-500 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        );
      case 'model4':
        return (
          <div className="w-7 h-7 bg-purple-600 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
            </svg>
          </div>
        );
      default:
        return <TrendingUp className="h-5 w-5 text-purple-400" />;
    }
  };

  const getModelLabel = (modelName: string) => {
    switch (modelName) {
      case 'model1': return 'Model A';
      case 'model2': return 'Model B';
      case 'model3': return 'Model C';
      case 'model4': return 'Model D';
      default: return modelName;
    }
  };

  const getConfidenceBarColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-purple-500';
    if (confidence >= 70) return 'bg-orange-500';
    return 'bg-orange-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Analysis not found</h1>
          <Button onClick={() => setLocation('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border p-6">
        <div className="space-y-4">
          <button
            onClick={() => scrollToSection(predictionsRef, 'predictions')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
              activeSection === 'predictions'
                ? 'bg-purple-950/50 border border-purple-900/50'
                : 'hover:bg-card/50'
            }`}
          >
            <TrendingUp className={`h-5 w-5 ${activeSection === 'predictions' ? 'text-purple-400' : 'text-muted-foreground'}`} />
            <span className={activeSection === 'predictions' ? 'font-medium' : 'text-muted-foreground'}>Predictions</span>
          </button>
          <button
            onClick={() => scrollToSection(timelineRef, 'timeline')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
              activeSection === 'timeline'
                ? 'bg-purple-950/50 border border-purple-900/50'
                : 'hover:bg-card/50'
            }`}
          >
            <Calendar className={`h-5 w-5 ${activeSection === 'timeline' ? 'text-purple-400' : 'text-muted-foreground'}`} />
            <span className={activeSection === 'timeline' ? 'font-medium' : 'text-muted-foreground'}>Timeline</span>
          </button>
          <button
            onClick={() => scrollToSection(insightsRef, 'insights')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
              activeSection === 'insights'
                ? 'bg-purple-950/50 border border-purple-900/50'
                : 'hover:bg-card/50'
            }`}
          >
            <Lightbulb className={`h-5 w-5 ${activeSection === 'insights' ? 'text-purple-400' : 'text-muted-foreground'}`} />
            <span className={activeSection === 'insights' ? 'font-medium' : 'text-muted-foreground'}>Key Insights</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header
          walletAddress={walletAddress}
          onConnectWallet={connectWallet}
          onDisconnect={disconnectWallet}
          radarBalance={radarBalance}
        />

        <main className="flex-1 p-8 space-y-8">
          {/* PREDICTIONS Section */}
          <div ref={predictionsRef} data-section="predictions">
            <h2 className="text-3xl font-bold mb-6">PREDICTIONS</h2>
            
            {predictions.length === 0 ? (
              <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
                No predictions available yet
              </div>
            ) : (
              <div className="rounded-2xl bg-card/50 border border-border/50 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Model</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Outcome</t                    <th className="py-3 px-6 text-left text-sm font-medium text-muted-foreground">Confidence</th>                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Reasoning</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Sources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((prediction, index) => (
                      <>
                        <tr key={prediction.id} className={index < predictions.length - 1 ? "border-b border-border/30" : ""}>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              {getModelIcon(prediction.model_name)}
                              <span className="font-medium">{getModelLabel(prediction.model_name)}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            {prediction.status === 'success' ? (
                              <div className="flex items-center gap-2">
                                {prediction.outcome === 'YES' ? (
                                  <>
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                    <span className="text-green-400 font-semibold">YES</span>
                                  </>
                                ) : prediction.outcome === 'NO' ? (
                                  <>
                                    <XCircle className="h-5 w-5 text-red-400" />
                                    <span className="text-red-400 font-semibold">NO</span>
                                  </>
                                ) : (
                                  <span className="text-yellow-400 font-semibold">{prediction.outcome}</span>
                                )}
                              </div>
                            ) : prediction.status === 'processing' ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Processing...</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Pending...</span>
                            )}
                          </td>
                          <td className="py-5 px-6">
                            {prediction.status === 'success' && prediction.confidence_percent ? (
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-base">{prediction.confidence_percent}%</span>
                                <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-300 ${getConfidenceBarColor(prediction.confidence_percent)}`}
                                    style={{ width: `${prediction.confidence_percent}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-5 px-6">
                            {prediction.status === 'success' && prediction.reasoning ? (
                              <button
                                onClick={() => togglePrediction(prediction.model_name)}
                                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                              >
                                View Details
                                {expandedPredictions.has(prediction.model_name) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-5 px-6">
                            {prediction.status === 'success' ? (
                              <span className="font-semibold">{prediction.sources_count || 0}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                        {expandedPredictions.has(prediction.model_name) && prediction.reasoning && (
                          <tr key={`${prediction.id}-details`}>
                            <td colSpan={5} className="px-6 py-4 bg-card/30">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-sm text-purple-400 mb-2">Reasoning</h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{prediction.reasoning}</p>
                                </div>
                                {prediction.sources && prediction.sources.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-sm text-purple-400 mb-2">Sources</h4>
                                    <div className="space-y-1">
                                      {prediction.sources.map((source: string, idx: number) => (
                                        <a 
                                          key={idx}
                                          href={source}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          {source}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TIMELINE Section */}
          <div ref={timelineRef} data-section="timeline">
            <h2 className="text-3xl font-bold mb-6">TIMELINE</h2>
            
            {timeline && timeline.status === 'success' && timeline.events ? (
              <TooltipProvider>
                <div className="space-y-6">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute top-6 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-gray-500 to-red-500 rounded-full"></div>
                    
                    {/* Timeline points */}
                    <div className="relative flex justify-between">
                      {timeline.events.map((event: any, index: number) => {
                        const colors = ['purple', 'gray', 'red'];
                        const color = colors[index % colors.length];
                        
                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div className="text-sm font-medium mb-2">{event.date || 'TBD'}</div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`w-4 h-4 rounded-full bg-${color}-500 border-4 border-background relative z-10 cursor-pointer hover:scale-125 transition-transform`}></div>
                              </TooltipTrigger>
                              {event.description && (
                                <TooltipContent className="max-w-xs">
                                  <p>{event.description}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                            <div className="text-sm text-muted-foreground mt-2">{event.title || event.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </TooltipProvider>
            ) : timeline?.status === 'processing' ? (
              <div className="p-8 rounded-xl bg-card border border-border text-center">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400 mx-auto mb-2" />
                <p className="text-muted-foreground">Processing timeline...</p>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
                Timeline not available yet
              </div>
            )}
          </div>

          {/* KEY INSIGHTS Section */}
          <div ref={insightsRef} data-section="insights">
            <h2 className="text-3xl font-bold mb-6">KEY INSIGHTS</h2>
            
            {insights && insights.status === 'success' && insights.content ? (
              <div className="space-y-4">
                {/* Agreement */}
                {insights.content.agreement && (
                  <div className="rounded-2xl bg-purple-950/30 border-l-4 border-purple-500 p-6">
                    <div className="flex items-start gap-4">
                      <CheckCircle className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{insights.content.agreement.title}</h3>
                        <p className="text-muted-foreground">{insights.content.agreement.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Divergence */}
                {insights.content.divergence && (
                  <div className="rounded-2xl bg-red-950/20 border-l-4 border-red-500 p-6">
                    <div className="flex items-start gap-4">
                      <svg className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{insights.content.divergence.title}</h3>
                        <p className="text-muted-foreground">{insights.content.divergence.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk Factors */}
                {insights.content.risks?.items && insights.content.risks.items.length > 0 && (
                  <div className="rounded-2xl bg-orange-950/20 border-l-4 border-orange-500 p-6">
                    <div className="flex items-start gap-4">
                      <TrendingUp className="h-6 w-6 text-orange-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-3">{insights.content.risks.title}</h3>
                        <ul className="space-y-2">
                          {insights.content.risks.items.map((risk: string, index: number) => (
                            <li key={index} className="text-muted-foreground flex items-start gap-2">
                              <span className="text-orange-400 mt-1">•</span>
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
              <div className="p-8 rounded-xl bg-card border border-border text-center">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400 mx-auto mb-2" />
                <p className="text-muted-foreground">Generating insights...</p>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
                Insights not available yet
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

