"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ProgressStep, AnalysisResult, AnalysisSettings } from "@/types";

export default function AnalysisPage() {
  const router = useRouter();
  const [url, setUrl] = useState<string>("");
  const [settings, setSettings] = useState<AnalysisSettings | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: "validation",
      name: "URL Validation",
      description: "Checking URL accessibility and basic structure",
      status: "pending",
    },
    {
      id: "crawling",
      name: "Website Scraping",
      description: "Scraping page content and collecting data",
      status: "pending",
    },
    {
      id: "analysis",
      name: "AI Analysis",
      description: "Analyzing usability using AI insights",
      status: "pending",
    },
    {
      id: "scoring",
      name: "Scoring & Report",
      description: "Calculating scores and generating recommendations",
      status: "pending",
    },
  ]);

  useEffect(() => {
    console.log("Analysis page mounted");

    // Get URL from localStorage
    const analysisUrl = localStorage.getItem("analysisUrl");
    console.log("Analysis URL from localStorage:", analysisUrl);

    if (analysisUrl) {
      setUrl(analysisUrl);
    } else {
      console.error("No URL found in localStorage");
      setError("No URL provided for analysis. Please go back to the homepage.");
      return;
    }

    // Get settings from localStorage
    const savedSettings = localStorage.getItem("analysisSettings");
    console.log("Settings from localStorage:", savedSettings);

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        console.log("Parsed settings:", {
          ...parsedSettings,
          firecrawlKey: "[REDACTED]",
          aiKey: "[REDACTED]",
        });
        setSettings(parsedSettings);

        // Validate that we have the required API keys
        if (!parsedSettings.firecrawlKey || !parsedSettings.aiKey) {
          console.error("Missing API keys:", {
            hasFirecrawl: !!parsedSettings.firecrawlKey,
            hasAI: !!parsedSettings.aiKey,
          });
          setError("Please configure your API keys in the settings first.");
          return;
        }

        console.log("All validations passed, starting analysis in 1 second...");
        // Start analysis automatically after a short delay
        const timeoutId = setTimeout(() => {
          console.log("Timeout triggered, calling startAnalysis");
          initializeAnalysis(analysisUrl, parsedSettings);
        }, 1000);

        return () => clearTimeout(timeoutId);
      } catch (error) {
        console.error("Error loading settings:", error);
        setError(
          "Invalid settings configuration. Please reconfigure your settings.",
        );
        return;
      }
    } else {
      console.error("No settings found in localStorage");
      setError("Please configure your settings first before running analysis.");
      return;
    }
  }, [router]);

  const initializeAnalysis = async (
    analysisUrl: string,
    analysisSettings: any,
  ) => {
    console.log("initializeAnalysis called with:", {
      url: analysisUrl,
      hasSettings: !!analysisSettings,
    });

    setIsAnalyzing(true);
    setError(null);

    try {
      // Step 1: URL Validation
      console.log("Step 1: URL Validation");
      await updateStepStatus("validation", "active");
      await simulateStep(1000);
      await updateStepStatus("validation", "completed");

      // Step 2: Website Scraping
      console.log("Step 2: Website Scraping");
      await updateStepStatus("crawling", "active");
      setCurrentStep(1);
      await performCrawling(analysisUrl, analysisSettings);
      await updateStepStatus("crawling", "completed");

      // Step 3: AI Analysis
      console.log("Step 3: AI Analysis");
      await updateStepStatus("analysis", "active");
      setCurrentStep(2);
      await performAnalysis(analysisUrl, analysisSettings);
      await updateStepStatus("analysis", "completed");

      // Step 4: Scoring & Report
      console.log("Step 4: Scoring & Report");
      await updateStepStatus("scoring", "active");
      setCurrentStep(3);
      await generateReport();
      await updateStepStatus("scoring", "completed");

      // Navigate to results
      console.log("Analysis complete, navigating to results");
      router.push("/results");
    } catch (error) {
      console.error("Analysis error:", error);
      await updateStepStatus("validation", "error");
      await updateStepStatus("crawling", "error");
      await updateStepStatus("analysis", "error");
      await updateStepStatus("scoring", "error");
      setError(error instanceof Error ? error.message : "Analysis failed");
      setIsAnalyzing(false);
    }
  };

  const startAnalysis = async () => {
    console.log(
      "startAnalysis called (deprecated - using initializeAnalysis instead)",
    );
    if (!settings || !url) {
      console.error("Missing settings or URL in startAnalysis");
      return;
    }
    await initializeAnalysis(url, settings);
  };

  const updateStepStatus = async (
    stepId: string,
    status: ProgressStep["status"],
    message?: string,
  ) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? { ...step, status, description: message || step.description }
          : step,
      ),
    );
  };

  const simulateStep = (duration: number) => {
    return new Promise((resolve) => setTimeout(resolve, duration));
  };

  const performCrawling = async (targetUrl: string, analysisSettings: any) => {
    try {
      console.log("Starting scrape for:", targetUrl);
      const { FirecrawlClient } = await import("@/lib/firecrawl");
      const firecrawl = new FirecrawlClient(analysisSettings.firecrawlKey);

      let scrapeData;
      try {
        console.log("Attempting Firecrawl API...");
        scrapeData = await firecrawl.scrapePage(targetUrl, analysisSettings);
        console.log(
          "Firecrawl successful, pages found:",
          scrapeData.pages.length,
        );
      } catch (error) {
        console.warn("Firecrawl failed, using fallback:", error);
        await updateStepStatus(
          "crawling",
          "active",
          "Using fallback scraping method...",
        );
        scrapeData = await firecrawl.fallbackScrape(targetUrl);
        console.log("Fallback scrape successful");
      }

      localStorage.setItem("crawlData", JSON.stringify(scrapeData));
      console.log("Scrape data saved to localStorage");
    } catch (error) {
      console.error("Scraping error:", error);
      throw new Error(
        "Failed to scrape website: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  const performAnalysis = async (targetUrl: string, analysisSettings: any) => {
    try {
      console.log("Starting AI analysis...");
      const crawlDataStr = localStorage.getItem("crawlData");
      if (!crawlDataStr) {
        throw new Error("No crawl data available");
      }

      const crawlData = JSON.parse(crawlDataStr);
      console.log("Loaded crawl data:", crawlData.pages.length, "pages");

      console.log("Calling AI analysis API route...");
      const response = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: targetUrl,
          crawlData,
          settings: analysisSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Analysis API error: ${response.status} - ${errorData}`,
        );
      }

      const apiResult = await response.json();
      if (!apiResult.success) {
        throw new Error(apiResult.error || "Analysis failed");
      }

      const result = apiResult.data;
      console.log("AI analysis complete, overall score:", result.overallScore);

      setAnalysisResult(result);
      localStorage.setItem("analysisResult", JSON.stringify(result));
      console.log("Analysis result saved to localStorage");
    } catch (error) {
      console.error("Analysis error:", error);
      throw new Error(
        "Failed to analyze website: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  const generateReport = async () => {
    await simulateStep(1500); // Simulate report generation
  };

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "active":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
        );
    }
  };

  const getStepTextColor = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return "text-green-900";
      case "active":
        return "text-blue-900";
      case "error":
        return "text-red-900";
      default:
        return "text-gray-500";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Analysis Error
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            {error.includes("API key") || error.includes("settings") ? (
              <button
                onClick={() => {
                  router.push("/");
                  // Open settings modal after navigation
                  setTimeout(() => {
                    const event = new CustomEvent("openSettings");
                    window.dispatchEvent(event);
                  }, 100);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Configure Settings
              </button>
            ) : null}
            <button
              onClick={() => router.push("/")}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>
              Est.{" "}
              {settings?.analysisDepth === "quick"
                ? "1-2 mins"
                : settings?.analysisDepth === "deep"
                ? "3-5 mins"
                : "2-3 mins"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* URL Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Analyzing Website
              </h1>
              <p className="text-gray-600">{url}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex gap-x-1">
              <span className="text-gray-500">AI Provider:</span>
              <span className="font-medium">
                {settings?.aiProvider === "claude"
                  ? "Claude (Anthropic)"
                  : "OpenAI GPT-4"}
              </span>
            </div>
            <div className="flex gap-x-1">
              <span className="text-gray-500">Analysis Depth:</span>
              <span className="font-medium capitalize">
                {settings?.analysisDepth}
              </span>
            </div>
            <div className="flex gap-x-1">
              <span className="text-gray-500">Mobile Analysis:</span>
              <span className="font-medium">
                {settings?.includeMobile ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex gap-x-1">
              <span className="text-gray-500">Stealth Mode:</span>
              <span className="font-medium">
                {settings?.stealthMode ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Analysis Progress
          </h2>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-4">
                {/* Step Icon */}
                <div className="flex-shrink-0 mt-1">{getStepIcon(step)}</div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-sm font-medium ${getStepTextColor(
                        step,
                      )}`}>
                      {step.name}
                    </h3>
                    {step.status === "active" && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        In Progress
                      </span>
                    )}
                    {step.status === "completed" && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {step.description}
                  </p>

                  {/* Progress Bar for Active Step */}
                  {step.status === "active" && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full progress-animated animate-pulse w-3/4"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute !ml-2 mt-8 w-px h-8 bg-gray-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            💡 While you wait...
          </h3>
          <p className="text-sm text-blue-800">
            We're analyzing your website based on Steve Krug's "Don't Make Me
            Think" principles. This includes checking navigation clarity,
            content hierarchy, mobile responsiveness, and overall user
            experience.
          </p>
        </div>
      </main>
    </div>
  );
}
