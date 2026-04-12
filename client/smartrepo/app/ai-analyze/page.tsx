"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  ExternalLink,
  Loader2,
  Sparkles,
  FileText,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { motion } from "framer-motion";

import { Header } from "../../components/homepage/Header";
import { Footer } from "../../components/homepage/Footer";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { LoadingVideo } from "../../components/ui/loading-video";

import { getAuthToken, getAuthUser, subscribeAuth } from "../../lib/auth";
import { postJson } from "../../lib/api";

type AiScanResponse = {
  input: {
    owner: string;
    repo: string;
    url: string;
  };
  repo: {
    fullName: string;
    htmlUrl: string;
    description: string | null;
    defaultBranch: string;
    isFork: boolean;
    visibility?: string;
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
    license: string | null;
    topics: string[];
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
    sizeKb: number;
  };
  snapshot: {
    files: {
      fileCount: number;
      directoryCount: number;
      truncated: boolean;
      topLevelCounts: Record<string, number>;
    };
    languagesTop: Array<{ name: string; bytes: number; percent: number }>;
    readme: {
      present: boolean;
      wordCount: number;
      hasInstall: boolean;
      hasUsage: boolean;
      hasScreenshots: boolean;
      hasBadges: boolean;
    };
    tooling: Record<string, boolean>;
  };
  ai: {
    model: string;
    output: string;
  };
};

const PIE_COLORS = ["#58a6ff", "#79c0ff", "#1f6feb", "#3fb950", "#f2cc60", "#f0883e"];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function isDetectedLicense(license: string | null) {
  if (typeof license !== "string") return false;
  const value = license.trim();
  if (!value) return false;
  if (value.toUpperCase() === "NOASSERTION") return false;
  return true;
}

function parseAiSections(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const summary = paragraphs[0] ?? "No summary available.";
  const keyPoints = paragraphs.slice(1, 5);

  return { summary, keyPoints, paragraphs };
}

export default function AiAnalyzePage() {
  const router = useRouter();

  const token = useSyncExternalStore(subscribeAuth, getAuthToken, () => null);
  const [repoUrl, setRepoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiScanResponse | null>(null);

  const user = token ? getAuthUser() : null;

  useEffect(() => {
    const currentToken = getAuthToken();
    if (!currentToken) router.replace("/");
  }, [router]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const currentToken = getAuthToken();
      if (!currentToken) {
        router.replace("/");
        return;
      }

      const data = await postJson<AiScanResponse>("/api/repo/ai-scan", { url: repoUrl }, { token: currentToken });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Unable to scan repository.");
    } finally {
      setSubmitting(false);
    }
  };

  const languageChart = useMemo(
    () =>
      (result?.snapshot.languagesTop ?? []).slice(0, 6).map((lang, idx) => ({
        name: lang.name,
        value: lang.percent,
        color: PIE_COLORS[idx % PIE_COLORS.length],
      })),
    [result],
  );

  const radarData = useMemo(() => {
    if (!result) return [];

    const hasReadme = result.snapshot.readme.present ? 100 : 25;
    const docsScore = result.snapshot.readme.hasUsage ? 100 : 45;
    const installScore = result.snapshot.readme.hasInstall ? 100 : 45;
    const toolingScore = Object.values(result.snapshot.tooling).filter(Boolean).length * 8;
    const maintainability = result.repo.openIssues > 50 ? 45 : result.repo.openIssues > 20 ? 65 : 82;

    return [
      { metric: "README", value: hasReadme },
      { metric: "Usage", value: docsScore },
      { metric: "Install", value: installScore },
      { metric: "Tooling", value: Math.min(100, toolingScore) },
      { metric: "Stability", value: maintainability },
    ];
  }, [result]);

  const reportSections = useMemo(() => {
    if (!result) return { summary: "", keyPoints: [], paragraphs: [] };
    return parseAiSections(result.ai.output);
  }, [result]);

  if (!token) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {submitting ? <LoadingVideo message="Running AI analyzer…" /> : null}
      <Header onLogin={() => router.push("/")} onRegister={() => router.push("/")} />

      <main>
        <section className="relative overflow-hidden bg-background pt-16 pb-20">
          <div className="pointer-events-none absolute inset-0">
            <div
              className="h-full w-full opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #58a6ff 1px, transparent 1px), linear-gradient(to bottom, #58a6ff 1px, transparent 1px)",
                backgroundSize: "74px 74px",
              }}
            />
            <div className="absolute left-1/4 top-8 h-52 w-52 rounded-full bg-[#1f6feb]/20 blur-3xl" />
            <div className="absolute right-1/4 bottom-0 h-52 w-52 rounded-full bg-[#58a6ff]/20 blur-3xl" />
          </div>

          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-6xl">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <div
                  className="rs-glow inline-flex items-center gap-2 rounded-full border border-[#30363d] bg-surface-1 px-3 py-1 text-sm"
                  style={{ "--rs-glow-color": "#58a6ff" } as React.CSSProperties}
                >
                  <Bot className="h-4 w-4 text-[#58a6ff]" />
                  <span className="text-[#c9d1d9]">AI Intelligence Report</span>
                  {user ? <span className="text-[#8b949e]">• {user.username}</span> : null}
                </div>

                <h1 className="rs-text-glow mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  AI scan your repository
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#8b949e] sm:text-lg">
                  Transform raw repository metadata into a polished AI summary, architecture signals, and practical next actions.
                </p>

                <form onSubmit={handleScan} className="mt-8 rounded-2xl border border-[#30363d] bg-surface-1/90 p-4 sm:p-6">
                  <Label htmlFor="repo-url" className="text-sm text-[#c9d1d9]">
                    GitHub Repository URL
                  </Label>

                  <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="repo-url"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/owner/repo"
                      className="border-[#30363d] bg-background text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                      disabled={submitting}
                      required
                    />

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="min-w-36 border-0 bg-[#1f6feb] text-white shadow-lg shadow-[#1f6feb]/20 hover:bg-[#388bfd]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scanning
                        </>
                      ) : (
                        <>
                          AI Scan
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>

                  {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
                </form>
              </motion.div>

              {result ? (
                <motion.div
                  className="mt-10 space-y-6"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[#30363d] bg-surface-1 p-5 lg:col-span-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-[#8b949e]">Repository</div>
                          <div className="mt-1 wrap-break-word text-lg font-semibold text-white">{result.repo.fullName}</div>
                          <p className="mt-1 text-sm leading-relaxed text-[#8b949e]">
                            {result.repo.description || "No description provided."}
                          </p>
                        </div>

                        <Link
                          href={result.repo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-[#58a6ff] hover:underline"
                        >
                          View on GitHub
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg border border-[#30363d] bg-surface-2 p-3">
                          <div className="text-[10px] text-[#8b949e]">Stars</div>
                          <div className="font-semibold text-white">{result.repo.stars}</div>
                        </div>
                        <div className="rounded-lg border border-[#30363d] bg-surface-2 p-3">
                          <div className="text-[10px] text-[#8b949e]">Forks</div>
                          <div className="font-semibold text-white">{result.repo.forks}</div>
                        </div>
                        <div className="rounded-lg border border-[#30363d] bg-surface-2 p-3">
                          <div className="text-[10px] text-[#8b949e]">Files</div>
                          <div className="font-semibold text-white">{result.snapshot.files.fileCount}</div>
                        </div>
                        <div className="rounded-lg border border-[#30363d] bg-surface-2 p-3">
                          <div className="text-[10px] text-[#8b949e]">Last push</div>
                          <div className="font-semibold text-white">{formatDate(result.repo.pushedAt)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#30363d] bg-surface-1 p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                        <CheckCircle2 className="h-4 w-4 text-[#58a6ff]" />
                        Compliance
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between rounded-lg border border-[#2a3344] bg-surface-2 px-3 py-2">
                          <span className="text-[#8b949e]">License</span>
                          <span className={isDetectedLicense(result.repo.license) ? "text-[#8ad8ab]" : "text-red-300"}>
                            {isDetectedLicense(result.repo.license) ? "Detected" : "Missing"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-[#2a3344] bg-surface-2 px-3 py-2">
                          <span className="text-[#8b949e]">README</span>
                          <span className={result.snapshot.readme.present ? "text-[#8ad8ab]" : "text-red-300"}>
                            {result.snapshot.readme.present ? "Present" : "Weak"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-[#2a3344] bg-surface-2 px-3 py-2">
                          <span className="text-[#8b949e]">AI Model</span>
                          <span className="text-[#c9d1d9]">{result.ai.model}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[#30363d] bg-surface-1 p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                        <BarChart3 className="h-4 w-4 text-[#58a6ff]" />
                        Language Distribution
                      </div>
                      <div className="h-72 rounded-xl border border-[#2a3344] bg-surface-2 p-2">
                        {languageChart.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={languageChart} dataKey="value" nameKey="name" innerRadius={46} outerRadius={88} paddingAngle={2}>
                                {languageChart.map((entry) => (
                                  <Cell key={entry.name} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => `${Number(value).toFixed(1)}%`}
                                contentStyle={{
                                  backgroundColor: "#0e1a2b",
                                  border: "1px solid #30363d",
                                  borderRadius: "12px",
                                  color: "#c9d1d9",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-[#8b949e]">No language data</div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#30363d] bg-surface-1 p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                        <Sparkles className="h-4 w-4 text-[#58a6ff]" />
                        Readiness Radar
                      </div>
                      <div className="h-72 rounded-xl border border-[#2a3344] bg-surface-2 p-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData} outerRadius="74%">
                            <PolarGrid stroke="#2a3344" />
                            <PolarAngleAxis dataKey="metric" tick={{ fill: "#8b949e", fontSize: 11 }} />
                            <Radar dataKey="value" stroke="#58a6ff" fill="#58a6ff" fillOpacity={0.38} />
                            <Tooltip
                              formatter={(value: number) => `${Number(value).toFixed(0)} / 100`}
                              contentStyle={{
                                backgroundColor: "#0e1a2b",
                                border: "1px solid #30363d",
                                borderRadius: "12px",
                                color: "#c9d1d9",
                              }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#30363d] bg-surface-1 p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                      <FileText className="h-4 w-4 text-[#58a6ff]" />
                      AI Summary
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <div className="rounded-xl border border-[#2a3344] bg-surface-2 p-4 lg:col-span-2">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#8b949e]">Executive Summary</div>
                        <p className="mt-2 text-sm leading-relaxed text-[#c9d1d9]">{reportSections.summary}</p>

                        <div className="mt-4 space-y-2">
                          {reportSections.keyPoints.length ? (
                            reportSections.keyPoints.map((point, idx) => (
                              <motion.div
                                key={`${point}-${idx}`}
                                className="rounded-lg border border-[#34415a] bg-background/50 px-3 py-2 text-sm text-[#c9d1d9]"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.35, delay: idx * 0.06 }}
                              >
                                {point}
                              </motion.div>
                            ))
                          ) : (
                            <div className="rounded-lg border border-[#34415a] bg-background/50 px-3 py-2 text-sm text-[#8b949e]">
                              No detailed key points available.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#2a3344] bg-surface-2 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#8b949e]">Report Metadata</div>
                        <div className="mt-3 space-y-3 text-sm">
                          <div>
                            <div className="text-[#8b949e]">Model</div>
                            <div className="font-medium text-white">{result.ai.model}</div>
                          </div>
                          <div>
                            <div className="text-[#8b949e]">Paragraphs</div>
                            <div className="font-medium text-white">{reportSections.paragraphs.length}</div>
                          </div>
                          <div>
                            <div className="text-[#8b949e]">Repo URL</div>
                            <div className="break-all text-[#c9d1d9]">{result.repo.htmlUrl}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-[#2a3344] bg-surface-2 p-4">
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-[#8b949e]">Full Output</div>
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#c9d1d9]">{result.ai.output}</pre>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
