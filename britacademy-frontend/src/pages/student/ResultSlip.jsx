import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Download, ArrowLeft, MapPin, Globe, Mail, Phone } from 'lucide-react';

const ResultSlip = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { resultData, formData } = location.state || {};

  if (!resultData) {
    return <Navigate to="/check-result" replace />;
  }

  const handleDownloadPDF = () => {
    const url = `/api/student/download-pdf?student_id=${formData.student_id}&exam_type_id=${formData.exam_type_id}&academic_year_id=${formData.academic_year_id}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f7f5f1] py-10 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
      `}</style>

      <div className="w-full max-w-4xl">

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <button
            onClick={() => navigate('/check-result')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0f172a] font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Check another result
          </button>
          <button
            onClick={handleDownloadPDF}
            className="bg-[#eab308] hover:bg-yellow-500 text-[#0f172a] font-semibold text-sm py-2.5 px-6 rounded-md shadow-sm transition-colors flex items-center gap-2"
          >
            <Download size={16} /> Download official PDF
          </button>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">

          <div className="bg-[#fdf6e3] flex flex-col md:flex-row items-center justify-between p-6 border-b-[6px] border-[#0f172a]">
            <div className="flex items-center gap-4">
              <img src="https://pub-8e6b93e949904a4483a44991b1520604.r2.dev/public/britannia-logo.png" alt="Logo" className="h-16 w-16 object-contain" />
              <div>
                <h1 className="font-display text-xl md:text-2xl font-semibold text-[#0f172a] uppercase tracking-wide">
                  Britannia International Academy
                </h1>
                <p className="text-sm font-semibold text-[#c2410c] tracking-widest uppercase mt-1">Official Result Statement</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10">

            <div className="mb-8 rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-[#0f172a] text-white font-semibold p-2.5 text-sm tracking-widest uppercase">
                Candidate's Details
              </div>
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-3/4 p-0">
                  <table className="w-full text-sm text-left">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <th className="p-3 font-semibold w-2/5 bg-slate-50 border-r border-slate-200 uppercase text-xs text-slate-500">Student ID Number</th>
                        <td className="p-3 font-bold text-lg text-[#0f172a]">{resultData.candidate.student_id}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <th className="p-3 font-semibold w-2/5 bg-slate-50 border-r border-slate-200 uppercase text-xs text-slate-500">Candidate Name</th>
                        <td className="p-3 uppercase font-bold text-[#0f172a] tracking-wide">{resultData.candidate.name}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <th className="p-3 font-semibold w-2/5 bg-slate-50 border-r border-slate-200 uppercase text-xs text-slate-500">Type of Examination</th>
                        <td className="p-3 uppercase font-semibold text-slate-800">{resultData.candidate.exam_type}</td>
                      </tr>
                      <tr>
                        <th className="p-3 font-semibold w-2/5 bg-slate-50 border-r border-slate-200 uppercase text-xs text-slate-500">Examination Year</th>
                        <td className="p-3 uppercase font-semibold text-slate-800">{resultData.candidate.academic_year}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="w-full md:w-1/4 flex items-center justify-center p-6 border-t md:border-t-0 md:border-l border-slate-200">
                  <img
                    src={
                      resultData.candidate.photo_url
                        ? resultData.candidate.photo_url
                        : (resultData.candidate.gender?.toLowerCase() === 'female'
                            ? "/female-shadow.png"
                            : "/male-shadow.png")
                    }
                    alt="Student"
                    className="h-28 w-28 rounded-md object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-[#0f172a] text-white font-semibold p-2.5 text-sm tracking-widest uppercase">
                Statement of Results
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap min-w-[500px]">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-bold text-slate-700 border-r border-slate-200 w-2/5 uppercase text-xs tracking-wider">Subject</th>
                      <th className="p-3 font-bold text-slate-700 text-center border-r border-slate-200 w-1/5 uppercase text-xs tracking-wider">Grade</th>
                      <th className="p-3 font-bold text-slate-700 text-center border-r border-slate-200 w-1/5 uppercase text-xs tracking-wider">Mark</th>
                      <th className="p-3 font-bold text-slate-700 text-center w-1/5 uppercase text-xs tracking-wider">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultData.results.map((item, index) => (
                      <tr key={index} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-800 border-r border-slate-200 tracking-wide">{item.subject.toUpperCase()}</td>
                        <td className="p-3 text-center font-bold text-[#c2410c] text-base border-r border-slate-200">{item.grade}</td>
                        <td className="p-3 text-center font-semibold text-slate-800 border-r border-slate-200">{item.mark}</td>
                        <td className="p-3 text-center text-slate-500 font-semibold uppercase text-xs">{item.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200 flex justify-end">
              <div className="text-center">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase mb-2">
                  Approved by
                </p>
                <img
                  src="https://pub-8e6b93e949904a4483a44991b1520604.r2.dev/public/britania-logo-crest.png"
                  alt="Authorized signature and academy seal"
                  className="h-16 object-contain mx-auto"
                />
              </div>
            </div>

          </div>

          <div className="bg-slate-50 border-t border-slate-200 px-6 md:px-10 py-5">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-[#c2410c] shrink-0" />
                Bartle House, Oxford Court, Manchester, England
              </span>
              <span className="flex items-center gap-1.5">
                <Globe size={13} className="text-[#c2410c] shrink-0" />
                <a href="https://www.britacademy.uk" target="_blank" rel="noopener noreferrer" className="hover:text-[#0f172a] transition-colors">
                  www.britacademy.uk
                </a>
              </span>
              <span className="flex items-center gap-1.5">
                <Mail size={13} className="text-[#c2410c] shrink-0" />
                <a href="mailto:admissions@britacademy.uk" className="hover:text-[#0f172a] transition-colors">
                  admissions@britacademy.uk
                </a>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone size={13} className="text-[#c2410c] shrink-0" />
                <a href="tel:+447448889731" className="hover:text-[#0f172a] transition-colors">
                  +44 7448 889731
                </a>
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResultSlip;