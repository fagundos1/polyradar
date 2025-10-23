import { useEffect, useState } from "react";
import { useDynamic } from "@/hooks/useDynamic";
import { useLocation } from "wouter";
import { Loader2, TrendingUp, Calendar, Lightbulb, CheckCircle2 } from "lucide-react";
import { getAnalysisWithResults, subscribeToAnalysis } from "@/lib/api";
import type { ModelPrediction, Timeline, Insights } from "@/lib/supabase";

export default function Analyzing() {
  const [, setLocation] = useLocation();
  const { refreshBalance } = useDynamic();

  // Получаем analysisId из URL
  const searchParams = new URLSearchParams(window.location.search);
  const analysisId = searchParams.get('id');

  const [predictions, setPredictions] = useState<ModelPrediction[]>([]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [hasAnyResult, setHasAnyResult] = useState(false);

  useEffect(() => {
    if (!analysisId) {
      setLocation('/');
      return;
    }

    console.log('[Analyzing] Subscribing to analysis:', analysisId);

    // Загружаем начальные данные
    getAnalysisWithResults(analysisId).then((data) => {
      console.log('[Analyzing] Initial data loaded:', { predictions: data.predictions.length, timeline: data.timeline?.status, insights: data.insights?.status });
      setPredictions(data.predictions);
      setTimeline(data.timeline);
      setInsights(data.insights);
    });

    // Подписываемся на обновления
    const unsubscribe = subscribeToAnalysis(analysisId, (update) => {
      console.log('[Analyzing] Received update:', update);
      if (update.predictions) {
        console.log('[Analyzing] Updating predictions:', update.predictions.length);
        setPredictions(update.predictions);
      }
      if (update.timeline) {
        console.log('[Analyzing] Updating timeline:', update.timeline.status);
        setTimeline(update.timeline);
      }
      if (update.insights) {
        console.log('[Analyzing] Updating insights:', update.insights.status);
        setInsights(update.insights);
      }
    });

    return () => {
      console.log('[Analyzing] Unsubscribing from analysis:', analysisId);
      unsubscribe();
    };
  }, [analysisId, setLocation]);

  // Проверяем, есть ли хотя бы один готовый результат
  useEffect(() => {
    const hasCompletedPrediction = predictions.some(p => p.status === 'success');
    const hasCompletedTimeline = timeline?.status === 'success';
    const hasCompletedInsights = insights?.status === 'success';

    if (hasCompletedPrediction || hasCompletedTimeline || hasCompletedInsights) {
      if (!hasAnyResult) {
        setHasAnyResult(true);
        // Переходим на страницу результатов при первом готовом результате
        setTimeout(() => {
          refreshBalance();
          setLocation(`/results/${analysisId}`);
        }, 1000);
      }
    }
  }, [predictions, timeline, insights, hasAnyResult, analysisId, setLocation, refreshBalance]);

  const getStatusIcon = (status: string | undefined) => {
    if (status === 'success') {
      return <CheckCircle2 className="h-5 w-5 text-green-400" />;
    }
    return <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />;
  };

  const getStatusText = (status: string | undefined) => {
    switch (status) {
      case 'success':
        return 'Completed';
      case 'error':
        return 'Failed';
      case 'processing':
        return 'Processing...';
      default:
        return 'Pending...';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Animated Logo/Icon */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto rounded-full bg-purple-950/50 border-2 border-purple-500/50 flex items-center justify-center">
            <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-purple-500/20 animate-ping" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Analyzing Event...</h1>
          <p className="text-muted-foreground">
            Our AI models are processing news and data to generate comprehensive insights
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4 pt-8">
          {/* Model Predictions */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
            <div className="w-10 h-10 rounded-full bg-purple-950/50 border border-purple-500 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">AI Model Predictions</div>
              <div className="text-sm text-muted-foreground">
                {predictions.filter(p => p.status === 'success').length} / 4 models completed
              </div>
            </div>
            <div className="flex gap-2">
              {predictions.slice(0, 4).map((pred, idx) => (
                <div key={idx} className="w-8 h-8 rounded-full bg-purple-950/50 border border-purple-500/50 flex items-center justify-center">
                  {getStatusIcon(pred.status)}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
            <div className="w-10 h-10 rounded-full bg-purple-950/50 border border-purple-500 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Timeline Analysis</div>
              <div className="text-sm text-muted-foreground">
                {getStatusText(timeline?.status)}
              </div>
            </div>
            {getStatusIcon(timeline?.status)}
          </div>

          {/* Insights */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
            <div className="w-10 h-10 rounded-full bg-purple-950/50 border border-purple-500 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Key Insights</div>
              <div className="text-sm text-muted-foreground">
                {getStatusText(insights?.status)}
              </div>
            </div>
            {getStatusIcon(insights?.status)}
          </div>
        </div>

        {/* Info */}
        <p className="text-sm text-muted-foreground pt-4">
          This usually takes 30-60 seconds. You'll be redirected automatically when the first results are ready.
        </p>
      </div>
    </div>
  );
}

