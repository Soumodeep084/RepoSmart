"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  GitBranch,
  CheckCircle2,
  Info,
  Shield,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

import { Header } from "../../components/homepage/Header";
import { Footer } from "../../components/homepage/Footer";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

import { getAuthToken, getAuthUser, subscribeAuth } from "../../lib/auth";
import { postJson } from "../../lib/api";
import { getLicenseInfo } from "@/components/ui/utils";

type ScoreBreakdownItem = {
  key: string;
  label: string;
  score: number;
  max: number;
};

type RepoAnalysisResponse = {
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
    tooling: {
      hasEslint: boolean;
      hasPrettier: boolean;
      hasEditorConfig: boolean;
      hasGitHubActions: boolean;
      hasDependabot: boolean;
      hasTestsDir: boolean;
      hasDocsDir: boolean;
      hasSrcDir: boolean;
      hasLockfile: boolean;
      hasDocker: boolean;
      hasEnvExample: boolean;
      hasContributingFile: boolean;
      hasCodeOfConduct: boolean;
      hasChangelog: boolean;
      hasSecurityPolicy: boolean;
      hasIssueTemplates: boolean;
      hasPullRequestTemplate: boolean;
      hasGitIgnore: boolean;
      hasDeployConfig: boolean;
    };
    git: {
      commitsLast90Days: number;
      commitsLast90DaysCapped: boolean;
      activeCommitDaysLast90Days: number;
      conventionalCommitRate: number;
      branches: number;
      pullRequests: number;
      contributors: number;
      releases: number;
    };
  };
  score: {
    total: number;
    level: string;
    badge: string;
    breakdown: ScoreBreakdownItem[];
  };
  summary: string;
  roadmap: string[];
};

type ScoreRingProps = {
  score: number;
};

const PIE_COLORS = [
  "#58a6ff",
  "#79c0ff",
  "#1f6feb",
  "#3fb950",
  "#f2cc60",
  "#f0883e",
];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "10px",
    padding: "8px 10px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
  },
  labelStyle: {
    color: "#8b949e",
    fontSize: "11px",
    marginBottom: "2px",
  },
  itemStyle: {
    color: "#e6edf3",
    fontSize: "12px",
    fontWeight: 500,
  },
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function isDetectedLicense(license: string | null) {
  if (typeof license !== "string") return false;
  const value = license.trim();
  if (!value) return false;
  if (value.toUpperCase() === "NOASSERTION") return false;
  return true;
}

function getSummaryHighlights(summary: string) {
  return summary
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function ScoreRing({ score }: ScoreRingProps) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const strokeOffset = circumference - (clamped / 100) * circumference;
  const [displayedScore, setDisplayedScore] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedScore(Math.round(clamped * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [clamped]);

  return (
    <div className="relative h-40 w-40">
      <svg
        className="h-40 w-40 -rotate-90"
        viewBox="0 0 160 160"
        role="img"
        aria-label={`Score ${clamped} out of 100`}
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#1f2a3d"
          strokeWidth="14"
        />
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeOffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
        <defs>
          <linearGradient
            id="scoreGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#79c0ff" />
            <stop offset="60%" stopColor="#58a6ff" />
            <stop offset="100%" stopColor="#1f6feb" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-white tabular-nums">
          {displayedScore}
        </div>
        <div className="text-xs text-[#8b949e]">out of 100</div>
      </div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="mt-10 rounded-2xl border border-[#30363d] bg-surface-1/80 p-6">
      <div className="flex items-center gap-3 text-[#c9d1d9]">
        <Loader2 className="h-5 w-5 animate-spin text-[#58a6ff]" />
        <span className="text-sm">
          Analyzing repository and generating roadmap...
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="h-3 w-2/3 rounded-full bg-surface-2 animate-pulse" />
        <div className="h-3 w-full rounded-full bg-surface-2 animate-pulse" />
        <div className="h-3 w-4/5 rounded-full bg-surface-2 animate-pulse" />
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const router = useRouter();

  const token = useSyncExternalStore(subscribeAuth, getAuthToken, () => null);
  const [repoUrl, setRepoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RepoAnalysisResponse | null>(null);

  const user = token ? getAuthUser() : null;

  useEffect(() => {
    const currentToken = getAuthToken();
    if (!currentToken) router.replace("/");
  }, [router]);

  const licenseInfo = getLicenseInfo(result?.repo.license || null);

  const handleAnalyze = async (e: React.FormEvent) => {
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

      const data = await postJson<RepoAnalysisResponse>(
        "/api/repo/analyze",
        { url: repoUrl },
        { token: currentToken },
      );
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(
        err instanceof Error ? err.message : "Unable to analyze repository.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const breakdownChart = useMemo(
    () =>
      (result?.score.breakdown ?? []).map((item) => ({
        name:
          item.label.length > 14 ? `${item.label.slice(0, 14)}...` : item.label,
        score: Number(((item.score / Math.max(item.max, 1)) * 100).toFixed(1)),
      })),
    [result],
  );

  const languageChart = useMemo(
    () =>
      (result?.snapshot.languagesTop ?? []).slice(0, 6).map((lang, idx) => ({
        name: lang.name,
        value: lang.percent,
        color: PIE_COLORS[idx % PIE_COLORS.length],
      })),
    [result],
  );

  const activityBars = useMemo(() => {
    if (!result) return [];
    const commitsValue = Math.min(100, result.snapshot.git.commitsLast90Days);
    const activeDaysValue = Math.min(
      100,
      Math.round((result.snapshot.git.activeCommitDaysLast90Days / 90) * 100),
    );
    const prValue = Math.min(100, result.snapshot.git.pullRequests * 8);

    return [
      { label: "Commit volume", value: commitsValue },
      { label: "Active days", value: activeDaysValue },
      { label: "PR rhythm", value: prValue },
    ];
  }, [result]);

  if (!token) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onLogin={() => router.push("/")}
        onRegister={() => router.push("/")}
      />

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
            <div className="absolute left-1/4 top-10 h-52 w-52 rounded-full bg-[#1f6feb]/20 blur-3xl" />
            <div className="absolute right-1/4 bottom-0 h-52 w-52 rounded-full bg-[#58a6ff]/20 blur-3xl" />
          </div>

          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <div
                  className="rs-glow inline-flex items-center gap-2 rounded-full border border-[#30363d] bg-surface-1 px-3 py-1 text-sm"
                  style={
                    { "--rs-glow-color": "#58a6ff" } as React.CSSProperties
                  }
                >
                  <Sparkles className="h-4 w-4 text-[#58a6ff]" />
                  <span className="text-[#c9d1d9]">Repository Quality Lab</span>
                  {user ? (
                    <span className="text-[#8b949e]">• {user.username}</span>
                  ) : null}
                </div>

                <h1 className="rs-text-glow mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  Analyze repository health
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#8b949e] sm:text-lg">
                  Get a polished score dashboard, actionable roadmap, and a
                  clean summary that helps your project look production-ready.
                </p>

                <form
                  onSubmit={handleAnalyze}
                  className="mt-8 rounded-2xl border border-[#30363d] bg-surface-1/90 p-4 sm:p-6"
                >
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
                          Analyzing
                        </>
                      ) : (
                        <>
                          Analyze
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>

                  {error ? (
                    <p className="mt-3 text-xs text-red-400">{error}</p>
                  ) : null}
                </form>
              </motion.div>

              {submitting ? <LoadingPanel /> : null}

              {result ? (
                <motion.div
                  className="mt-10 space-y-6"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[#30363d] bg-surface-1 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#8b949e]">
                          Score
                        </div>
                        <span className="rounded-full border border-[#2a3344] bg-background/40 px-2 py-1 text-[11px] text-[#c9d1d9]">
                          {result.score.level}
                        </span>
                      </div>

                      <div className="flex items-center justify-center">
                        <ScoreRing score={result.score.total} />
                      </div>

                      <div className="mt-4 text-center text-sm text-[#8b949e]">
                        Badge: {result.score.badge}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#30363d] bg-surface-1 p-5 lg:col-span-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-[#8b949e]">
                            Repository
                          </div>
                          <div className="mt-1 wrap-break-word text-lg font-semibold text-white">
                            {result.repo.fullName}
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-[#8b949e]">
                            {result.repo.description ||
                              "No description provided."}
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
                          <div className="text-[10px] text-[#8b949e]">
                            Stars
                          </div>
                          <div className="font-semibold text-white">
                            {result.repo.stars}
                          </div>
                        </div>
                        <div className="rounded-lg border border-[#30363d] bg-surface-2 p-3">
                          <div className="text-[10px] text-[#8b949e]">
                            Forks
                          </div>
                          <div className="font-semibold text-white">
                            {result.repo.forks}
                          </div>
                        </div>
                        <div className="rounded-lg border border-[#30363d] bg-surface-2 p-3">
                          <div className="text-[10px] text-[#8b949e]">
                            Files
                          </div>
                          <div className="font-semibold text-white">
                            {result.snapshot.files.fileCount}
                          </div>
                        </div>
                        <div className="rounded-lg border border-[#30363d] bg-surface-2 p-3">
                          <div className="text-[10px] text-[#8b949e]">
                            Last push
                          </div>
                          <div className="font-semibold text-white">
                            {formatDate(result.repo.pushedAt)}
                          </div>
                        </div>
                      </div>

                      {/* <div className="mt-4 rounded-lg border border-[#30363d] bg-surface-2 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-white">
                              License status
                            </div>
                            <div className="text-xs text-[#8b949e]">
                              {isDetectedLicense(result.repo.license)
                                ? `Detected: ${result.repo.license}`
                                : "No license detected"}
                            </div>
                          </div>
                          {isDetectedLicense(result.repo.license) ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#2e7d47] bg-[#1f6f3a]/20 px-2 py-1 text-xs text-[#8ad8ab]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Healthy
                            </span>
                          ) : (
                            <span className="rounded-full border border-red-700/60 bg-red-950/30 px-2 py-1 text-xs text-red-300">
                              Warning
                            </span>
                          )}
                        </div>
                      </div> */}

                      <div className="mt-4 rounded-lg border border-[#30363d] bg-surface-2 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-white">
                              License status
                            </div>
                            <div className="text-xs text-[#8b949e]">
                              {isDetectedLicense(result.repo.license)
                                ? `Detected: ${result.repo.license}`
                                : "No license detected"}
                            </div>
                          </div>

                          {licenseInfo && (
                            <span className="flex items-center gap-1 text-xs text-[#8b949e]">
                              <Shield className="h-3.5 w-3.5" />
                              {licenseInfo.type}
                            </span>
                          )}
                        </div>

                        {licenseInfo && (
                          <div className="mt-4 border-t border-[#2a3344] pt-3">
                            <div className="flex items-center gap-2 text-sm text-[#79c0ff] mb-2">
                              <Info className="h-4 w-4" />
                              {licenseInfo.title}
                            </div>

                            <ul className="space-y-2 text-xs text-[#c9d1d9]">
                              {licenseInfo.points.map((point, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-[#58a6ff]" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[#30363d] bg-surface-1 p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                        <Target className="h-4 w-4 text-[#58a6ff]" />
                        Score Breakdown
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={breakdownChart}
                            margin={{
                              top: 10,
                              right: 10,
                              left: -20,
                              bottom: 10,
                            }}
                          >
                            <CartesianGrid
                              stroke="#21262d"
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="name"
                              interval={0}
                              angle={-20}
                              textAnchor="end"
                              height={50}
                              tick={{ fill: "#8b949e", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: "#8b949e", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                              width={34}
                            />
                            <Tooltip
                              cursor={{ fill: "rgba(88, 166, 255, 0.1)" }}
                              {...tooltipStyle}
                            />
                            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                              {breakdownChart.map((entry, index) => (
                                <Cell
                                  key={`${entry.name}-${index}`}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#30363d] bg-surface-1 p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                        <TrendingUp className="h-4 w-4 text-[#58a6ff]" />
                        Languages and Activity
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="h-48 rounded-xl border border-[#2a3344] bg-surface-2 p-2">
                          {languageChart.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={languageChart}
                                  dataKey="value"
                                  nameKey="name"
                                  innerRadius={38}
                                  outerRadius={60}
                                  paddingAngle={2}
                                  stroke="none"
                                >
                                  {languageChart.map((entry, index) => (
                                    <Cell
                                      key={entry.name}
                                      fill={entry.color}
                                      style={{
                                        transition: "transform 0.2s ease",
                                      }}
                                    />
                                  ))}
                                </Pie>

                                <Tooltip
                                  {...tooltipStyle}
                                  formatter={(value: number, name: string) => [
                                    `${value.toFixed(1)}%`,
                                    name,
                                  ]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-[#8b949e]">
                              No language data
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-[#2a3344] bg-surface-2 p-3">
                          <div className="space-y-3">
                            {activityBars.map((item) => (
                              <div key={item.label}>
                                <div className="mb-1 flex items-center justify-between text-xs text-[#8b949e]">
                                  <span>{item.label}</span>
                                  <span>{item.value}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-[#1f2a3d]">
                                  <motion.div
                                    className="h-full rounded-full bg-linear-to-r from-[#58a6ff] to-[#79c0ff]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.value}%` }}
                                    transition={{
                                      duration: 0.8,
                                      ease: "easeOut",
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#2a3344] pt-3 text-xs">
                            <div>
                              <div className="text-[#8b949e]">
                                Conventional commits
                              </div>
                              <div className="font-semibold text-white">
                                {formatPercent(
                                  result.snapshot.git.conventionalCommitRate,
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-[#8b949e]">Contributors</div>
                              <div className="font-semibold text-white">
                                {result.snapshot.git.contributors}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[#30363d] bg-surface-1 p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                        <Sparkles className="h-4 w-4 text-[#58a6ff]" />
                        Summary
                      </div>
                      <p className="text-sm leading-relaxed text-[#c9d1d9]">
                        {result.summary}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {getSummaryHighlights(result.summary).map(
                          (snippet, idx) => (
                            <span
                              key={`${snippet}-${idx}`}
                              className="rounded-full border border-[#2a3344] bg-surface-2 px-3 py-1 text-xs text-[#c9d1d9]"
                            >
                              {snippet}
                            </span>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#30363d] bg-surface-1 p-5">
                      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                        <GitBranch className="h-4 w-4 text-[#58a6ff]" />
                        Professional Roadmap
                      </div>

                      <ol className="relative space-y-4 border-l border-[#2a3344] pl-5">
                        {result.roadmap.map((step, idx) => (
                          <li key={`${step}-${idx}`} className="relative">
                            <span className="absolute -left-6.75 top-0 flex h-4 w-4 items-center justify-center rounded-full border border-[#58a6ff] bg-background text-[10px] text-[#79c0ff]">
                              {idx + 1}
                            </span>
                            <div className="rounded-lg border border-[#2a3344] bg-surface-2 px-3 py-2 text-sm leading-relaxed text-[#c9d1d9]">
                              {step}
                            </div>
                          </li>
                        ))}
                      </ol>
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
