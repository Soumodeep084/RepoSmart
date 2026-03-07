"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";

import { Header } from "../../components/homepage/Header";
import { Footer } from "../../components/homepage/Footer";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

import { getAuthToken, getAuthUser, subscribeAuth } from "../../lib/auth";
import { postJson } from "../../lib/api";

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

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className="w-full">
      <div className="h-2 w-full rounded-full bg-surface-2 border border-[#30363d] overflow-hidden">
        <div
          className="h-full bg-[#58a6ff]"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function isDetectedLicense(license: string | null) {
  if (typeof license !== "string") return false;
  const value = license.trim();
  if (!value) return false;
  if (value.toUpperCase() === "NOASSERTION") return false;
  return true;
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

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const token = getAuthToken();
      if (!token) {
        router.replace("/");
        return;
      }

      const data = await postJson<RepoAnalysisResponse>(
        "/api/repo/analyze",
        { url: repoUrl },
        { token },
      );
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Unable to analyze repository.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <div className="absolute inset-0 opacity-5">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #58a6ff 1px, transparent 1px), linear-gradient(to bottom, #58a6ff 1px, transparent 1px)",
                backgroundSize: "80px 80px",
              }}
            />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
            <div className="max-w-3xl mx-auto">
              <div
                className="rs-glow inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-1 border border-[#30363d] text-sm"
                style={{ "--rs-glow-color": "#58a6ff" }}
              >
                <span className="text-[#c9d1d9]">Repository Mirror</span>
                {user ? (
                  <span className="text-[#8b949e]">• Signed in as {user.username}</span>
                ) : null}
              </div>

              <h1 className="rs-text-glow text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mt-4">
                Analyze a GitHub repository
              </h1>
              <p className="text-base sm:text-lg text-[#8b949e] mt-3 leading-relaxed">
                Paste a public repository URL to get a score, a short evaluation summary, and a personalized improvement roadmap.
              </p>

              <form
                onSubmit={handleAnalyze}
                className="mt-8 bg-surface-1 border border-[#30363d] rounded-xl p-4 sm:p-6"
              >
                <Label htmlFor="repo-url" className="text-[#c9d1d9] text-sm">
                  GitHub Repository URL
                </Label>

                <div className="mt-2 flex flex-col sm:flex-row gap-3">
                  <Input
                    id="repo-url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="bg-background border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                    disabled={submitting}
                    required
                  />

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#1f6feb] hover:bg-[#388bfd] text-white border-0 shadow-lg shadow-[#1f6feb]/20"
                  >
                    {submitting ? "Analyzing…" : "Analyze"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>

                {error ? <p className="text-xs text-red-400 mt-3">{error}</p> : null}
              </form>

              {result ? (
                <div className="mt-10 space-y-6">
                  <div className="bg-surface-1 border border-[#30363d] rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">License</div>

                        {isDetectedLicense(result.repo.license) ? (
                          <p className="mt-2 text-sm text-[#c9d1d9] leading-relaxed">
                            Licensed under{" "}
                            <span className="font-semibold text-white">
                              {result.repo.license}
                            </span>
                            .
                          </p>
                        ) : (
                          <>
                            <p className="mt-2 text-sm text-[#c9d1d9] leading-relaxed">
                              No license detected.
                            </p>
                            <p className="mt-2 text-xs text-red-400 leading-relaxed">
                              Warning: This repository does not advertise a license. Add a LICENSE file to clarify how others may use, modify, and distribute your code.
                            </p>
                          </>
                        )}
                      </div>

                      <span
                        className={
                          "text-xs border border-[#30363d] bg-background/40 rounded-full px-2 py-1 " +
                          (isDetectedLicense(result.repo.license)
                            ? "text-[#c9d1d9]"
                            : "text-red-400")
                        }
                      >
                        {isDetectedLicense(result.repo.license)
                          ? "Licensed"
                          : "Warning"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface-1 border border-[#30363d] rounded-xl p-5">
                      <div className="text-xs text-[#8b949e]">Overall score</div>
                      <div className="mt-2 flex items-end gap-3">
                        <div className="text-4xl font-bold text-white">
                          {result.score.total}
                          <span className="text-base text-[#8b949e]">/100</span>
                        </div>
                        <div className="text-sm text-[#8b949e] pb-1">
                          {result.score.level} • {result.score.badge}
                        </div>
                      </div>
                      <div className="mt-4">
                        <ScoreBar score={result.score.total} max={100} />
                      </div>
                    </div>

                    <div className="bg-surface-1 border border-[#30363d] rounded-xl p-5 md:col-span-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs text-[#8b949e]">Repository</div>
                          <div className="mt-1 text-white font-semibold text-lg wrap-break-word">
                            {result.repo.fullName}
                          </div>
                          <div className="mt-1 text-sm text-[#8b949e] leading-relaxed">
                            {result.repo.description || "No description provided."}
                          </div>
                        </div>

                        <Link
                          href={result.repo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-[#58a6ff] hover:underline whitespace-nowrap"
                        >
                          View on GitHub
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-surface-2 border border-[#30363d] rounded-lg p-3">
                          <div className="text-[10px] text-[#8b949e]">Stars</div>
                          <div className="text-white font-semibold">{result.repo.stars}</div>
                        </div>
                        <div className="bg-surface-2 border border-[#30363d] rounded-lg p-3">
                          <div className="text-[10px] text-[#8b949e]">Forks</div>
                          <div className="text-white font-semibold">{result.repo.forks}</div>
                        </div>
                        <div className="bg-surface-2 border border-[#30363d] rounded-lg p-3">
                          <div className="text-[10px] text-[#8b949e]">Files</div>
                          <div className="text-white font-semibold">{result.snapshot.files.fileCount}</div>
                        </div>
                        <div className="bg-surface-2 border border-[#30363d] rounded-lg p-3">
                          <div className="text-[10px] text-[#8b949e]">Last push</div>
                          <div className="text-white font-semibold">{formatDate(result.repo.pushedAt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-1 border border-[#30363d] rounded-xl p-5">
                    <div className="text-sm font-semibold text-white">Summary</div>
                    <p className="mt-2 text-sm text-[#c9d1d9] leading-relaxed">{result.summary}</p>
                  </div>

                  <div className="bg-surface-1 border border-[#30363d] rounded-xl p-5">
                    <div className="text-sm font-semibold text-white">Score breakdown</div>

                    <div className="mt-4 space-y-3">
                      {result.score.breakdown.map((item) => (
                        <div key={item.key} className="bg-surface-2 border border-[#30363d] rounded-lg p-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-sm text-white">{item.label}</div>
                            <div className="text-xs text-[#8b949e]">{item.score}/{item.max}</div>
                          </div>
                          <div className="mt-2">
                            <ScoreBar score={item.score} max={item.max} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-surface-2 border border-[#30363d] rounded-lg p-4">
                        <div className="text-xs text-[#8b949e]">Languages (top)</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {result.snapshot.languagesTop.length ? (
                            result.snapshot.languagesTop.map((l) => (
                              <span
                                key={l.name}
                                className="text-xs text-[#c9d1d9] border border-[#30363d] bg-background/40 rounded-full px-2 py-1"
                              >
                                {l.name} {l.percent}%
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#8b949e]">No language data</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-surface-2 border border-[#30363d] rounded-lg p-4">
                        <div className="text-xs text-[#8b949e]">Git activity (last 90 days)</div>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] text-[#8b949e]">Commits</div>
                            <div className="text-white font-semibold">
                              {result.snapshot.git.commitsLast90Days}
                              {result.snapshot.git.commitsLast90DaysCapped ? "+" : ""}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#8b949e]">Active days</div>
                            <div className="text-white font-semibold">{result.snapshot.git.activeCommitDaysLast90Days}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#8b949e]">Branches</div>
                            <div className="text-white font-semibold">{result.snapshot.git.branches}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#8b949e]">PRs</div>
                            <div className="text-white font-semibold">{result.snapshot.git.pullRequests}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-[10px] text-[#8b949e]">Conventional commits</div>
                            <div className="text-white font-semibold">
                              {formatPercent(result.snapshot.git.conventionalCommitRate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-1 border border-[#30363d] rounded-xl p-5">
                    <div className="text-sm font-semibold text-white">Personalized roadmap</div>
                    <ol className="mt-3 space-y-2 text-sm text-[#c9d1d9] leading-relaxed list-decimal pl-5">
                      {result.roadmap.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
