import { Phone, Clock, UserPlus, Zap, Star } from "lucide-react";

export default function AIReceptionistSection() {
  return (
    <section id="ai-receptionist" className="relative py-28 md:py-36 overflow-hidden bg-[#0d3320]">
      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-green-400/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-5 py-2 mb-8">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-bold text-green-400 tracking-widest uppercase">
                AI-Powered — $9-14/mo Add-on
              </span>
            </div>

            <h2 className="font-bold text-5xl md:text-6xl tracking-tight text-white leading-[0.9] mb-6">
              Your Office<br />
              Never<br />
              <span className="text-green-400">Closes.</span>
            </h2>

            <p className="text-xl text-white/50 leading-relaxed mb-10 max-w-lg">
              The AI Voice Receptionist answers every call, books appointments, and captures lead info — even at 2 AM.
              It sounds natural, works 24/7, and pays for itself with the first job it books.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-10">
              {[
                { icon: Phone, label: "Answers every call" },
                { icon: Clock, label: "24/7 availability" },
                { icon: UserPlus, label: "Books appointments" },
                { icon: Star, label: "Natural conversation" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3.5 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-white/70">{label}</span>
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-4 bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-4">
              <div>
                <p className="text-green-400 font-bold text-3xl">$9–14</p>
                <p className="text-white/30 text-xs">per month add-on</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <p className="text-white/50 text-sm leading-snug max-w-[180px]">
                Typically pays for itself with the first call it catches.
              </p>
            </div>
          </div>

          {/* Right — call simulation */}
          <div className="hidden lg:block">
            <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 max-w-sm mx-auto">
              {/* Incoming call header */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0d3320] animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Incoming Call</p>
                  <p className="text-white/40 text-sm">+1 (512) 843-2291</p>
                </div>
                <div className="ml-auto">
                  <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full font-bold uppercase">Live</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]">
                  <p className="text-white/70 text-sm">&ldquo;Hi, I&apos;d like a quote for weekly mowing. About half an acre.&rdquo;</p>
                </div>
                <div className="bg-green-500/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[90%] ml-auto">
                  <p className="text-green-300 text-sm">&ldquo;Absolutely! I can book you for a free estimate this Thursday. What&apos;s your address?&rdquo;</p>
                </div>
                <div className="bg-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]">
                  <p className="text-white/70 text-sm">&ldquo;142 Maple Drive.&rdquo;</p>
                </div>
                <div className="bg-green-500/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[90%] ml-auto">
                  <p className="text-green-300 text-sm">&ldquo;Perfect! You&apos;re all set for Thursday at 10 AM. We&apos;ll send a confirmation text shortly!&rdquo;</p>
                </div>
              </div>

              {/* Waveform */}
              <div className="flex items-center justify-center gap-1">
                {[2, 4, 7, 11, 9, 14, 9, 11, 7, 4, 2, 5, 8, 5, 2].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-green-400/60 animate-pulse"
                    style={{ height: `${h * 2}px`, animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
