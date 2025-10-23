import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import { TrendingUp, Calendar, Lightbulb, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
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

  const getOutcomeColor = (outcome: string | null) => {
    if (!outcome) return "text-gray-400";
    if (outcome === "YES") return "text-green-400";
    if (outcome === "NO") return "text-red-400";
    return "text-yellow-400";
  };

  const getModelIcon = (modelName: string) => {
    switch (modelName) {
      case 'model1':
        return <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">A</div>;
      case 'model2':
        return <Lightbulb className="h-5 w-5 text-purple-400" />;
      case 'model3':
        return <div className="w-6 h-6 border border-purple-400 rounded flex items-center justify-center text-purple-400 text-xs">★</div>;
      case 'model4':
        return <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center text-white text-xs">⚡</div>;
      default:
        return <TrendingUp className="h-5 w-5 text-purple-400" />;
    }
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
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-950/50 border border-purple-900/50">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            <span className="font-medium">Predictions</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-card/50 transition-colors">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Timeline</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-card/50 transition-colors">
            <Lightbulb className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Key Insights</span>
          </div>
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
          <div>
            <h2 className="text-3xl font-bold mb-6">PREDICTIONS</h2>
            
            {predictions.length === 0 ? (
              <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
                No predictions available yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Model</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Outcome</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Conf</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reasoning</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Sources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((prediction) => (
                      <tr key={prediction.id} className="border-b border-border/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {getModelIcon(prediction.model_name)}
                            <span className="font-medium">{prediction.model_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {prediction.status === 'success' ? (
                            <div className="flex items-center gap-2">
                              {prediction.outcome === 'YES' ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                  <span className="text-green-400 font-medium">YES</span>
                                </>
                              ) : prediction.outcome === 'NO' ? (
                                <>
                                  <AlertTriangle className="h-4 w-4 text-red-400" />
                                  <span className="text-red-400 font-medium">NO</span>
                                </>
                              ) : (
                                <span className="text-yellow-400 font-medium">{prediction.outcome}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Pending...</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {prediction.status === 'success' ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{prediction.confidence_percent}%</span>
                              <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-500 transition-all duration-300"
                                  style={{ width: `${prediction.confidence_percent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {prediction.status === 'success' && prediction.reasoning ? (
                            <button
                              onClick={() => togglePrediction(prediction.model_name)}
                              className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
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
                        <td className="py-4 px-4">
                          {prediction.status === 'success' ? (
                            <span className="font-medium">{prediction.sources_count || 0}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TIMELINE Section */}
          <div>
            <h2 className="text-3xl font-bold mb-6">TIMELINE</h2>
            
            <div className="relative">
              <div className="h-1 bg-purple-500 rounded-full"></div>
              <div className="flex justify-between mt-4">
                <div className="text-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
                  <div className="text-sm font-medium">2025-10-01</div>
                  <div className="text-xs text-muted-foreground">News</div>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
                  <div className="text-sm font-medium">2025-10-15</div>
                  <div className="text-xs text-muted-foreground">Event</div>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-2"></div>
                  <div className="text-sm font-medium">2025-10-21</div>
                  <div className="text-xs text-muted-foreground">Latest</div>
                </div>
              </div>
            </div>
          </div>

          {/* KEY INSIGHTS Section */}
          <div>
            <h2 className="text-3xl font-bold mb-6">KEY INSIGHTS</h2>
            
            <div className="space-y-4">
              {!insights || insights.status === 'pending' || insights.status === 'processing' ? (
                <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Generating insights...
                </div>
              ) : insights.status === 'error' ? (
                <div className="p-8 rounded-xl bg-card border border-border text-center text-red-400">
                  Failed to generate insights
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.consensus && (
                    <div className="p-6 rounded-xl bg-card border border-border">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                        <div>
                          <div className="font-semibold text-lg">Consensus</div>
                          <div className="text-muted-foreground mt-2">
                            {insights.consensus.outcome} ({insights.consensus.confidence_percent}% confidence)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {insights.risks && insights.risks.length > 0 && (
                    <div className="p-6 rounded-xl bg-card border border-border">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                        <div>
                          <div className="font-semibold text-lg">Risk Factors</div>
                          <div className="text-muted-foreground mt-2 space-y-2">
                            {insights.risks.map((risk: any, idx: number) => (
                              <div key={idx}>• {risk.title}: {risk.description}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {insights.opportunities && insights.opportunities.length > 0 && (
                    <div className="p-6 rounded-xl bg-card border border-border">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1" />
                        <div>
                          <div className="font-semibold text-lg">Opportunities</div>
                          <div className="text-muted-foreground mt-2 space-y-2">
                            {insights.opportunities.map((opp: any, idx: number) => (
                              <div key={idx}>• {opp.title}: {opp.description}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}