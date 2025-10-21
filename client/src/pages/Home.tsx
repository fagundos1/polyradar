import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import { TrendingUp, Zap, Shield, BarChart3 } from "lucide-react";
import { useDynamic } from "@/hooks/useDynamic";
import { createAnalysis } from "@/lib/api";
import { toast } from "sonner";

export default function Home() {
  const [, setLocation] = useLocation();
  const [polymarketUrl, setPolymarketUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Dynamic.xyz integration
  const { walletAddress, radarBalance, connectWallet, disconnectWallet, isLoading: walletLoading } = useDynamic();

  const validatePolymarketUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === "polymarket.com" || urlObj.hostname.endsWith(".polymarket.com");
    } catch {
      return false;
    }
  };

  const handleAnalyze = async () => {
    setError("");

    if (!walletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    if (!polymarketUrl.trim()) {
      setError("Please enter a Polymarket event URL");
      return;
    }

    if (!validatePolymarketUrl(polymarketUrl)) {
      setError("Please enter a valid Polymarket URL");
      return;
    }

    if (radarBalance < 100) {
      setError("Insufficient RADAR balance. You need at least 100 RADAR tokens.");
      return;
    }

    setIsLoading(true);

    try {
      // Создаем анализ и списываем токены
      const analysisId = await createAnalysis({
        walletAddress,
        polymarketUrl,
      });

      toast.success("Analysis started! 100 RADAR tokens deducted.");

      // TODO: Отправить webhook на Make.com с analysisId
      // const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
      // await fetch(webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ analysisId, polymarketUrl })
      // });

      // Переходим на страницу анализа
      setLocation(`/analyzing?id=${analysisId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start analysis";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        onDisconnect={disconnectWallet}
        radarBalance={radarBalance}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                AI-Powered News Analysis for{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Polymarket Events
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Get comprehensive predictions, timeline analysis, and key insights from multiple AI models
                to make informed decisions on prediction markets.
              </p>
            </div>

            {/* Input Section */}
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="url"
                  placeholder="https://polymarket.com/event/..."
                  value={polymarketUrl}
                  onChange={(e) => setPolymarketUrl(e.target.value)}
                  className="flex-1 h-12 text-base bg-card border-border"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading || !walletAddress}
                  className="h-12 px-8 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Zap className="mr-2 h-4 w-4 animate-pulse" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                {walletAddress ? (
                  <>
                    You have <span className="font-mono text-purple-400">{radarBalance}</span> RADAR tokens.
                    Each analysis costs <span className="font-mono text-purple-400">100</span> RADAR.
                  </>
                ) : (
                  <>Connect your wallet to start analyzing events</>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container py-20 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose PolyRadar?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4 p-6 rounded-xl bg-card border border-border hover:border-purple-900/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-purple-950/50 border border-purple-900/50 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">Multi-Model Predictions</h3>
                <p className="text-muted-foreground">
                  Get consensus and divergent views from multiple AI models analyzing the same event
                  from different perspectives.
                </p>
              </div>

              <div className="space-y-4 p-6 rounded-xl bg-card border border-border hover:border-purple-900/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-purple-950/50 border border-purple-900/50 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">Timeline Analysis</h3>
                <p className="text-muted-foreground">
                  Visualize key events and news developments on an interactive timeline to understand
                  the full context.
                </p>
              </div>

              <div className="space-y-4 p-6 rounded-xl bg-card border border-border hover:border-purple-900/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-purple-950/50 border border-purple-900/50 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">Risk Assessment</h3>
                <p className="text-muted-foreground">
                  Identify potential risks, conflicting information, and areas of uncertainty before
                  making your prediction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container py-20 border-t border-border">
          <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-3xl font-bold text-center">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-950/50 border-2 border-purple-500 flex items-center justify-center mx-auto font-bold text-purple-400">
                  1
                </div>
                <h3 className="font-semibold">Paste Event URL</h3>
                <p className="text-sm text-muted-foreground">
                  Copy the URL of any Polymarket event you want to analyze
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-950/50 border-2 border-purple-500 flex items-center justify-center mx-auto font-bold text-purple-400">
                  2
                </div>
                <h3 className="font-semibold">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI models analyze news, social sentiment, and historical data
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-950/50 border-2 border-purple-500 flex items-center justify-center mx-auto font-bold text-purple-400">
                  3
                </div>
                <h3 className="font-semibold">Get Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Receive detailed predictions, timeline, and risk assessment
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 PolyRadar. Powered by AI and Web3.</p>
        </div>
      </footer>
    </div>
  );
}

