"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ReCAPTCHA from "react-google-recaptcha";
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
  const [loginCaptchaToken, setLoginCaptchaToken] = useState<string | null>(
    null,
  );
  const [registerCaptchaToken, setRegisterCaptchaToken] = useState<
    string | null
  >(null);

  const loginCaptchaRef = useRef<ReCAPTCHA | null>(null);
  const registerCaptchaRef = useRef<ReCAPTCHA | null>(null);
  const recaptchaSiteKey =
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ?? "";

  const handleLoginCaptchaChange = (token: string | null) => {
    setLoginCaptchaToken(token);
    if (token) {
      setLoginError(null);
    }
  };

  const handleRegisterCaptchaChange = (token: string | null) => {
    setRegisterCaptchaToken(token);
    if (token) {
      setRegisterError(null);
    }
  };

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

    if (!recaptchaSiteKey) {
      setLoginError("CAPTCHA is not configured. Please contact support.");
      return;
    }

    if (!loginCaptchaToken) {
      setLoginError("Please complete CAPTCHA before signing in.");
      return;
    }

    setLoginSubmitting(true);

    try {
      const payload = await postJson<AuthApiResponse>("/api/auth/login", {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
        captchaToken: loginCaptchaToken,
      });
      setAuth(payload);
      onAuthenticated?.();
      handleOpenChange(false);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Unable to sign in.");
      loginCaptchaRef.current?.reset();
      setLoginCaptchaToken(null);
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerSubmitting) return;

    setRegisterError(null);

    if (!recaptchaSiteKey) {
      setRegisterError("CAPTCHA is not configured. Please contact support.");
      return;
    }

    if (!registerCaptchaToken) {
      setRegisterError("Please complete CAPTCHA before signing up.");
      return;
    }

    setRegisterSubmitting(true);

    try {
      const payload = await postJson<AuthApiResponse>("/api/auth/register", {
        username: registerUsername.trim(),
        email: registerEmail.trim().toLowerCase(),
        password: registerPassword,
        captchaToken: registerCaptchaToken,
      });
      setAuth(payload);
      onAuthenticated?.();
      handleOpenChange(false);
    } catch (err) {
      setRegisterError(
        err instanceof Error ? err.message : "Unable to create account.",
      );
      registerCaptchaRef.current?.reset();
      setRegisterCaptchaToken(null);
    } finally {
      setRegisterSubmitting(false);
    }
  };

  // Forgot Password Step :
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      await postJson("/api/auth/forgot-password", {
        email: forgotEmail,
      });

      setStep("otp");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.trim().length !== 6) {
      alert("OTP must be 6 digits");
      return;
    }
    setLoading(true);
    try {
      await postJson("/api/auth/verify-otp", {
        email: forgotEmail,
        otp,
      });

      setStep("reset");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Confirm Password do not match");
      return;
    }

    setLoading(true);
    try {
      await postJson("/api/auth/reset-password", {
        email: forgotEmail,
        otp,
        newPassword,
      });

      alert("Password Reset successfully");

      setIsForgotPassword(false);
      setStep("email");
      setForgotEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // Ensure the tab matches the button that opened the dialog
  useEffect(() => {
    if (!open) return;
    setActiveTab(defaultTab);
    setIsForgotPassword(false);
    setLoginError(null);
    setRegisterError(null);
    setLoginCaptchaToken(null);
    setRegisterCaptchaToken(null);
    loginCaptchaRef.current?.reset();
    registerCaptchaRef.current?.reset();
  }, [open, defaultTab]);

  // Forgot Password
  useEffect(() => {
    if (!open) {
      setStep("email");
      setOtp("");
      setNewPassword("");
      setForgotEmail("");
      setConfirmPassword("");
      setLoading(false);
    }
  }, [open]);

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
      setLoginCaptchaToken(null);
      setRegisterCaptchaToken(null);
      loginCaptchaRef.current?.reset();
      registerCaptchaRef.current?.reset();
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
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.22, ease }
                }
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
              transition={
                shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease }
              }
              className="inline-block"
            >
              {isForgotPassword
                ? step === "email"
                  ? "Enter your email address and we'll send you a code to your email to reset your password."
                  : step === "otp"
                    ? "Enter the 6-digit code sent to your email to verify your identity."
                    : "OTP verified! Please enter your new password below."
                : `${activeTab === "login" ? "Sign in" : "Sign up"} to start evaluating GitHub repositories`}
            </motion.span>
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-6 pt-2 sm:pt-4">
          {isForgotPassword ? (
            /* FORGOT PASSWORD VIEW */
            <motion.div className="space-y-4">
              {/* STEP 1 → EMAIL */}
              {step === "email" && (
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
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="bg-background border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#1f6feb] hover:bg-[#388bfd] text-white border-0 mt-2 shadow-lg shadow-[#1f6feb]/20"
                    >
                      {loading ? "Sending..." : "Send OTP"}
                    </Button>
                  </motion.div>
                </motion.form>
              )}

              {/* STEP 2 → OTP */}
              {step === "otp" && (
                <motion.form onSubmit={verifyOtp} className="space-y-4">
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label
                      htmlFor="otp-enter"
                      className="text-[#c9d1d9] text-sm"
                    >
                      Code sent to{" "}
                      <motion.span className="text-[#388bfd]">
                        {forgotEmail}
                      </motion.span>
                    </Label>
                    <Input
                      id="otp-enter"
                      placeholder="Enter OTP"
                      type="number"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      disabled={loading}
                      maxLength={6}
                      max={999999}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-background border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#1f6feb] hover:bg-[#388bfd] text-white border-0 mt-2 shadow-lg shadow-[#1f6feb]/20"
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </motion.div>
                </motion.form>
              )}

              {/* STEP 3 → RESET PASSWORD */}
              {step === "reset" && (
                <motion.form onSubmit={resetPassword} className="space-y-4">
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label
                      htmlFor="reset-new-password"
                      className="text-[#c9d1d9] text-sm"
                    >
                      New Password{" "}
                      <motion.span className="text-[#8b949e]">
                        (min 6 characters)
                      </motion.span>
                    </Label>
                    <Input
                      id="reset-new-password"
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-background border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                    />

                    <Label
                      htmlFor="confirm-password"
                      className="text-[#c9d1d9] text-sm  mt-5"
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-background border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#1f6feb] hover:bg-[#388bfd] text-white border-0 mt-2 shadow-lg shadow-[#1f6feb]/20"
                    >
                      {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </motion.div>
                </motion.form>
              )}

              {/* BACK BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setStep("email");
                }}
                className="inline-flex items-center text-xs sm:text-sm text-[#58a6ff] hover:underline"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back to Sign In
              </button>
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
                      <div className="mt-1">
                        {recaptchaSiteKey ? (
                          <ReCAPTCHA
                            ref={loginCaptchaRef}
                            sitekey={recaptchaSiteKey}
                            onChange={handleLoginCaptchaChange}
                            onExpired={() => setLoginCaptchaToken(null)}
                          />
                        ) : (
                          <p className="text-xs text-red-400">
                            CAPTCHA is currently unavailable.
                          </p>
                        )}
                      </div>
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
                      <div className="mt-1">
                        {recaptchaSiteKey ? (
                          <ReCAPTCHA
                            ref={registerCaptchaRef}
                            sitekey={recaptchaSiteKey}
                            onChange={handleRegisterCaptchaChange}
                            onExpired={() => setRegisterCaptchaToken(null)}
                          />
                        ) : (
                          <p className="text-xs text-red-400">
                            CAPTCHA is currently unavailable.
                          </p>
                        )}
                      </div>
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
