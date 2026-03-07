"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Github, ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

type AuthApiResponse = {
  id: string;
  username: string;
  email: string;
  token: string;
};

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
}

function buildApiUrl(path: string) {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, base).toString();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

// Custom Google SVG Icon
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const SocialAuthButtons = () => (
  <>
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[#30363d]"></div>
      </div>
      <div className="relative flex justify-center text-xs sm:text-sm">
        <span className="px-2 bg-surface-1 text-[#8b949e]">
          Or continue with
        </span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        type="button"
        className="w-full border-[#30363d] bg-surface-2 text-white hover:bg-surface-3 hover:border-[#58a6ff]"
      >
        <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Google
      </Button>
      <Button
        variant="outline"
        type="button"
        className="w-full border-[#30363d] bg-surface-2 text-white hover:bg-surface-3 hover:border-[#58a6ff]"
      >
        <Github className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        GitHub
      </Button>
    </div>
  </>
);

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
}

export function AuthDialog({
  open,
  onOpenChange,
  defaultTab = "login",
}: AuthDialogProps) {
  // Tab & View State
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const shouldReduceMotion = useReducedMotion();
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const containerVariants = shouldReduceMotion
    ? ({
        hidden: { opacity: 1, y: 0, scale: 1 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0 } },
      } as const)
    : ({
        hidden: { opacity: 0, y: 18, scale: 0.99 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.38,
            ease,
            when: "beforeChildren",
            staggerChildren: 0.06,
            delayChildren: 0.04,
          },
        },
      } as const);

  const itemVariants = shouldReduceMotion
    ? ({
        hidden: { opacity: 1, y: 0 },
        show: { opacity: 1, y: 0, transition: { duration: 0 } },
      } as const)
    : ({
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.26, ease } },
      } as const);

  // Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  const storageKeys = useMemo(
    () => ({ token: "reposmart_token", user: "reposmart_user" }),
    [],
  );

  const persistAuth = (payload: AuthApiResponse) => {
    localStorage.setItem(storageKeys.token, payload.token);
    localStorage.setItem(
      storageKeys.user,
      JSON.stringify({
        id: payload.id,
        username: payload.username,
        email: payload.email,
      }),
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginSubmitting) return;

    setLoginError(null);
    setLoginSubmitting(true);

    try {
      const payload = await postJson<AuthApiResponse>("/api/auth/login", {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });
      persistAuth(payload);
      handleOpenChange(false);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerSubmitting) return;

    setRegisterError(null);
    setRegisterSubmitting(true);

    try {
      const payload = await postJson<AuthApiResponse>("/api/auth/register", {
        username: registerUsername.trim(),
        email: registerEmail.trim().toLowerCase(),
        password: registerPassword,
      });
      persistAuth(payload);
      handleOpenChange(false);
    } catch (err) {
      setRegisterError(
        err instanceof Error ? err.message : "Unable to create account.",
      );
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Forgot Password for:", forgotEmail);
    // Add toast notification here later!
  };

  // Ensure the tab matches the button that opened the dialog
  useEffect(() => {
    if (!open) return;
    setActiveTab(defaultTab);
    setIsForgotPassword(false);
    setLoginError(null);
    setRegisterError(null);
  }, [open, defaultTab]);

  // Reset internal view state when dialog closes so it opens fresh next time
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Small delay prevents UI jarring while the dialog animates out
      setTimeout(() => setIsForgotPassword(false), 200);
      setLoginError(null);
      setRegisterError(null);
      setLoginSubmitting(false);
      setRegisterSubmitting(false);
      setLoginPassword("");
      setRegisterPassword("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md bg-surface-1 border border-[#30363d] text-white p-0 rounded-xl overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <div className="flex items-center gap-3 mb-2 sm:mb-3">
            <ImageWithFallback
              src="/images/Hero_Image.png"
              alt="RepoSmart Logo"
              width={40}
              height={40}
            />
            <DialogTitle className="text-white text-lg sm:text-xl">
              <motion.span
                key={isForgotPassword ? "forgot-title" : "auth-title"}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease }}
                className="inline-block"
              >
                {isForgotPassword ? "Reset Password" : "Welcome to RepoSmart"}
              </motion.span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-[#8b949e] text-left">
            <motion.span
              key={
                isForgotPassword
                  ? "forgot-desc"
                  : activeTab === "login"
                    ? "login-desc"
                    : "register-desc"
              }
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease }}
              className="inline-block"
            >
              {isForgotPassword
                ? "Enter your email address and we'll send you a link to reset your password."
                : `${activeTab === "login" ? "Sign in" : "Sign up"} to start evaluating GitHub repositories`}
            </motion.span>
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-6 pt-2 sm:pt-4">
          {isForgotPassword ? (
            /* FORGOT PASSWORD VIEW */
            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.form
                onSubmit={handleForgotPassword}
                className="space-y-4"
                variants={containerVariants}
              >
                <motion.div className="space-y-2" variants={itemVariants}>
                  <Label
                    htmlFor="forgot-email"
                    className="text-[#c9d1d9] text-sm"
                  >
                    Email address
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="bg-background border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full bg-[#1f6feb] hover:bg-[#388bfd] text-white border-0 mt-2 shadow-lg shadow-[#1f6feb]/20"
                  >
                    Send reset link
                  </Button>
                </motion.div>
              </motion.form>
              <motion.div variants={itemVariants}>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="inline-flex items-center text-xs sm:text-sm text-[#58a6ff] hover:underline"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Back to Sign In
                </button>
              </motion.div>
            </motion.div>
          ) : (
            /* TABS VIEW */
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-background p-1 h-auto rounded-lg mb-4">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-surface-2 data-[state=active]:text-white text-[#8b949e] rounded py-2 text-sm"
                >
                  Sign in
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-surface-2 data-[state=active]:text-white text-[#8b949e] rounded py-2 text-sm"
                >
                  Sign up
                </TabsTrigger>
              </TabsList>

              {/* LOGIN TAB */}
              <TabsContent value="login" className="mt-0">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  <motion.form
                    onSubmit={handleLogin}
                    className="space-y-4"
                    variants={containerVariants}
                  >
                    <motion.div className="space-y-2" variants={itemVariants}>
                      <Label
                        htmlFor="login-email"
                        className="text-[#c9d1d9] text-sm"
                      >
                        Email address
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        disabled={loginSubmitting}
                        className="bg-background border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                      />
                    </motion.div>
                    <motion.div className="space-y-2" variants={itemVariants}>
                      <div className="flex justify-between items-center">
                        <Label
                          htmlFor="login-password"
                          className="text-[#c9d1d9] text-sm"
                        >
                          Password
                        </Label>
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-xs text-[#58a6ff] hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={loginSubmitting}
                        className="bg-background border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Button
                        type="submit"
                        disabled={loginSubmitting}
                        className="w-full bg-[#1f6feb] hover:bg-[#388bfd] text-white border-0 pt-2 shadow-lg shadow-[#1f6feb]/20"
                      >
                        Sign in
                      </Button>
                    </motion.div>
                    {loginError ? (
                      <motion.p
                        variants={itemVariants}
                        className="text-xs text-red-400"
                      >
                        {loginError}
                      </motion.p>
                    ) : null}
                  </motion.form>

                  <motion.div variants={itemVariants}>
                    <SocialAuthButtons />
                  </motion.div>
                </motion.div>
              </TabsContent>

              {/* REGISTER TAB */}
              <TabsContent value="register" className="mt-0">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  <motion.form
                    onSubmit={handleRegister}
                    className="space-y-4"
                    variants={containerVariants}
                  >
                    <motion.div className="space-y-2" variants={itemVariants}>
                      <Label
                        htmlFor="register-username"
                        className="text-[#c9d1d9] text-sm"
                      >
                        Username
                      </Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="octocat"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        required
                        disabled={registerSubmitting}
                        className="bg-background border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                      />
                    </motion.div>
                    <motion.div className="space-y-2" variants={itemVariants}>
                      <Label
                        htmlFor="register-email"
                        className="text-[#c9d1d9] text-sm"
                      >
                        Email address
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        disabled={registerSubmitting}
                        className="bg-background border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                      />
                    </motion.div>
                    <motion.div className="space-y-2" variants={itemVariants}>
                      <Label
                        htmlFor="register-password"
                        className="text-[#c9d1d9] text-sm"
                      >
                        Password
                      </Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        disabled={registerSubmitting}
                        className="bg-background border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Button
                        type="submit"
                        disabled={registerSubmitting}
                        className="w-full bg-[#1f6feb] hover:bg-[#388bfd] text-white border-0 mt-2 shadow-lg shadow-[#1f6feb]/20"
                      >
                        Create account
                      </Button>
                    </motion.div>
                    {registerError ? (
                      <motion.p
                        variants={itemVariants}
                        className="text-xs text-red-400"
                      >
                        {registerError}
                      </motion.p>
                    ) : null}
                    <motion.p
                      className="text-[10px] sm:text-xs text-center text-[#8b949e] mt-2"
                      variants={itemVariants}
                    >
                      By creating an account, you agree to our{" "}
                      <a
                        href="#terms"
                        className="text-[#58a6ff] hover:underline"
                      >
                        Terms
                      </a>{" "}
                      and{" "}
                      <a
                        href="#privacy"
                        className="text-[#58a6ff] hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </motion.p>
                  </motion.form>

                  <motion.div variants={itemVariants}>
                    <SocialAuthButtons />
                  </motion.div>
                </motion.div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
