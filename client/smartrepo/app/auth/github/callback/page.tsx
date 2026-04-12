"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { postJson } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { OAUTH_STATE_STORAGE_KEY } from "@/services/githubAuth";
import { LoadingVideo } from "@/components/ui/loading-video";

type AuthApiResponse = {
  id: string;
  username: string;
  email: string;
  token: string;
};

export default function GithubCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) {
      return;
    }
    hasProcessedRef.current = true;

    async function completeGithubAuth() {
      try {
        const params = new URLSearchParams(window.location.search);
        const oauthError = params.get("error");
        const oauthErrorDescription = params.get("error_description");
        const code = params.get("code");
        const state = params.get("state");
        const expectedState = sessionStorage.getItem(OAUTH_STATE_STORAGE_KEY);

        sessionStorage.removeItem(OAUTH_STATE_STORAGE_KEY);

        if (oauthError) {
          throw new Error(oauthErrorDescription || `GitHub sign in failed: ${oauthError}`);
        }

        if (!code) {
          throw new Error("Missing GitHub authorization code");
        }

        if (!state || !expectedState || state !== expectedState) {
          throw new Error("GitHub OAuth state validation failed");
        }

        const redirectUri = `${window.location.origin}/auth/github/callback`;

        const payload = await postJson<AuthApiResponse>("/api/auth/github", {
          code,
          redirectUri,
        });

        setAuth(payload);
        router.replace("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to complete GitHub sign in.");
      }
    }

    completeGithubAuth();
  }, [router]);

  if (!error) {
    return <LoadingVideo message="Completing GitHub sign in…" />;
  }

  return (
    <main className="min-h-screen bg-background text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-xl border border-[#30363d] bg-surface-1 p-6 text-center">
        <h1 className="text-xl font-semibold">GitHub Authentication</h1>
        <p className="mt-3 text-sm text-red-400">{error}</p>
      </div>
    </main>
  );
}
