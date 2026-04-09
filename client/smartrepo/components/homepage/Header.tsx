"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, isAuthed]);

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

  const mobileMenuTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const };

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
                  className="hidden md:inline-flex text-[#c9d1d9] hover:text-white hover:bg-surface-2 border-0 px-2 sm:px-4 text-sm"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={onLogin}
                  className="hidden md:inline-flex text-[#c9d1d9] hover:text-white hover:bg-surface-2 border-0 px-2 sm:px-4 text-sm"
                >
                  Sign in
                </Button>
                <Button
                  onClick={onRegister}
                  className="hidden md:inline-flex bg-[#1f6feb] hover:bg-[#388bfd] text-white border-0 shadow-lg shadow-[#1f6feb]/20 px-3 sm:px-4 text-sm"
                >
                  Sign up
                </Button>
              </>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden text-[#c9d1d9] hover:text-white hover:bg-surface-2 border border-[#30363d] px-2"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMobileMenuOpen ? (
                  <motion.span
                    key="menu-close"
                    initial={shouldReduceMotion ? false : { opacity: 0, rotate: -90, scale: 0.85 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, rotate: 90, scale: 0.85 }}
                    transition={mobileMenuTransition}
                    className="inline-flex"
                  >
                    <X className="h-5 w-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu-open"
                    initial={shouldReduceMotion ? false : { opacity: 0, rotate: 90, scale: 0.85 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, rotate: -90, scale: 0.85 }}
                    transition={mobileMenuTransition}
                    className="inline-flex"
                  >
                    <Menu className="h-5 w-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isMobileMenuOpen ? (
            <motion.nav
              id="mobile-navigation"
              className="md:hidden overflow-hidden"
              initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={mobileMenuTransition}
            >
              <motion.div
                className="pb-3"
                initial={shouldReduceMotion ? false : { y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={shouldReduceMotion ? undefined : { y: -6, opacity: 0 }}
                transition={mobileMenuTransition}
              >
                {isAuthed ? (
                  <div className="grid grid-cols-1 gap-2">
                <Link
                  href="/"
                  className={
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
                    (isHomePage
                      ? "border-[#1f6feb] text-[#58a6ff] bg-[#1f6feb]/10"
                      : "border-[#30363d] text-[#c9d1d9] hover:text-[#58a6ff] hover:bg-surface-2")
                  }
                  aria-current={isHomePage ? "page" : undefined}
                >
                  Home
                </Link>

                <Link
                  href="/analyze"
                  className={
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
                    (isHumanAnalyzePage
                      ? "border-[#1f6feb] text-[#58a6ff] bg-[#1f6feb]/10"
                      : "border-[#30363d] text-[#c9d1d9] hover:text-[#58a6ff] hover:bg-surface-2")
                  }
                  aria-current={isHumanAnalyzePage ? "page" : undefined}
                >
                  Human Analyzer
                </Link>

                <Link
                  href="/ai-analyze"
                  className={
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
                    (isAiAnalyzePage
                      ? "border-[#1f6feb] text-[#58a6ff] bg-[#1f6feb]/10"
                      : "border-[#30363d] text-[#c9d1d9] hover:text-[#58a6ff] hover:bg-surface-2")
                  }
                  aria-current={isAiAnalyzePage ? "page" : undefined}
                >
                  AI Analyzer
                </Link>

                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="justify-start border border-[#30363d] text-[#c9d1d9] hover:text-white hover:bg-surface-2"
                >
                  Sign out
                </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                <a
                  href="#features"
                  className="rounded-md border border-[#30363d] px-3 py-2 text-sm font-medium text-[#c9d1d9] transition-colors hover:text-[#58a6ff] hover:bg-surface-2"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="rounded-md border border-[#30363d] px-3 py-2 text-sm font-medium text-[#c9d1d9] transition-colors hover:text-[#58a6ff] hover:bg-surface-2"
                >
                  How it Works
                </a>
                <Button
                  variant="ghost"
                  onClick={onLogin}
                  className="justify-start border border-[#30363d] text-[#c9d1d9] hover:text-white hover:bg-surface-2"
                >
                  Sign in
                </Button>
                <Button
                  onClick={onRegister}
                  className="justify-start bg-[#1f6feb] hover:bg-[#388bfd] text-white border-0"
                >
                  Sign up
                </Button>
                  </div>
                )}
              </motion.div>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
