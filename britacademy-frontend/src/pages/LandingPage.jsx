import { ArrowRight, GraduationCap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#f7f5f1] flex flex-col font-sans selection:bg-[#c2410c] selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
      `}</style>

      {/* Top Header */}
      <header className="bg-[#0f172a] text-white border-b-4 border-[#eab308]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://pub-8e6b93e949904a4483a44991b1520604.r2.dev/public/britannia-logo.png"
              alt="Britannia International Academy crest"
              className="h-11 w-11 bg-white rounded-full p-1 object-contain shadow-sm"
            />
            <div className="leading-tight">
              <p className="text-base md:text-lg font-semibold tracking-wide uppercase">
                Britannia <span className="hidden sm:inline">International Academy</span>
              </p>
              <p className="text-[11px] tracking-[0.2em] text-[#eab308] uppercase hidden sm:block">
                Excellence in Education
              </p>
            </div>
          </div>
          <p className="text-xs font-medium text-slate-300 hidden md:block">
            Result Management Portal
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Welcome Text Section */}
          <div className="text-center md:text-left">
            <h2 className="font-display text-4xl md:text-[3.2rem] leading-[1.1] font-semibold text-[#0f172a]">
              Official result management, done properly.
            </h2>
            <div className="w-16 h-[3px] bg-[#c2410c] mt-6 mb-6 mx-auto md:mx-0" />
            <p className="text-base md:text-lg text-slate-600 max-w-md mx-auto md:mx-0 leading-relaxed">
              The centralised academic portal for Britannia International Academy.
              Look up a provisional result, or sign in to manage academic records.
            </p>
          </div>

          {/* Action Cards */}
          <div className="flex flex-col gap-5 w-full max-w-md mx-auto">

            {/* Student Portal Card */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
              <div className="h-[3px] bg-[#c2410c]" />
              <div className="p-6 sm:p-7">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full border-2 border-[#c2410c] flex items-center justify-center text-[#c2410c] shrink-0">
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.15em] text-[#c2410c] uppercase mb-0.5">
                      For Students
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">Check your result</h3>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Students and parents can view an official result statement using
                  the assigned Student ID and examination details.
                </p>
                <Link
                  to="/check-result"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-[#c2410c] text-white font-semibold text-sm py-3 px-4 rounded-md transition-colors"
                >
                  Access result checker <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Staff Portal Card */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
              <div className="h-[3px] bg-[#0f172a]" />
              <div className="p-6 sm:p-7">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full border-2 border-[#0f172a] flex items-center justify-center text-[#0f172a] shrink-0">
                    <Users size={22} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.15em] text-[#0f172a] uppercase mb-0.5">
                      For Staff
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">Manage records</h3>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Secure sign-in for tutors and administrators to input grades,
                  manage classes, and publish examination results.
                </p>
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#0f172a] border border-slate-300 hover:border-[#0f172a] font-semibold text-sm py-3 px-4 rounded-md transition-colors"
                >
                  Secure staff login <ArrowRight size={16} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Britannia International Academy. All rights reserved.</p>
          <p className="mt-1 text-xs">
            Powered by{' '}
            <a
              href="https://samuel-peprah-cmd.github.io/quicktools/quicktools.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-500 hover:text-[#c2410c] underline underline-offset-2 transition-colors"
            >
              AtomDev Studios
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;