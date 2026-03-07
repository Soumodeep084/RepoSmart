"use client";
import { useState } from "react";
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
        <span className="px-2 bg-[#161b22] text-[#8b949e]">
          Or continue with
        </span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        type="button"
        className="w-full border-[#30363d] bg-[#21262d] text-white hover:bg-[#30363d] hover:border-[#58a6ff]"
      >
        <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Google
      </Button>
      <Button
        variant="outline"
        type="button"
        className="w-full border-[#30363d] bg-[#21262d] text-white hover:bg-[#30363d] hover:border-[#58a6ff]"
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

  // Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login:", { email: loginEmail, password: loginPassword });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register:", {
      name: registerName,
      email: registerEmail,
      password: registerPassword,
    });
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Forgot Password for:", forgotEmail);
    // Add toast notification here later!
  };

  // Reset internal view state when dialog closes so it opens fresh next time
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Small delay prevents UI jarring while the dialog animates out
      setTimeout(() => setIsForgotPassword(false), 200);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md bg-[#161b22] border border-[#30363d] text-white p-0 rounded-xl overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <div className="flex items-center gap-3 mb-2 sm:mb-3">
            <ImageWithFallback
              src="/images/heroLogo.png"
              alt="RepoSmart Logo"
              width={40}
              height={40}
            />
            <DialogTitle className="text-white text-lg sm:text-xl">
              {isForgotPassword ? "Reset Password" : "Welcome to RepoSmart"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-[#8b949e] text-left">
            {isForgotPassword
              ? "Enter your email address and we'll send you a link to reset your password."
              : `${activeTab === "login" ? "Sign in" : "Sign up"} to start evaluating GitHub repositories`}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-6 pt-2 sm:pt-4">
          {isForgotPassword ? (
            /* FORGOT PASSWORD VIEW */
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
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
                    className="bg-[#0d1117] border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#238636] hover:bg-[#2ea043] text-white border-0 mt-2"
                >
                  Send reset link
                </Button>
              </form>
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="inline-flex items-center text-xs sm:text-sm text-[#58a6ff] hover:underline"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            /* TABS VIEW */
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-[#0d1117] p-1 h-auto rounded-lg mb-4">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-[#21262d] data-[state=active]:text-white text-[#8b949e] rounded py-2 text-sm"
                >
                  Sign in
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-[#21262d] data-[state=active]:text-white text-[#8b949e] rounded py-2 text-sm"
                >
                  Sign up
                </TabsTrigger>
              </TabsList>

              {/* LOGIN TAB */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
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
                      className="bg-[#0d1117] border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                    />
                  </div>
                  <div className="space-y-2">
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
                      className="bg-[#0d1117] border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#238636] hover:bg-[#2ea043] text-white border-0 pt-2"
                  >
                    Sign in
                  </Button>
                </form>

                <SocialAuthButtons />
              </TabsContent>

              {/* REGISTER TAB */}
              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="register-name"
                      className="text-[#c9d1d9] text-sm"
                    >
                      Full name
                    </Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                      className="bg-[#0d1117] border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                    />
                  </div>
                  <div className="space-y-2">
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
                      className="bg-[#0d1117] border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                    />
                  </div>
                  <div className="space-y-2">
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
                      className="bg-[#0d1117] border-[#30363d] text-white placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#238636] hover:bg-[#2ea043] text-white border-0 mt-2"
                  >
                    Create account
                  </Button>
                  <p className="text-[10px] sm:text-xs text-center text-[#8b949e] mt-2">
                    By creating an account, you agree to our{" "}
                    <a href="#terms" className="text-[#58a6ff] hover:underline">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a
                      href="#privacy"
                      className="text-[#58a6ff] hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </p>
                </form>

                <SocialAuthButtons />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
