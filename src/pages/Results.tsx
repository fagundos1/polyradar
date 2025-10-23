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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="text-xs px-2 py-1 rounded-full bg-green-950/50 text-green-400 border border-green-900/50">Completed</span>;
      case 'error':
        return <span className="text-xs px-2 py-1 rounded-full bg-red-950/50 text-red-400 border border-red-900/50">Failed</span>;
      case 'processing':
        return <span className="text-xs px-2 py-1 rounded-full bg-purple-950/50 text-purple-400 border border-purple-900/50 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </span>;
      default:
        return <span className="text-xs px-2 py-1 rounded-full bg-gray-950/50 text-gray-400 border border-gray-900/50">Pending</span>;
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        onDisconnect={disconnectWallet}
        radarBalance={radarBalance}
      />

      <main className="flex-1 container py-8">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Analysis Results</h1>
            <Button variant="outline" onClick={() => setLocation('/')}>
              New Analysis
            </Button>
          </div>
          {analysis.event_url && (
            <a
              href={analysis.event_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              View on Polymarket <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Predictions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-purple-400" />
                <h2 className="text-2xl font-semibold">AI Model Predictions</h2>
              </div>

              {predictions.length === 0 ? (
                <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
                  No predictions available yet
                </div>
              ) : (
                predictions.map((prediction) => (
                  <div
                    key={prediction.id}
                    className="p-6 rounded-xl bg-card border border-border hover:border-purple-900/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-950/50 border border-purple-900/50 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{prediction.model_name}</h3>
                          {getStatusBadge(prediction.status)}
                        </div>
                      </div>
                      {prediction.status === 'success' && (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getOutcomeColor(prediction.outcome)}`}>
                            {prediction.outcome}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {prediction.confidence_percent}% confidence
                          </div>
                        </div>
                      )}
                    </div>

                    {prediction.status === 'success' && prediction.reasoning && (
                      <>
                        <div className={`text-muted-foreground ${expandedPredictions.has(prediction.model_name) ? '' : 'line-clamp-2'}`}>
                          {prediction.reasoning}
                        </div>
                        <button
                          onClick={() => togglePrediction(prediction.model_name)}
                          className="text-sm text-purple-400 hover:text-purple-300 mt-2 flex items-center gap-1"
                        >
                          {expandedPredictions.has(prediction.model_name) ? (
                            <>Show less <ChevronUp className="h-4 w-4" /></>
                          ) : (
                            <>Show more <ChevronDown className="h-4 w-4" /></>
                          )}
                        </button>
                        {prediction.sources_count !== null && prediction.sources_count > 0 && (
                          <div className="text-xs text-muted-foreground mt-3">
                            Based on {prediction.sources_count} sources
                          </div>
                        )}
                      </>
                    )}

                    {prediction.status === 'error' && prediction.error && (
                      <div className="text-sm text-red-400">
                        Error: {prediction.error}
                      </div>
                    )}

                    {prediction.status === 'processing' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar - Timeline & Insights */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-purple-400" />
                <h2 className="text-xl font-semibold">Timeline</h2>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border">
                {!timeline || timeline.status === 'pending' || timeline.status === 'processing' ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading timeline...
                  </div>
                ) : timeline.status === 'error' ? (
                  <div className="text-sm text-red-400">
                    Failed to load timeline
                  </div>
                ) : timeline.events && timeline.events.length > 0 ? (
                  <div className="space-y-4">
                    {timeline.events.map((event: any, idx: number) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${
                            event.impact === 'high' ? 'bg-red-400' :
                            event.impact === 'medium' ? 'bg-yellow-400' :
                            'bg-green-400'
                          }`} />
                          {idx < timeline.events.length - 1 && (
                            <div className="w-px h-full bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="text-xs text-muted-foreground">{event.date}</div>
                          <div className="font-medium mt-1">{event.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">{event.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No timeline events</div>
                )}
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-6 w-6 text-purple-400" />
                <h2 className="text-xl font-semibold">Key Insights</h2>
              </div>

              <div className="space-y-3">
                {!insights || insights.status === 'pending' || insights.status === 'processing' ? (
                  <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating insights...
                    </div>
                  </div>
                ) : insights.status === 'error' ? (
                  <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="text-sm text-red-400">
                      Failed to generate insights
                    </div>
                  </div>
                ) : (
                  <>
                    {insights.consensus && (
                      <div className="p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium">Consensus</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {insights.consensus.outcome} ({insights.consensus.confidence_percent}% confidence)
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {insights.risks && insights.risks.length > 0 && (
                      <div className="p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium">Risk Factors</div>
                            <div className="text-sm text-muted-foreground mt-1 space-y-1">
                              {insights.risks.map((risk: any, idx: number) => (
                                <div key={idx}>• {risk.title}: {risk.description}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {insights.opportunities && insights.opportunities.length > 0 && (
                      <div className="p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium">Opportunities</div>
                            <div className="text-sm text-muted-foreground mt-1 space-y-1">
                              {insights.opportunities.map((opp: any, idx: number) => (
                                <div key={idx}>• {opp.title}: {opp.description}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

