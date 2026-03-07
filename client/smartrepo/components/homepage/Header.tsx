import { Button } from "../ui/button";
import Image from "next/image";

interface HeaderProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function Header({ onLogin, onRegister }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#30363d] bg-[#0d1117]/95 backdrop-blur-md">
      {/* Adjusted padding for mobile */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center">
                <Image
                  src={"/images/heroLogo.png"}
                  alt={"RepoSmart Logo"}
                  width={40}
                  height={20}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg sm:text-xl text-white">
                RepoSmart
              </span>
              <span className="ml-2 text-[10px] sm:text-xs text-[#8b949e] border border-[#30363d] px-2 py-0.5 rounded-full hidden xs:inline-block">
                Beta
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
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
          </nav>

          {/* Auth Buttons - adjusted gap and padding for mobile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={onLogin}
              className="text-[#c9d1d9] hover:text-white hover:bg-[#21262d] border-0 px-2 sm:px-4 text-sm"
            >
              Sign in
            </Button>
            <Button
              onClick={onRegister}
              className="bg-[#238636] hover:bg-[#2ea043] text-white border-0 shadow-lg shadow-[#238636]/20 px-3 sm:px-4 text-sm"
            >
              Sign up
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
