"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "../ui/button";
import { clearAuth, getAuthToken, subscribeAuth } from "../../lib/auth";

interface HeaderProps {
  onLogin?: () => void;
  onRegister?: () => void;
}

export function Header({ onLogin, onRegister }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSyncExternalStore(subscribeAuth, getAuthToken, () => null);

  const shouldReduceMotion = useReducedMotion();
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const isAuthed = Boolean(token);
  const isHomePage = pathname === "/";
  const isHumanAnalyzePage = pathname === "/analyze";
  const isAiAnalyzePage = pathname === "/ai-analyze";

  const navLinkClass = (isActive: boolean) =>
    `transition-colors text-sm font-medium ${
      isActive ? "text-[#58a6ff]" : "text-[#c9d1d9] hover:text-[#58a6ff]"
    }`;

  const handleSignOut = () => {
    clearAuth();
    router.push("/");
  };

  const motionProps = shouldReduceMotion
    ? ({
        initial: false,
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0 },
      } as const)
    : ({
        initial: { opacity: 0, y: -12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease },
      } as const);

  return (
    <motion.header
      {...motionProps}
      className="sticky top-0 z-50 w-full border-b border-[#30363d] bg-background/95 backdrop-blur-md"
    >
      {/* Adjusted padding for mobile */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center">
                <Link href="/" aria-label="RepoSmart home">
                  <Image
                    src="/images/Hero_Image.png"
                    alt={"RepoSmart Logo"}
                    width={40}
                    height={20}
                    className="w-full h-full object-contain"
                  />
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                href="/"
                className="rs-text-glow font-bold text-lg sm:text-xl text-white"
              >
                RepoSmart
              </Link>
              <span className="ml-2 text-[10px] sm:text-xs text-[#8b949e] border border-[#30363d] px-2 py-0.5 rounded-full hidden xs:inline-block">
                Beta
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {isAuthed ? (
              <>
                <Link
                  href="/"
                  className={navLinkClass(isHomePage)}
                  aria-current={isHomePage ? "page" : undefined}
                >
                  Home
                </Link>
                <Link
                  href="/analyze"
                  className={navLinkClass(isHumanAnalyzePage)}
                  aria-current={isHumanAnalyzePage ? "page" : undefined}
                >
                  Human Analyzer
                </Link>
                <Link
                  href="/ai-analyze"
                  className={navLinkClass(isAiAnalyzePage)}
                  aria-current={isAiAnalyzePage ? "page" : undefined}
                >
                  AI Analyzer
                </Link>
              </>
            ) : (
              <>
                <a
                  href="#features"
                  className="text-[#c9d1d9] hover:text-[#58a6ff] transition-colors text-sm font-medium"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-[#c9d1d9] hover:text-[#58a6ff] transition-colors text-sm font-medium"
                >
                  How it Works
                </a>
              </>
            )}
          </nav>

          {/* Auth Buttons - adjusted gap and padding for mobile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthed ? (
              <>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="text-[#c9d1d9] hover:text-white hover:bg-surface-2 border-0 px-2 sm:px-4 text-sm"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={onLogin}
                  className="text-[#c9d1d9] hover:text-white hover:bg-surface-2 border-0 px-2 sm:px-4 text-sm"
                >
                  Sign in
                </Button>
                <Button
                  onClick={onRegister}
                  className="bg-[#1f6feb] hover:bg-[#388bfd] text-white border-0 shadow-lg shadow-[#1f6feb]/20 px-3 sm:px-4 text-sm"
                >
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
