import { useState, useEffect } from 'react';
import { Search, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const ResultChecker = () => {
  const [formData, setFormData] = useState({ student_id: '', exam_type_id: '', academic_year_id: '' });
  const [examTypes, setExamTypes] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSetupData = async () => {
      try {
        const [examsRes, yearsRes] = await Promise.all([
          api.get('/admin/setup/exams'),
          api.get('/admin/setup/years')
        ]);
        setExamTypes(examsRes.data);
        setAcademicYears(yearsRes.data);
      } catch (err) {
        console.error("Failed to load setup data", err);
      }
    };
    fetchSetupData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckResult = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/student/check-result', { params: formData });
      navigate('/result-slip', { state: { resultData: response.data, formData } });
    } catch (err) {
      console.error("Result fetch error:", err);
      setError(err.response?.data?.msg || 'An error occurred while fetching results.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f1] py-10 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
      `}</style>

      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#0f172a] transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back to portal
        </Link>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
          <div className="bg-[#0f172a] p-7 text-center border-b-4 border-[#eab308]">
            <img
              src="https://pub-8e6b93e949904a4483a44991b1520604.r2.dev/public/britannia-logo.png"
              alt="Britannia International Academy crest"
              className="h-16 w-16 mx-auto bg-white rounded-full p-1 object-contain shadow-sm mb-4"
            />
            <h1 className="font-display text-2xl font-semibold text-white">
              Result Checker
            </h1>
            <p className="text-[#eab308] text-[11px] font-semibold mt-1.5 tracking-[0.2em] uppercase">
              Britannia International Academy
            </p>
          </div>

          <div className="p-7 sm:p-8">
            <p className="text-[11px] font-semibold tracking-[0.15em] text-[#c2410c] uppercase mb-6">
              Enter examination details
            </p>

            <form onSubmit={handleCheckResult} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Student ID number</label>
                <input
                  type="text"
                  name="student_id"
                  required
                  value={formData.student_id}
                  className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] text-sm transition-all"
                  placeholder="e.g. BIA-2026-001"
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Examination type</label>
                <select
                  name="exam_type_id"
                  required
                  value={formData.exam_type_id}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] bg-white text-sm transition-all cursor-pointer"
                >
                  <option value="">Select exam type</option>
                  {examTypes.map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Examination year</label>
                <select
                  name="academic_year_id"
                  required
                  value={formData.academic_year_id}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] bg-white text-sm transition-all cursor-pointer"
                >
                  <option value="">Select year</option>
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>{year.year_string}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border-l-4 border-red-500 rounded-md flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0f172a] hover:bg-[#c2410c] text-white font-semibold text-sm py-3.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <><Search size={16} /> Check result</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultChecker;