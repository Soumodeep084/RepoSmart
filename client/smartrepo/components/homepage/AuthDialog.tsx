"use client";
import { useEffect, useState } from "react";
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
import { ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { postJson } from "../../lib/api";
import { setAuth } from "../../lib/auth";
import { SocialAuthButtons } from "@/helpers/auth/iconsData";

type AuthApiResponse = {
  id: string;
  username: string;
  email: string;
  token: string;
};


interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
  onAuthenticated?: () => void;
}

export function AuthDialog({
  open,
  onOpenChange,
  defaultTab = "login",
  onAuthenticated,
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
      setAuth(payload);
      onAuthenticated?.();
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
      setAuth(payload);
      onAuthenticated?.();
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
