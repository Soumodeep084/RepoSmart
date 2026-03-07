import { Search, ScanLine, BarChart3, CheckSquare } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Enter Repository URL",
      description:
        "Simply paste the GitHub repository URL you want to evaluate.",
      step: "01",
    },
    {
      icon: ScanLine,
      title: "Automated Analysis",
      description:
        "Our system scans the repository for licenses, code quality, and security issues.",
      step: "02",
    },
    {
      icon: BarChart3,
      title: "Get Quality Score",
      description:
        "Receive a comprehensive score based on multiple quality and safety factors.",
      step: "03",
    },
    {
      icon: CheckSquare,
      title: "Make Informed Decision",
      description:
        "Use the insights to confidently choose safe and reliable repositories.",
      step: "04",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#161b22]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-[#8b949e] max-w-2xl mx-auto">
            Get comprehensive repository insights in four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-linear-to-r from-[#30363d] to-[#30363d]">
                  <div
                    className="absolute inset-0 bg-linear-to-r from-[#58a6ff] to-transparent animate-pulse"
                    style={{ width: "50%" }}
                  />
                </div>
              )}

              <div className="relative flex flex-col items-center text-center">
                {/* Icon Container */}
                <div className="relative mb-5 sm:mb-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0d1117] border-2 border-[#30363d] flex items-center justify-center group-hover:border-[#58a6ff] transition-all">
                    <step.icon className="w-8 h-8 sm:w-10 sm:h-10 text-[#58a6ff]" />
                  </div>

                  {/* Step Number */}
                  <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#58a6ff] text-white text-xs sm:text-sm font-bold flex items-center justify-center shadow-lg">
                    {step.step}
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base text-[#8b949e] leading-relaxed max-w-62.5 sm:max-w-none">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
