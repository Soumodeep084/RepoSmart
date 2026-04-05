const crypto = require("crypto");

const { redisGetJson, redisSetJson } = require("../config/redis");

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function getGitHubApiConfig() {
  const base = process.env.GITHUB_API_BASE;
  const version = process.env.GITHUB_API_VERSION;

  if (!isNonEmptyString(base)) {
    const err = new Error(
      "GitHub API is not configured. Set GITHUB_API_BASE in server/.env.",
    );
    err.statusCode = 500;
    throw err;
  }

  if (!isNonEmptyString(version)) {
    const err = new Error(
      "GitHub API is not configured. Set GITHUB_API_VERSION in server/.env.",
    );
    err.statusCode = 500;
    throw err;
  }

  return {
    base: base.trim().replace(/\/+$/, ""),
    version: version.trim(),
  };
}

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function safeNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function daysBetween(isoDateA, isoDateB) {
  const a = new Date(isoDateA).getTime();
  const b = new Date(isoDateB).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const deltaMs = Math.abs(b - a);
  return Math.floor(deltaMs / (1000 * 60 * 60 * 24));
}

function parseGithubRepoInput(input) {
  if (!isNonEmptyString(input)) {
    throw badRequest("Please provide a GitHub repository URL.");
  }

  const trimmed = input.trim();

  // Allow shorthand "owner/repo".
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    const parts = trimmed.replace(/^github\.com\//i, "").split("/").filter(Boolean);
    if (parts.length >= 2) {
      return {
        owner: parts[0],
        repo: parts[1].replace(/\.git$/i, ""),
      };
    }
    throw badRequest(
      "Invalid input. Use a full GitHub URL like https://github.com/owner/repo",
    );
  }

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw badRequest("Invalid URL. Please paste a valid GitHub repository link.");
  }

  if (!/^(www\.)?github\.com$/i.test(url.hostname)) {
    throw badRequest("Only github.com repository links are supported.");
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    throw badRequest("Invalid GitHub repository URL. Expected /owner/repo");
  }

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/i, "");

  if (!owner || !repo) {
    throw badRequest("Invalid GitHub repository URL. Expected /owner/repo");
  }

  return { owner, repo };
}

function buildGitHubApiUrl(path, query) {
  const { base } = getGitHubApiConfig();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalizedPath, base);
  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function getAnalyzeCacheTtlSeconds() {
  const raw = process.env.REDIS_ANALYZE_TTL_SECONDS;
  if (!isNonEmptyString(raw)) return 3600;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 3600;
  return Math.floor(parsed);
}

function getAiScanCacheTtlSeconds() {
  const raw = process.env.REDIS_AI_SCAN_TTL_SECONDS;
  if (!isNonEmptyString(raw)) return 900;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 900;
  return Math.floor(parsed);
}

function buildAnalyzeCacheKey(owner, repo) {
  const baseKey = `analyze:v1:${String(owner).toLowerCase()}/${String(repo).toLowerCase()}`;
  // Hash to keep keys short and safe.
  const digest = crypto.createHash("sha256").update(baseKey).digest("hex");
  return `analyze:v1:${digest}`;
}

function buildAiScanCacheKey(owner, repo, model) {
  const baseKey = `ai-scan:v1:${String(owner).toLowerCase()}/${String(repo).toLowerCase()}:${String(model || "").toLowerCase()}`;
  const digest = crypto.createHash("sha256").update(baseKey).digest("hex");
  return `ai-scan:v1:${digest}`;
}

function getOpenRouterApiKey() {
  const key = process.env.OPENROUTER_API_KEY || process.env.openrouter_api_key;
  if (!isNonEmptyString(key)) {
    const err = new Error(
      "OpenRouter is not configured. Set OPENROUTER_API_KEY in server/.env.",
    );
    err.statusCode = 500;
    throw err;
  }
  return key.trim();
}

function getOpenRouterModels() {
  const rawList = process.env.OPENROUTER_MODELS || process.env.openrouter_models || "";
  const rawModel = process.env.OPENROUTER_MODEL || process.env.openrouter_model || "";

  let models = [];

  if (isNonEmptyString(rawList)) {
    models = rawList
      .split(/[,\n]/)
      .map((m) => String(m || "").trim())
      .filter(Boolean);
  } else if (isNonEmptyString(rawModel)) {
    models = [rawModel.trim()];
  } else {
    // User requested the OpenRouter free route by default.
    models = ["openrouter/free"];
  }

  // Deduplicate while preserving order.
  const seen = new Set();
  models = models.filter((m) => {
    const key = m.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (models.length === 0) {
    const err = new Error(
      "OpenRouter models are not configured. Set OPENROUTER_MODELS in server/.env.",
    );
    err.statusCode = 500;
    throw err;
  }

  // Safety rails: enforce free-only usage.
  for (const model of models) {
    // OpenRouter routed models (like openrouter/free) are allowed, but we still
    // enforce $0 routing via provider.max_price in the request.
    if (model.startsWith("openrouter/")) continue;

    if (!model.endsWith(":free")) {
      const err = new Error(
        `Paid models are not allowed. Model must end with ':free' (got: ${model}).`,
      );
      err.statusCode = 500;
      throw err;
    }
  }

  return models;
}

function extractOpenRouterText(payload) {
  const choice = payload && payload.choices && payload.choices[0];
  const message = choice && choice.message;
  const content = message && message.content;

  if (typeof content === "string") return content.trim();

  // Some OpenAI-compatible APIs may return a rich content array.
  if (Array.isArray(content)) {
    const text = content
      .map((part) => (part && part.type === "text" && typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();
    return text;
  }

  return "";
}

async function openRouterGenerateText(prompt) {
  const apiKey = getOpenRouterApiKey();
  const models = getOpenRouterModels();

  const shouldFallback = (statusCode, message) => {
    // Typical transient failures for free-tier/shared providers.
    if (statusCode === 429) return true;
    if (statusCode === 408) return true;
    if (statusCode === 502 || statusCode === 503 || statusCode === 504) return true;
    if (statusCode === 404 && typeof message === "string" && /no endpoints found/i.test(message)) {
      return true;
    }
    if (typeof message === "string" && /rate\s*limit|temporarily|overloaded|try again/i.test(message)) {
      return true;
    }
    return false;
  };

  let lastError = null;

  for (const model of models) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Optional headers recommended by OpenRouter (harmless if omitted)
        "X-Title": "RepoSmart",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1024,
        provider: {
          // Enforce free-only usage at the routing layer.
          // If no $0 provider is available, the request will fail rather than charge.
          max_price: { prompt: 0, completion: 0 },
          sort: "price",
        },
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      let message = `OpenRouter API request failed (${res.status})`;
      if (json && typeof json === "object" && json.error && typeof json.error === "object") {
        if (typeof json.error.message === "string" && json.error.message.trim().length > 0) {
          message = json.error.message;
        }

        // OpenRouter sometimes includes provider details under error.metadata.raw.
        if (
          json.error.metadata &&
          typeof json.error.metadata === "object" &&
          typeof json.error.metadata.raw === "string" &&
          json.error.metadata.raw.trim().length > 0
        ) {
          message = json.error.metadata.raw;
        }
      }

      const err = new Error(message);
      err.statusCode = res.status;
      lastError = err;

      if (shouldFallback(res.status, message)) {
        continue;
      }

      throw err;
    }

    const text = extractOpenRouterText(json);
    if (!isNonEmptyString(text)) {
      const err = new Error("OpenRouter returned an empty response.");
      err.statusCode = 502;
      lastError = err;
      continue;
    }

    return { model, text };
  }

  throw lastError || new Error("OpenRouter request failed.");
}

function getGitHubHeaders() {
  const { version } = getGitHubApiConfig();
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "RepoSmart",
    "X-GitHub-Api-Version": version,
  };

  const token = process.env.GITHUB_TOKEN;
  if (isNonEmptyString(token)) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return headers;
}

async function githubRequestJson(path, query) {
  const url = buildGitHubApiUrl(path, query);
  const res = await fetch(url, {
    method: "GET",
    headers: getGitHubHeaders(),
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Ignore non-JSON responses.
  }

  if (!res.ok) {
    const message =
      json && typeof json === "object" && typeof json.message === "string"
        ? json.message
        : `GitHub API request failed (${res.status})`;

    const err = new Error(message);
    err.statusCode = res.status;
    err.github = { url, message };
    throw err;
  }

  return { data: json, headers: res.headers };
}

async function githubRequestText(path, query, accept) {
  const url = buildGitHubApiUrl(path, query);
  const headers = getGitHubHeaders();
  if (accept) headers.Accept = accept;

  const res = await fetch(url, {
    method: "GET",
    headers,
  });

  const text = await res.text();

  if (!res.ok) {
    let message = `GitHub API request failed (${res.status})`;
    try {
      const json = text ? JSON.parse(text) : null;
      if (json && typeof json.message === "string") message = json.message;
    } catch {
      // ignore
    }

    const err = new Error(message);
    err.statusCode = res.status;
    err.github = { url, message };
    throw err;
  }

  return { data: text, headers: res.headers };
}

function parseLastPageFromLinkHeader(linkHeader) {
  if (!isNonEmptyString(linkHeader)) return null;

  const parts = linkHeader.split(",").map((part) => part.trim());
  const lastPart = parts.find((part) => part.includes('rel="last"'));
  if (!lastPart) return null;

  const urlMatch = lastPart.match(/<([^>]+)>/);
  if (!urlMatch) return null;

  try {
    const url = new URL(urlMatch[1]);
    const page = Number(url.searchParams.get("page"));
    return Number.isFinite(page) ? page : null;
  } catch {
    return null;
  }
}

function hasPathPrefix(pathsSet, prefix) {
  const normalized = prefix.endsWith("/") ? prefix : `${prefix}/`;
  for (const p of pathsSet) {
    if (p.startsWith(normalized)) return true;
  }
  return false;
}

function countByTopLevelFolder(filePaths) {
  const counts = new Map();
  for (const p of filePaths) {
    const parts = p.split("/").filter(Boolean);
    const key = parts.length > 1 ? parts[0] : "/";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Object.fromEntries(counts.entries());
}

function analyzeReadme(readmeText) {
  const text = isNonEmptyString(readmeText) ? readmeText : "";

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const hasInstall = /\b(install|installation|getting started|setup)\b/i.test(text);
  const hasUsage = /\b(usage|how to use|examples?)\b/i.test(text);
  const hasScreenshots = /\b(screenshot|demo|preview)\b/i.test(text) || /!\[[^\]]*\]\([^)]+\)/.test(text);
  const hasBadges = /\[!\[[^\]]+\]\([^)]+\)\]/.test(text);
  const hasContributing = /\b(contributing|contribution)\b/i.test(text);
  const hasLicenseSection = /\blicense\b/i.test(text);
  const hasEnv = /\b\.env\b|environment variables|config(uration)?/i.test(text);
  const hasApiDocs = /\bapi\b|openapi|swagger/i.test(text);

  const headings = Array.from(text.matchAll(/^#{1,6}\s+(.+)$/gm)).map((m) => m[1].trim());

  return {
    present: wordCount > 0,
    wordCount,
    headings,
    hasInstall,
    hasUsage,
    hasScreenshots,
    hasBadges,
    hasContributing,
    hasLicenseSection,
    hasEnv,
    hasApiDocs,
    isVeryShort: wordCount > 0 && wordCount < 80,
  };
}

function detectTooling(pathsSet) {
  const basenames = new Set();
  for (const p of pathsSet) {
    if (typeof p !== "string") continue;
    const normalized = p.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    if (parts.length === 0) continue;
    basenames.add(parts[parts.length - 1]);
  }

  const hasAny = (...names) =>
    names.some((name) => pathsSet.has(name) || basenames.has(name));

  const hasEslint =
    hasAny(
      ".eslintrc",
      ".eslintrc.js",
      ".eslintrc.cjs",
      ".eslintrc.json",
      ".eslintrc.yml",
      ".eslintrc.yaml",
      "eslint.config.js",
      "eslint.config.mjs",
      "eslint.config.cjs",
    );

  const hasPrettier =
    hasAny(
      ".prettierrc",
      ".prettierrc.js",
      ".prettierrc.cjs",
      ".prettierrc.json",
      ".prettierrc.yml",
      ".prettierrc.yaml",
      "prettier.config.js",
      "prettier.config.cjs",
      "prettier.config.mjs",
    );

  const hasEditorConfig = hasAny(".editorconfig");

  const hasGitHubActions = hasPathPrefix(pathsSet, ".github/workflows");
  const hasDependabot = pathsSet.has(".github/dependabot.yml") || pathsSet.has(".github/dependabot.yaml");

  const hasTestsDir =
    hasPathPrefix(pathsSet, "test") ||
    hasPathPrefix(pathsSet, "tests") ||
    hasPathPrefix(pathsSet, "__tests__") ||
    Array.from(pathsSet).some((p) => /(^|\/)__tests__(\/|$)/.test(p));

  const hasDocsDir = hasPathPrefix(pathsSet, "docs") || hasPathPrefix(pathsSet, "doc");

  const hasSrcDir = hasPathPrefix(pathsSet, "src") || hasPathPrefix(pathsSet, "app");

  const hasLockfile =
    hasAny(
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "bun.lockb",
      "bun.lock",
    );

  const hasDocker = hasAny("Dockerfile", "docker-compose.yml", "docker-compose.yaml");

  const hasEnvExample =
    hasAny(".env.example", ".env.sample", ".env.template");

  const hasContributingFile =
    hasAny(
      "CONTRIBUTING.md",
      "CONTRIBUTION.md",
      ".github/CONTRIBUTING.md",
      ".github/CONTRIBUTION.md",
    );

  const hasCodeOfConduct =
    hasAny("CODE_OF_CONDUCT.md", ".github/CODE_OF_CONDUCT.md");

  const hasChangelog = hasAny("CHANGELOG.md", "CHANGES.md");

  const hasSecurityPolicy = hasAny("SECURITY.md", ".github/SECURITY.md");

  const hasIssueTemplates = hasPathPrefix(pathsSet, ".github/ISSUE_TEMPLATE");
  const hasPullRequestTemplate =
    pathsSet.has(".github/PULL_REQUEST_TEMPLATE.md") || hasPathPrefix(pathsSet, ".github/PULL_REQUEST_TEMPLATE");

  const hasGitIgnore = hasAny(".gitignore");

  const hasDeployConfig =
    hasAny("vercel.json", "netlify.toml", "firebase.json", "app.yaml", "render.yaml");

  return {
    hasEslint,
    hasPrettier,
    hasEditorConfig,
    hasGitHubActions,
    hasDependabot,
    hasTestsDir,
    hasDocsDir,
    hasSrcDir,
    hasLockfile,
    hasDocker,
    hasEnvExample,
    hasContributingFile,
    hasCodeOfConduct,
    hasChangelog,
    hasSecurityPolicy,
    hasIssueTemplates,
    hasPullRequestTemplate,
    hasGitIgnore,
    hasDeployConfig,
  };
}

function conventionalCommitRate(commits) {
  if (!Array.isArray(commits) || commits.length === 0) return 0;
  const re = /^(feat|fix|docs|chore|refactor|test|style|perf|ci|build|revert)(\([^)]+\))?:\s.+/i;

  let matches = 0;
  for (const c of commits) {
    const msg = c && c.commit && c.commit.message;
    if (typeof msg === "string" && re.test(msg.trim())) {
      matches += 1;
    }
  }

  return matches / commits.length;
}

function uniqueCommitDays(commits) {
  const days = new Set();
  for (const c of commits) {
    const date = c && c.commit && c.commit.author && c.commit.author.date;
    if (typeof date === "string") {
      days.add(date.slice(0, 10));
    }
  }
  return days.size;
}

function computeScore({
  repo,
  readme,
  tooling,
  tree,
  languages,
  gitStats,
}) {
  const breakdown = [];

  // Documentation (0-20)
  let documentation = 0;
  if (readme.present) documentation += 8;
  if (readme.hasInstall) documentation += 3;
  if (readme.hasUsage) documentation += 3;
  if (readme.hasScreenshots) documentation += 2;
  if (readme.hasBadges) documentation += 1;
  if (tooling.hasContributingFile || readme.hasContributing) documentation += 1;
  if (tooling.hasChangelog) documentation += 1;
  if (tooling.hasCodeOfConduct) documentation += 1;

  // Avoid giving full marks for a tiny README.
  if (readme.isVeryShort) documentation = Math.max(0, documentation - 2);

  documentation = clamp(documentation, 0, 20);
  breakdown.push({ key: "documentation", label: "Documentation & clarity", score: documentation, max: 20 });

  // Structure & organization (0-15)
  let structure = 0;
  if (tooling.hasSrcDir) structure += 5;
  if (tooling.hasDocsDir) structure += 2;
  if (tooling.hasGitIgnore) structure += 2;
  if (tooling.hasLockfile) structure += 2;
  if (tree && tree.fileCount >= 10) structure += 2;
  if (tree && tree.fileCount >= 50) structure += 2;

  structure = clamp(structure, 0, 15);
  breakdown.push({ key: "structure", label: "Project structure", score: structure, max: 15 });

  // Code quality & readability (0-25)
  let codeQuality = 0;
  if (tooling.hasEslint) codeQuality += 8;
  if (tooling.hasPrettier) codeQuality += 4;
  if (tooling.hasEditorConfig) codeQuality += 2;

  const languageCount = Object.keys(languages || {}).length;
  if (languageCount >= 1) codeQuality += 3;
  if (languageCount >= 3) codeQuality += 2;

  // Slight bonus if mostly TypeScript (signal for typed codebase)
  const languageBytes = Object.entries(languages || {});
  const totalBytes = languageBytes.reduce((acc, [, bytes]) => acc + safeNumber(bytes, 0), 0);
  const tsBytes = safeNumber(languages && languages.TypeScript, 0);
  if (totalBytes > 0 && tsBytes / totalBytes > 0.35) codeQuality += 3;

  // Penalize huge trees if truncated (less confidence)
  if (tree && tree.truncated) codeQuality = Math.max(0, codeQuality - 1);

  codeQuality = clamp(codeQuality, 0, 25);
  breakdown.push({ key: "codeQuality", label: "Code quality", score: codeQuality, max: 25 });

  // Testing & maintainability (0-20)
  let testing = 0;
  if (tooling.hasTestsDir) testing += 8;
  if (tooling.hasGitHubActions) testing += 7;
  if (tooling.hasDependabot) testing += 2;
  if (tooling.hasSecurityPolicy) testing += 1;
  if (readme.hasApiDocs) testing += 2;

  testing = clamp(testing, 0, 20);
  breakdown.push({ key: "testing", label: "Testing & maintainability", score: testing, max: 20 });

  // Git hygiene & consistency (0-10)
  let gitConsistency = 0;
  const commits90 = safeNumber(gitStats.commitsLast90Days, 0);
  const activeDays = safeNumber(gitStats.activeCommitDaysLast90Days, 0);
  const conventionalRate = safeNumber(gitStats.conventionalCommitRate, 0);
  const branches = safeNumber(gitStats.branches, 1);
  const prs = safeNumber(gitStats.pullRequests, 0);

  if (commits90 >= 5) gitConsistency += 3;
  if (commits90 >= 15) gitConsistency += 2;
  if (activeDays >= 5) gitConsistency += 2;
  if (activeDays >= 12) gitConsistency += 1;
  if (conventionalRate >= 0.4) gitConsistency += 1;
  if (branches >= 2) gitConsistency += 1;
  if (prs >= 1) gitConsistency += 0.5;

  gitConsistency = clamp(gitConsistency, 0, 10);
  breakdown.push({ key: "git", label: "Commit consistency", score: gitConsistency, max: 10 });

  // Real-world readiness (0-10)
  let readiness = 0;
  if (isNonEmptyString(repo.description) && repo.description.trim().length >= 20) readiness += 2;
  if (Array.isArray(repo.topics) && repo.topics.length >= 3) readiness += 2;
  if (tooling.hasDocker) readiness += 2;
  if (tooling.hasDeployConfig) readiness += 2;
  if (readme.hasEnv) readiness += 2;

  // Avoid overly penalizing brand new repos; but forks should not score high on originality.
  if (repo.fork) readiness = Math.max(0, readiness - 2);

  readiness = clamp(readiness, 0, 10);
  breakdown.push({ key: "readiness", label: "Real-world readiness", score: readiness, max: 10 });

  const total = breakdown.reduce((acc, item) => acc + item.score, 0);

  const level = total >= 80 ? "Advanced" : total >= 55 ? "Intermediate" : "Beginner";
  const badge = total >= 85 ? "Gold" : total >= 70 ? "Silver" : total >= 55 ? "Bronze" : "Starter";

  return {
    total: Math.round(total),
    level,
    badge,
    breakdown,
  };
}

function buildSummary({ score, readme, tooling, gitStats, repo }) {
  const strengths = [];
  const gaps = [];

  if (readme.present && !readme.isVeryShort) strengths.push("README is present and reasonably detailed");
  else gaps.push("README needs clearer setup/usage documentation");

  if (tooling.hasEslint || tooling.hasPrettier) strengths.push("has code quality tooling (lint/format) signals");
  else gaps.push("add linting/formatting to improve readability and consistency");

  if (tooling.hasTestsDir) strengths.push("includes a testing footprint");
  else gaps.push("add unit/integration tests to improve maintainability");

  if (tooling.hasGitHubActions) strengths.push("automates checks with CI workflows");
  else gaps.push("add GitHub Actions CI for lint/test on every push/PR");

  const commits90 = safeNumber(gitStats.commitsLast90Days, 0);
  if (commits90 >= 10) strengths.push("recent development activity is visible in commit history");
  else gaps.push("commit more consistently with smaller, meaningful changes");

  const lastPushDays = daysBetween(repo.pushed_at, new Date().toISOString());
  if (typeof lastPushDays === "number" && lastPushDays <= 30) strengths.push("recently updated");
  else gaps.push("refresh the project (recent commits) to show it’s maintained");

  const strengthText = strengths.slice(0, 2).join("; ");
  const gapText = gaps.slice(0, 2).join("; ");

  const headline = `Score ${score.total}/100 (${score.level}, ${score.badge}).`;
  const note = `Strengths: ${strengthText || "some good foundations are present"}.`;
  const next = `Needs work: ${gapText || "focus on polishing docs/tests/CI"}.`;

  return [headline, note, next].join(" ");
}

function buildRoadmap({ score, readme, tooling, gitStats, repo }) {
  const steps = [];

  if (!readme.present || readme.isVeryShort || !readme.hasInstall || !readme.hasUsage) {
    steps.push(
      "Improve README: add a 1-paragraph overview, setup/install steps, usage examples, and (if applicable) screenshots/demo links.",
    );
  }

  if (!tooling.hasGitIgnore) {
    steps.push("Add a `.gitignore` suited to your stack to avoid committing build artifacts and secrets.");
  }

  if (!tooling.hasEslint) {
    steps.push("Add linting (e.g., ESLint) and fix high-signal warnings to improve code consistency.");
  }

  if (!tooling.hasPrettier) {
    steps.push("Add a formatter (e.g., Prettier) and apply consistent formatting across the repo.");
  }

  if (!tooling.hasTestsDir) {
    steps.push(
      "Add tests: start with unit tests for core logic, then add at least one integration/e2e test for the main user flow.",
    );
  }

  if (!tooling.hasGitHubActions) {
    steps.push(
      "Add CI (GitHub Actions): run lint + tests on push and pull requests; fail the build when checks fail.",
    );
  }

  if (!tooling.hasDependabot) {
    steps.push("Add Dependabot to keep dependencies updated automatically.");
  }

  if (!tooling.hasEnvExample && readme.hasEnv) {
    steps.push("Add an `.env.example` that documents required environment variables (without secrets).");
  }

  if (!tooling.hasContributingFile) {
    steps.push("Add `CONTRIBUTING.md` with how to run, test, and propose changes.");
  }

  if (!tooling.hasSecurityPolicy) {
    steps.push("Add `SECURITY.md` explaining how to report vulnerabilities.");
  }

  const commits90 = safeNumber(gitStats.commitsLast90Days, 0);
  if (commits90 < 10) {
    steps.push(
      "Improve Git history: commit smaller, focused changes and use clear commit messages (consider Conventional Commits).");
  }

  if (repo.fork) {
    steps.push("If this is a fork, document what you changed and why; ideally link to upstream PRs or issues.");
  }

  // Ensure roadmap always has at least a few items.
  if (steps.length < 3) {
    steps.push("Add a small feature or refactor and document it to show iterative development.");
    steps.push("Open a pull request for a change (even in your own repo) to demonstrate PR workflow.");
  }

  // Personalize ordering: if score is already high, emphasize polish/community.
  if (score.total >= 85) {
    steps.unshift("Polish: add a short architecture section and a clear feature list in the README.");
  }

  // Deduplicate while preserving order.
  const seen = new Set();
  const unique = [];
  for (const step of steps) {
    const key = crypto.createHash("sha1").update(step).digest("hex");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(step);
  }

  return unique.slice(0, 10);
}

async function fetchCountFromPagedEndpoint(path, query) {
  const { data, headers } = await githubRequestJson(path, query);
  const link = headers.get("link");
  const lastPage = parseLastPageFromLinkHeader(link);

  if (typeof lastPage === "number") {
    return { count: lastPage, sampled: true };
  }

  if (Array.isArray(data)) {
    return { count: data.length, sampled: true };
  }

  return { count: 0, sampled: true };
}

async function fetchRecentCommits(owner, repo, sinceIso) {
  const commits = [];
  let page = 1;
  const perPage = 100;
  const maxPages = 3;
  let capped = false;

  while (page <= maxPages) {
    const { data, headers } = await githubRequestJson(`/repos/${owner}/${repo}/commits`, {
      since: sinceIso,
      per_page: perPage,
      page,
    });

    if (!Array.isArray(data) || data.length === 0) break;

    commits.push(...data);

    const link = headers.get("link");
    const hasNext = isNonEmptyString(link) && link.includes('rel="next"');

    if (!hasNext) {
      capped = false;
      break;
    }

    if (page === maxPages) {
      capped = true;
      break;
    }

    page += 1;
  }

  return { commits, capped };
}

exports.analyzeRepository = async (req, res) => {
  try {
    const url = (req.body && (req.body.url || req.body.input)) || "";

    const { owner, repo } = parseGithubRepoInput(url);

    const cacheKey = buildAnalyzeCacheKey(owner, repo);
    const cached = await redisGetJson(cacheKey);
    if (cached && typeof cached === "object") {
      res.set("X-RepoSmart-Cache", "HIT");
      if (cached.input && typeof cached.input === "object") {
        cached.input = { ...cached.input, url };
      }
      return res.json(cached);
    }

    const repoMetaResp = await githubRequestJson(`/repos/${owner}/${repo}`);
    const repoMeta = repoMetaResp.data;

    const languagesResp = await githubRequestJson(`/repos/${owner}/${repo}/languages`);
    const languages = languagesResp.data || {};

    let readmeText = "";
    try {
      const readmeResp = await githubRequestText(
        `/repos/${owner}/${repo}/readme`,
        undefined,
        "application/vnd.github.raw",
      );
      readmeText = readmeResp.data;
    } catch {
      readmeText = "";
    }

    let treeInfo = {
      fileCount: 0,
      directoryCount: 0,
      truncated: false,
      topLevelCounts: {},
      paths: [],
    };

    try {
      const treeResp = await githubRequestJson(`/repos/${owner}/${repo}/git/trees/${repoMeta.default_branch}`, {
        recursive: 1,
      });

      const tree = treeResp.data;
      const items = tree && Array.isArray(tree.tree) ? tree.tree : [];

      const filePaths = items
        .filter((item) => item && item.type === "blob" && typeof item.path === "string")
        .map((item) => item.path);

      const dirCount = items.filter((item) => item && item.type === "tree").length;

      treeInfo = {
        fileCount: filePaths.length,
        directoryCount: dirCount,
        truncated: Boolean(tree && tree.truncated),
        topLevelCounts: countByTopLevelFolder(filePaths),
        paths: filePaths,
      };
    } catch {
      // Tree API occasionally fails for very large repos; keep analysis going.
    }

    const pathsSet = new Set(treeInfo.paths);
    const tooling = detectTooling(pathsSet);

    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    let recentCommits = [];
    let commitsCapped = false;
    try {
      const commitsResp = await fetchRecentCommits(owner, repo, since);
      recentCommits = commitsResp.commits;
      commitsCapped = commitsResp.capped;
    } catch (err) {
      // Empty repos can return 409 "Git Repository is empty" for commit endpoints.
      if (err && typeof err.statusCode === "number" && err.statusCode === 409) {
        recentCommits = [];
        commitsCapped = false;
      } else {
        throw err;
      }
    }

    const safeCount = async (path, query) => {
      try {
        const resp = await fetchCountFromPagedEndpoint(path, query);
        return resp.count;
      } catch (err) {
        if (err && typeof err.statusCode === "number" && err.statusCode === 409) {
          return 0;
        }
        throw err;
      }
    };

    const branches = await safeCount(`/repos/${owner}/${repo}/branches`, { per_page: 1 });
    const pullRequests = await safeCount(`/repos/${owner}/${repo}/pulls`, { state: "all", per_page: 1 });
    const contributors = await safeCount(`/repos/${owner}/${repo}/contributors`, { per_page: 1, anon: 1 });
    const releases = await safeCount(`/repos/${owner}/${repo}/releases`, { per_page: 1 });

    const gitStats = {
      commitsLast90Days: recentCommits.length,
      commitsLast90DaysCapped: commitsCapped,
      activeCommitDaysLast90Days: uniqueCommitDays(recentCommits),
      conventionalCommitRate: conventionalCommitRate(recentCommits),
      branches,
      pullRequests,
      contributors,
      releases,
    };

    const readme = analyzeReadme(readmeText);

    const score = computeScore({
      repo: repoMeta,
      readme,
      tooling,
      tree: treeInfo,
      languages,
      gitStats,
    });

    const summary = buildSummary({ score, readme, tooling, gitStats, repo: repoMeta });
    const roadmap = buildRoadmap({ score, readme, tooling, gitStats, repo: repoMeta });

    // Convert language bytes to percentage breakdown (top 5).
    const entries = Object.entries(languages);
    const total = entries.reduce((acc, [, bytes]) => acc + safeNumber(bytes, 0), 0);
    const languagesTop = entries
      .map(([name, bytes]) => ({
        name,
        bytes: safeNumber(bytes, 0),
      }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        percent: total > 0 ? Math.round((item.bytes / total) * 100) : 0,
      }));

    const payload = {
      input: { owner, repo, url },
      repo: {
        fullName: repoMeta.full_name,
        htmlUrl: repoMeta.html_url,
        description: repoMeta.description,
        defaultBranch: repoMeta.default_branch,
        isFork: Boolean(repoMeta.fork),
        visibility: repoMeta.visibility,
        stars: safeNumber(repoMeta.stargazers_count, 0),
        forks: safeNumber(repoMeta.forks_count, 0),
        watchers: safeNumber(repoMeta.watchers_count, 0),
        openIssues: safeNumber(repoMeta.open_issues_count, 0),
        license: repoMeta.license ? repoMeta.license.spdx_id : null,
        topics: Array.isArray(repoMeta.topics) ? repoMeta.topics : [],
        createdAt: repoMeta.created_at,
        updatedAt: repoMeta.updated_at,
        pushedAt: repoMeta.pushed_at,
        sizeKb: safeNumber(repoMeta.size, 0),
      },
      snapshot: {
        files: {
          fileCount: treeInfo.fileCount,
          directoryCount: treeInfo.directoryCount,
          truncated: treeInfo.truncated,
          topLevelCounts: treeInfo.topLevelCounts,
        },
        languagesTop,
        readme: {
          present: readme.present,
          wordCount: readme.wordCount,
          hasInstall: readme.hasInstall,
          hasUsage: readme.hasUsage,
          hasScreenshots: readme.hasScreenshots,
          hasBadges: readme.hasBadges,
        },
        tooling,
        git: gitStats,
      },
      score,
      summary,
      roadmap,

      // Cache metadata is intentionally omitted from response.
    };

    // Best-effort cache write.
    await redisSetJson(cacheKey, payload, getAnalyzeCacheTtlSeconds());

    res.set("X-RepoSmart-Cache", "MISS");
    res.json(payload);
  } catch (err) {
    const status = err && typeof err.statusCode === "number" ? err.statusCode : 500;

    // Friendly GitHub messages.
    let message = err instanceof Error ? err.message : "Unable to analyze repository.";

    if (status === 404) {
      message = "Repository not found (or it may be private).";
    }

    if (status === 403 && /rate limit/i.test(message)) {
      message = "GitHub API rate limit exceeded. Set GITHUB_TOKEN in server environment to increase limits.";
    }

    res.status(status).json({ message });
  }
};

exports.aiScanRepository = async (req, res) => {
  try {
    const url = (req.body && (req.body.url || req.body.input)) || "";

    const { owner, repo } = parseGithubRepoInput(url);

    const modelsSignature = getOpenRouterModels().join(",");
    const cacheKey = buildAiScanCacheKey(owner, repo, modelsSignature);
    const cached = await redisGetJson(cacheKey);
    if (cached && typeof cached === "object") {
      res.set("X-RepoSmart-Cache", "HIT");
      if (cached.input && typeof cached.input === "object") {
        cached.input = { ...cached.input, url };
      }
      return res.json(cached);
    }

    const repoMetaResp = await githubRequestJson(`/repos/${owner}/${repo}`);
    const repoMeta = repoMetaResp.data;

    const languagesResp = await githubRequestJson(`/repos/${owner}/${repo}/languages`);
    const languages = languagesResp.data || {};

    let readmeText = "";
    try {
      const readmeResp = await githubRequestText(
        `/repos/${owner}/${repo}/readme`,
        undefined,
        "application/vnd.github.raw",
      );
      readmeText = readmeResp.data;
    } catch {
      readmeText = "";
    }

    let treeInfo = {
      fileCount: 0,
      directoryCount: 0,
      truncated: false,
      topLevelCounts: {},
      paths: [],
    };

    try {
      const treeResp = await githubRequestJson(`/repos/${owner}/${repo}/git/trees/${repoMeta.default_branch}`, {
        recursive: 1,
      });

      const tree = treeResp.data;
      const items = tree && Array.isArray(tree.tree) ? tree.tree : [];

      const filePaths = items
        .filter((item) => item && item.type === "blob" && typeof item.path === "string")
        .map((item) => item.path);

      const dirCount = items.filter((item) => item && item.type === "tree").length;

      treeInfo = {
        fileCount: filePaths.length,
        directoryCount: dirCount,
        truncated: Boolean(tree && tree.truncated),
        topLevelCounts: countByTopLevelFolder(filePaths),
        paths: filePaths,
      };
    } catch {
      // keep going
    }

    const pathsSet = new Set(treeInfo.paths);
    const tooling = detectTooling(pathsSet);
    const readme = analyzeReadme(readmeText);

    // Language percentages (top 5)
    const entries = Object.entries(languages);
    const totalBytes = entries.reduce((acc, [, bytes]) => acc + safeNumber(bytes, 0), 0);
    const languagesTop = entries
      .map(([name, bytes]) => ({ name, bytes: safeNumber(bytes, 0) }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        percent: totalBytes > 0 ? Math.round((item.bytes / totalBytes) * 100) : 0,
      }));

    const metadata = {
      input: { owner, repo, url },
      repo: {
        fullName: repoMeta.full_name,
        htmlUrl: repoMeta.html_url,
        description: repoMeta.description,
        defaultBranch: repoMeta.default_branch,
        isFork: Boolean(repoMeta.fork),
        visibility: repoMeta.visibility,
        stars: safeNumber(repoMeta.stargazers_count, 0),
        forks: safeNumber(repoMeta.forks_count, 0),
        watchers: safeNumber(repoMeta.watchers_count, 0),
        openIssues: safeNumber(repoMeta.open_issues_count, 0),
        license: repoMeta.license ? repoMeta.license.spdx_id : null,
        topics: Array.isArray(repoMeta.topics) ? repoMeta.topics : [],
        createdAt: repoMeta.created_at,
        updatedAt: repoMeta.updated_at,
        pushedAt: repoMeta.pushed_at,
        sizeKb: safeNumber(repoMeta.size, 0),
      },
      snapshot: {
        files: {
          fileCount: treeInfo.fileCount,
          directoryCount: treeInfo.directoryCount,
          truncated: treeInfo.truncated,
          topLevelCounts: treeInfo.topLevelCounts,
        },
        languagesTop,
        readme: {
          present: readme.present,
          wordCount: readme.wordCount,
          hasInstall: readme.hasInstall,
          hasUsage: readme.hasUsage,
          hasScreenshots: readme.hasScreenshots,
          hasBadges: readme.hasBadges,
        },
        tooling,
      },
    };

    const prompt =
      "You are RepoSmart, an assistant that evaluates GitHub repositories using metadata only. " +
      "Given the JSON metadata below, produce:\n" +
      "1) A 2-3 sentence overview.\n" +
      "2) Strengths (3-6 bullet points).\n" +
      "3) Gaps/risks (3-6 bullet points).\n" +
      "4) A prioritized action plan (5 items, concrete, repo-agnostic).\n" +
      "Keep the response plain text (no markdown headings).\n\n" +
      `METADATA_JSON:\n${JSON.stringify(metadata, null, 2)}`;

    const ai = await openRouterGenerateText(prompt);

    const payload = {
      ...metadata,
      ai: {
        model: ai.model,
        output: ai.text,
      },
    };

    await redisSetJson(cacheKey, payload, getAiScanCacheTtlSeconds());

    res.set("X-RepoSmart-Cache", "MISS");
    res.json(payload);
  } catch (err) {
    const status = err && typeof err.statusCode === "number" ? err.statusCode : 500;

    let message = err instanceof Error ? err.message : "Unable to scan repository.";

    if (status === 404) {
      message = "Repository not found (or it may be private).";
    }

    if (status === 403 && /rate limit/i.test(message)) {
      message = "GitHub API rate limit exceeded. Set GITHUB_TOKEN in server environment to increase limits.";
    }

    res.status(status).json({ message });
  }
};
