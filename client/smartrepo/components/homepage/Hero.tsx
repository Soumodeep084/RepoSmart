"use client";
import { Github, ArrowRight, CheckCircle2, Star, GitFork } from "lucide-react";
import { Button } from "../ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useEffect, useState } from "react";

interface HeroProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function Hero({ onLogin, onRegister }: HeroProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#0d1117] pt-20 pb-32 sm:px-14">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #1f6feb 1px, transparent 1px),
              linear-gradient(to bottom, #1f6feb 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1f6feb] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#58a6ff] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-[#388bfd] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />

      {/* Adjusted padding for mobile: px-4 instead of px-6 */}
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161b22] border border-[#30363d] text-sm">
              <Github className="w-4 h-4 text-[#58a6ff]" />
              <span className="text-[#c9d1d9]">Powered by GitHub API</span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              {/* Made text responsive: text-4xl on mobile, text-5xl on sm, text-6xl on lg */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight wrap-break-word">
                Evaluate GitHub
                <br />
                <span className="bg-linear-to-r from-[#58a6ff] to-[#79c0ff] bg-clip-text text-transparent">
                  Repositories Smartly
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-[#8b949e] leading-relaxed max-w-xl">
                Comprehensive license verification, quality scoring, and
                security analysis for GitHub repositories. Make informed
                decisions with confidence.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={onRegister}
                className="bg-[#238636] hover:bg-[#2ea043] text-white border-0 shadow-lg shadow-[#238636]/30 group w-full sm:w-auto"
              >
                Get started for free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onLogin}
                className="border-[#30363d] bg-[#21262d] text-white hover:bg-[#30363d] hover:border-[#58a6ff] w-full sm:w-auto"
              >
                View demo
              </Button>
            </div>

            {/* Stats */}
            {/* Adjusted to wrap nicely on very small screens */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 border-t border-[#21262d]">
              <div>
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-sm text-[#8b949e]">Repos analyzed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">98%</div>
                <div className="text-sm text-[#8b949e]">Accuracy</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-2xl font-bold text-white">5K+</div>
                <div className="text-sm text-[#8b949e]">Active users</div>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          {/* Removed parallax on mobile by using sm: modifier or just keeping it subtle */}
          <div
            className="relative mt-8 lg:mt-0"
            style={{ transform: `translateY(${scrollY * -0.05}px)` }}
          >
            
            <div className="relative rounded-lg overflow-hidden border border-[#30363d] shadow-2xl">
              <ImageWithFallback
                src="/images/hero.png"
                alt="GitHub coding"
                className="w-full h-auto"
                width={1400}
                height={1400}
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#0d1117] via-transparent to-transparent" />
            </div>

            {/* Floating Cards - Adjusted positions for mobile to prevent clipping */}
            <div className="absolute left-0 sm:-left-6 top-1/4 bg-[#161b22] border border-[#30363d] rounded-lg p-3 sm:p-4 shadow-xl backdrop-blur-xl animate-float scale-90 sm:scale-100 origin-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#238636]/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#3fb950]" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white">
                    License Verified
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#8b949e]">
                    MIT License
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute right-0 sm:-right-6 top-1/3 bg-[#161b22] border border-[#30363d] rounded-lg p-3 sm:p-4 shadow-xl backdrop-blur-xl animate-float animation-delay-2000 scale-90 sm:scale-100 origin-right">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#58a6ff] to-[#79c0ff] bg-clip-text text-transparent">
                  95
                </div>
                <div className="text-[10px] sm:text-xs text-[#8b949e] mt-1">
                  Quality Score
                </div>
              </div>
            </div>

            <div className="absolute left-1/4 -bottom-4 sm:-bottom-6 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 shadow-xl backdrop-blur-xl animate-float animation-delay-4000 scale-90 sm:scale-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[#f0883e] fill-[#f0883e]" />
                <span className="text-xs sm:text-sm font-semibold text-white">
                  12.5k
                </span>
                <GitFork className="w-3 h-3 sm:w-4 sm:h-4 text-[#8b949e]" />
                <span className="text-xs sm:text-sm text-[#8b949e]">2.1k</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}
