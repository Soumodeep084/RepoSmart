import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function Footer() {
  return (
    <footer className="bg-[#161b22] text-[#8b949e] pt-12 sm:pt-16 pb-8 border-t border-[#30363d]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 sm:gap-12 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <ImageWithFallback
                src="/images/heroLogo.png"
                alt="RepoSmart Logo"
                width={40}
                height={40}
              />
              <span className="font-bold text-xl text-white">RepoSmart</span>
            </div>
            <p className="text-sm sm:text-base text-[#8b949e] mb-6 max-w-sm leading-relaxed">
              Making GitHub repositories safer and more reliable for everyone.
              Evaluate repositories with confidence using our comprehensive
              analysis tools.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#github"
                className="w-10 h-10 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center hover:border-[#58a6ff] hover:bg-[#0d1117] transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#twitter"
                className="w-10 h-10 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center hover:border-[#58a6ff] hover:bg-[#0d1117] transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#linkedin"
                className="w-10 h-10 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center hover:border-[#58a6ff] hover:bg-[#0d1117] transition-all"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#email"
                className="w-10 h-10 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center hover:border-[#58a6ff] hover:bg-[#0d1117] transition-all"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#features"
                  className="hover:text-[#58a6ff] transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-[#58a6ff] transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-[#58a6ff] transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#api"
                  className="hover:text-[#58a6ff] transition-colors"
                >
                  API
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#docs"
                  className="hover:text-[#58a6ff] transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#blog"
                  className="hover:text-[#58a6ff] transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#guides"
                  className="hover:text-[#58a6ff] transition-colors"
                >
                  Guides
                </a>
              </li>
              <li>
                <a
                  href="#support"
                  className="hover:text-[#58a6ff] transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#about"
                  className="hover:text-[#58a6ff] transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#team"
                  className="hover:text-[#58a6ff] transition-colors"
                >
                  Team
                </a>
              </li>
              <li>
                <a
                  href="#careers"
                  className="hover:text-[#58a6ff] transition-colors"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="hover:text-[#58a6ff] transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar - Enabled flex-wrap for mobile */}
        <div className="pt-8 border-t border-[#30363d] flex flex-col md:flex-row justify-between items-center gap-4 text-xs sm:text-sm">
          <p className="text-center md:text-left">
            © 2026 RepoSmart. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <a
              href="#privacy"
              className="hover:text-[#58a6ff] transition-colors"
            >
              Privacy
            </a>
            <a href="#terms" className="hover:text-[#58a6ff] transition-colors">
              Terms
            </a>
            <a
              href="#security"
              className="hover:text-[#58a6ff] transition-colors"
            >
              Security
            </a>
            <a
              href="#cookies"
              className="hover:text-[#58a6ff] transition-colors"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
