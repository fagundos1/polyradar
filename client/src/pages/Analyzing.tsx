import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, TrendingUp, Calendar, Lightbulb } from "lucide-react";

export default function Analyzing() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Симуляция анализа - в реальности будет ожидание webhook от Make.com
    const timer = setTimeout(() => {
      // Переход на страницу результатов с mock данными
      setLocation("/results/mock-analysis-id");
    }, 5000);

    return () => clearTimeout(timer);
  }, [setLocation]);

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
          <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border animate-pulse">
            <div className="w-10 h-10 rounded-full bg-purple-950/50 border border-purple-500 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Gathering Predictions</div>
              <div className="text-xs text-muted-foreground">Running multiple AI models...</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border opacity-50">
            <div className="w-10 h-10 rounded-full bg-purple-950/50 border border-purple-500 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Building Timeline</div>
              <div className="text-xs text-muted-foreground">Analyzing news chronology...</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border opacity-30">
            <div className="w-10 h-10 rounded-full bg-purple-950/50 border border-purple-500 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Extracting Insights</div>
              <div className="text-xs text-muted-foreground">Identifying key factors...</div>
            </div>
          </div>
        </div>

        {/* Estimated Time */}
        <p className="text-sm text-muted-foreground pt-4">
          This usually takes 30-60 seconds
        </p>
      </div>
    </div>
  );
}

