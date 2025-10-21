import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import { TrendingUp, Calendar, Lightbulb, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Prediction, TimelineEvent, Insight } from "@/lib/supabase";

// Mock data для демонстрации
const mockData = {
  predictions: [
    {
      model: "Model A",
      modelIcon: "🤖",
      outcome: "YES",
      confidence: 85,
      reasoning: "Strong positive sentiment in recent news coverage. Multiple credible sources indicate favorable conditions. Historical precedent suggests high probability of occurrence.",
      sources: 12
    },
    {
      model: "Model B",
      modelIcon: "🧠",
      outcome: "YES",
      confidence: 78,
      reasoning: "Analysis of social media trends and expert opinions shows consensus. Market indicators align with positive outcome.",
      sources: 8
    },
    {
      model: "Model C",
      modelIcon: "🔮",
      outcome: "The event will likely resolve positively based on current diplomatic negotiations and recent policy announcements from key stakeholders",
      confidence: 72,
      reasoning: "Comprehensive review of official statements and policy documents. Cross-referenced with historical patterns.",
      sources: 15
    },
    {
      model: "Model D",
      modelIcon: "⚡",
      outcome: "NO",
      confidence: 65,
      reasoning: "Recent diplomatic setbacks and conflicting official statements suggest uncertainty. Limited historical precedent for this specific scenario.",
      sources: 10
    }
  ] as Prediction[],
  timeline: [
    {
      date: "2025-10-01",
      label: "News",
      type: "positive" as const,
      description: "Major announcement from key stakeholder indicating positive direction"
    },
    {
      date: "2025-10-15",
      label: "Event",
      type: "neutral" as const,
      description: "Official meeting scheduled between parties"
    },
    {
      date: "2025-10-21",
      label: "Latest",
      type: "negative" as const,
      description: "Conflicting statements from officials raise uncertainty"
    }
  ] as TimelineEvent[],
  insights: [
    {
      type: "agreement" as const,
      title: "Strong Agreement",
      description: "3 out of 4 models predict YES with high confidence",
      icon: "check-circle"
    },
    {
      type: "divergent" as const,
      title: "Divergent View",
      description: [
        "Model D disagrees based on recent diplomatic setbacks",
        "This represents a 25% probability scenario"
      ],
      icon: "alert-triangle"
    },
    {
      type: "risk" as const,
      title: "Risk Factors",
      description: [
        "• Ongoing negotiations (high volatility)",
        "• Conflicting official statements",
        "• Limited historical precedent"
      ],
      icon: "trending-up"
    }
  ] as Insight[]
};

export default function Results() {
  const [match, params] = useRoute("/results/:id");
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("predictions");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  // Mock wallet state
  const [walletAddress] = useState<string | undefined>("0x1234567890abcdef1234567890abcdef12345678");
  const [radarBalance] = useState(400);

  const handleConnectWallet = () => {
    // TODO: Интегрировать Dynamic.xyz
  };

  const handleDisconnect = () => {
    setLocation("/");
  };

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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

    const sections = ["predictions", "timeline", "insights"];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const isBinaryOutcome = (outcome: string): boolean => {
    const normalized = outcome.trim().toUpperCase();
    return ["YES", "NO", "TRUE", "FALSE"].includes(normalized);
  };

  const getConfidenceBarColor = (confidence: number): string => {
    if (confidence > 80) return "bg-gradient-to-r from-purple-500 to-purple-600";
    if (confidence >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  if (!match) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnect={handleDisconnect}
        radarBalance={radarBalance}
      />

      <div className="flex max-w-7xl mx-auto w-full flex-1">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block w-60 sticky top-20 h-fit p-8">
          <nav className="space-y-2">
            <button
              onClick={() => scrollToSection("predictions")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === "predictions"
                  ? "bg-purple-950/50 text-purple-400 border border-purple-900/50"
                  : "text-gray-400 hover:bg-gray-800/50"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Predictions
            </button>
            <button
              onClick={() => scrollToSection("timeline")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === "timeline"
                  ? "bg-purple-950/50 text-purple-400 border border-purple-900/50"
                  : "text-gray-400 hover:bg-gray-800/50"
              }`}
            >
              <Calendar className="h-4 w-4" />
              Timeline
            </button>
            <button
              onClick={() => scrollToSection("insights")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === "insights"
                  ? "bg-purple-950/50 text-purple-400 border border-purple-900/50"
                  : "text-gray-400 hover:bg-gray-800/50"
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              Key Insights
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 md:px-8 py-8 space-y-16">
          {/* Predictions Section */}
          <section id="predictions">
            <h2 className="text-2xl font-bold mb-6">PREDICTIONS</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border/50">
                    <tr className="text-left text-sm text-gray-400">
                      <th className="px-4 py-4 font-medium w-[20%]">Model</th>
                      <th className="px-4 py-4 font-medium w-[30%]">Outcome</th>
                      <th className="px-4 py-4 font-medium w-[15%]">Conf</th>
                      <th className="px-4 py-4 font-medium w-[25%]">Reasoning</th>
                      <th className="px-4 py-4 font-medium w-[10%]">Sources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockData.predictions.map((pred, index) => (
                      <>
                        <tr
                          key={index}
                          className="border-b border-border/50 hover:bg-gray-900/30 transition-colors duration-200"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{pred.modelIcon}</span>
                              <span className="font-medium">{pred.model}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <TooltipProvider delayDuration={200}>
                              {isBinaryOutcome(pred.outcome) ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">
                                    {pred.outcome.toUpperCase() === "YES" || pred.outcome.toUpperCase() === "TRUE" ? "✅" : "❌"}
                                  </span>
                                  <span
                                    className={`font-semibold text-lg ${
                                      pred.outcome.toUpperCase() === "YES" || pred.outcome.toUpperCase() === "TRUE"
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {pred.outcome}
                                  </span>
                                </div>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="max-w-xs cursor-help group">
                                      <p className="text-sm font-medium truncate group-hover:text-purple-400 transition-colors">
                                        {pred.outcome}
                                      </p>
                                      <span className="text-xs text-gray-500 mt-1 inline-block">
                                        hover for full text
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="right"
                                    align="start"
                                    sideOffset={8}
                                    className="max-w-md bg-[#1a1a1a] border border-purple-900/50 p-4 rounded-lg shadow-xl"
                                  >
                                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                                      {pred.outcome}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TooltipProvider>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <span className="font-mono text-sm">{pred.confidence}%</span>
                              <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getConfidenceBarColor(pred.confidence)}`}
                                  style={{ width: `${pred.confidence}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(index)}
                              className="text-purple-400 hover:text-purple-300 hover:underline"
                            >
                              View Details
                              {expandedRows.has(index) ? (
                                <ChevronUp className="ml-2 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-2 h-4 w-4" />
                              )}
                            </Button>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-mono text-gray-400">{pred.sources}</span>
                          </td>
                        </tr>
                        {expandedRows.has(index) && (
                          <tr key={`${index}-expanded`}>
                            <td colSpan={5} className="px-4 py-6 bg-purple-950/5 border-t border-border/50">
                              <p className="text-sm text-gray-300 leading-relaxed">{pred.reasoning}</p>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Timeline Section */}
          <section id="timeline">
            <h2 className="text-2xl font-bold mb-8">TIMELINE</h2>
            <div className="relative">
              {/* Horizontal line */}
              <div className="absolute top-8 left-0 right-0 h-0.5 bg-purple-900/50" />
              
              {/* Events */}
              <div className="flex justify-between items-start relative">
                {mockData.timeline.map((event, index) => (
                  <div key={index} className="flex flex-col items-center group cursor-pointer">
                    {/* Date above */}
                    <span className="text-sm font-mono mb-2">{event.date}</span>
                    
                    {/* Circle marker */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 bg-background z-10 transition-transform group-hover:scale-125 ${
                        event.type === "positive"
                          ? "border-purple-500"
                          : event.type === "negative"
                          ? "border-red-500"
                          : "border-gray-500"
                      }`}
                    />
                    
                    {/* Label below */}
                    <span className="text-xs text-gray-500 mt-2">{event.label}</span>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute top-20 hidden group-hover:block bg-card border border-purple-900/50 rounded-lg p-3 shadow-xl max-w-xs z-20">
                      <p className="text-sm text-gray-300">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Key Insights Section */}
          <section id="insights">
            <h2 className="text-2xl font-bold mb-6">KEY INSIGHTS</h2>
            <div className="space-y-4">
              {mockData.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border-l-4 ${
                    insight.type === "agreement"
                      ? "border-l-purple-500 bg-purple-500/10"
                      : insight.type === "divergent"
                      ? "border-l-pink-500 bg-pink-500/10"
                      : "border-l-amber-500 bg-amber-500/10"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 ${
                        insight.type === "agreement"
                          ? "text-purple-400"
                          : insight.type === "divergent"
                          ? "text-pink-400"
                          : "text-amber-400"
                      }`}
                    >
                      {insight.type === "agreement" ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : insight.type === "divergent" ? (
                        <AlertTriangle className="h-6 w-6" />
                      ) : (
                        <TrendingUp className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{insight.title}</h3>
                      {Array.isArray(insight.description) ? (
                        <div className="space-y-1">
                          {insight.description.map((line, i) => (
                            <p key={i} className="text-gray-300">
                              {line}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-300">{insight.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

