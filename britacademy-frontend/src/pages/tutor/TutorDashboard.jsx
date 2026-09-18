import { useState, useEffect } from 'react';
import { LogOut, BookOpen, Save, ChevronDown, PlusCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const CreatableCombobox = ({ value, onChange, items, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filtered = items.filter(item => item.name.toLowerCase().includes(value.toLowerCase()));

  return (
    <div className="relative w-full">
      <div className="flex border border-slate-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-[#0f172a]/20 focus-within:border-[#0f172a] shadow-sm transition-all">
        <input
          type="text" className="w-full p-2 outline-none rounded-l-md text-sm bg-transparent"
          placeholder={placeholder} value={value}
          onChange={e => { onChange(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        <div className="px-2 flex items-center bg-slate-50 border-l border-slate-300 rounded-r-md cursor-pointer hover:bg-slate-100" onClick={() => setIsOpen(!isOpen)}>
          <ChevronDown size={16} className="text-slate-500" />
        </div>
      </div>

      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filtered.length > 0 ? filtered.map(item => (
            <li key={item.id} className="p-2 hover:bg-slate-100 cursor-pointer text-sm font-medium text-slate-700 border-b border-slate-100" onClick={() => { onChange(item.name); setIsOpen(false); }}>
              {item.name}
            </li>
          )) : (
            <li className="p-2 text-sm text-[#c2410c] font-semibold bg-orange-50">Press Save to create: "{value}"</li>
          )}
        </ul>
      )}
    </div>
  );
};

const TutorDashboard = () => {
  const { user, logout } = useAuthStore();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [students, setStudents] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  const [examTypes, setExamTypes] = useState([]);
  const [years, setYears] = useState([]);
  const [examContext, setExamContext] = useState({ exam_name: '', year_name: '' });
  const [gradesForm, setGradesForm] = useState({});

  // 1. Initial Data Fetch (Assignments, Exam Types, Years)
  useEffect(() => {
    let isMounted = true;
    const initFetch = async () => {
      try {
        const [assgnRes, examRes, yearRes] = await Promise.all([
          api.get('/tutor/assignments'), api.get('/admin/setup/exams'), api.get('/admin/setup/years')
        ]);
        if (isMounted) {
          setAssignments(assgnRes.data);
          setExamTypes(examRes.data);
          setYears(yearRes.data.map(y => ({ id: y.id, name: y.year_string })));
        }
      } catch (err) {
        console.error("Data load error", err);
      }
    };
    initFetch();
    return () => { isMounted = false; };
  }, []);

  // 2. Class Selection Logic
  const handleSelectClass = async (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedSubjectId('');
    try {
      const res = await api.get(`/tutor/classes/${assignment.class_id}/data`);
      setStudents(res.data.students);
      setClassSubjects(res.data.subjects);

      const initialForm = {};
      res.data.students.forEach(s => { initialForm[s.id] = { mark: '', grade: '', remark: '' }; });
      setGradesForm(initialForm);
    } catch (err) {
      console.error("Class load error", err);
    }
  };

  // 3. Auto-Population Effect (Fires when Subject, Exam, or Year changes)
  useEffect(() => {
    let isMounted = true;
    const fetchExistingGrades = async () => {
      if (!selectedAssignment || !selectedSubjectId || !examContext.exam_name || !examContext.year_name) {
        return;
      }
      try {
        const res = await api.get(`/tutor/classes/${selectedAssignment.class_id}/results`, {
          params: {
            subject_id: selectedSubjectId,
            exam_name: examContext.exam_name,
            year_name: examContext.year_name
          }
        });
        if (isMounted && res.data) {
          setGradesForm(prev => {
            const updatedForm = { ...prev };
            Object.keys(updatedForm).forEach(studentId => {
              if (res.data[studentId]) {
                updatedForm[studentId] = res.data[studentId];
              } else {
                updatedForm[studentId] = { mark: '', grade: '', remark: '' }; // Reset to blank if no grade exists
              }
            });
            return updatedForm;
          });
        }
      } catch (err) {
        console.error("Auto-populate error:", err);
      }
    };

    fetchExistingGrades();
    return () => { isMounted = false; };
  }, [selectedAssignment, selectedSubjectId, examContext.exam_name, examContext.year_name]);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/tutor/classes/${selectedAssignment.class_id}/subjects`, { name: newSubjectName });
      setClassSubjects([...classSubjects, res.data]);
      setNewSubjectName('');
      alert("Subject added to class successfully.");
    } catch (err) {
      console.error("Subject add error:", err);
      alert(err.response?.data?.msg || "Failed to add subject");
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    setGradesForm(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  const handleSubmitGrade = async (studentId) => {
    if (!examContext.exam_name || !examContext.year_name || !selectedSubjectId) {
      return alert("Please type/select an Exam, Year, and Subject first.");
    }

    try {
      const examRes = await api.post('/admin/setup/exams', { name: examContext.exam_name });
      const yearRes = await api.post('/admin/setup/years', { year_string: examContext.year_name });

      const payload = {
        student_id: studentId,
        exam_type_id: examRes.data.id,
        academic_year_id: yearRes.data.id,
        subject_id: selectedSubjectId,
        ...gradesForm[studentId]
      };

      await api.post('/tutor/results/submit', payload);
      alert("Grade submitted successfully! (Saving again updates the record).");
    } catch (err) {
      console.error("Submit grade error:", err);
      alert("Failed to submit grade.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f1] flex flex-col font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
      `}</style>

      <header className="bg-[#0f172a] text-white p-4 border-b-4 border-[#eab308] flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <BookOpen className="text-[#eab308]" size={22} />
          <h1 className="font-display text-xl font-semibold tracking-wide">Tutor Portal</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-sm font-medium text-slate-300">Welcome, {user?.first_name}</span>
          <button
            onClick={logout}
            className="text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 font-semibold text-sm border border-white/20 px-3 py-1.5 rounded-md"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 bg-white rounded-lg shadow-sm border border-slate-200 p-4 h-fit">
            <h2 className="text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase mb-4 pb-2 border-b border-slate-200">
              My Assigned Classes
            </h2>
            <div className="space-y-2">
              {assignments.map(a => (
                <button
                  key={a.assignment_id}
                  onClick={() => handleSelectClass(a)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    selectedAssignment?.assignment_id === a.assignment_id
                      ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-semibold text-sm">{a.class_name}</div>
                </button>
              ))}
              {assignments.length === 0 && <p className="text-sm text-slate-500 italic">No classes assigned to you.</p>}
            </div>
          </div>

          <div className="md:col-span-3 bg-white rounded-lg shadow-sm border border-slate-200 overflow-visible">
            {selectedAssignment ? (
              <div className="p-4 sm:p-6">
                <h2 className="font-display text-xl font-semibold mb-5 text-[#0f172a]">
                  Class data: {selectedAssignment.class_name}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">1. Select subject to grade</label>
                    <select
                      className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] text-sm bg-white"
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                    >
                      <option value="">Choose subject</option>
                      {classSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Subject missing? Create it</label>
                    <form onSubmit={handleAddSubject} className="flex gap-2">
                      <input
                        type="text" placeholder="e.g. History" value={newSubjectName}
                        onChange={e => setNewSubjectName(e.target.value)} required
                        className="flex-1 p-2 border border-slate-300 rounded-md outline-none text-sm focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]"
                      />
                      <button type="submit" className="bg-[#0f172a] text-white px-3 rounded-md font-semibold hover:bg-slate-800 transition-colors">
                        <PlusCircle size={16} />
                      </button>
                    </form>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-[#fdf6e3] border border-[#eab308] p-4 rounded-md shadow-sm relative z-20">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">2. Select or type exam</label>
                    <CreatableCombobox items={examTypes} value={examContext.exam_name} onChange={(val) => setExamContext({...examContext, exam_name: val})} placeholder="e.g. Mid-Term, End-of-Term" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">3. Select or type year</label>
                    <CreatableCombobox items={years} value={examContext.year_name} onChange={(val) => setExamContext({...examContext, year_name: val})} placeholder="e.g. 2026/2027, September" />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-sm relative z-10">
                  <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                    <thead className="bg-[#0f172a] text-white">
                      <tr>
                        <th className="p-3 font-semibold text-sm">Student name &amp; ID</th>
                        <th className="p-3 font-semibold text-sm w-24 text-center">Mark</th>
                        <th className="p-3 font-semibold text-sm w-24 text-center">Grade</th>
                        <th className="p-3 font-semibold text-sm w-48">Remark</th>
                        <th className="p-3 font-semibold text-sm w-32 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {students.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-semibold text-sm text-slate-800">
                            {s.name} <br/><span className="text-xs font-normal text-slate-500">{s.student_id}</span>
                          </td>
                          <td className="p-2">
                            <input type="number" className="w-full border border-slate-300 p-2 rounded-md text-center outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={gradesForm[s.id]?.mark || ''} onChange={(e) => handleGradeChange(s.id, 'mark', e.target.value)} />
                          </td>
                          <td className="p-2">
                            <input type="text" className="w-full border border-slate-300 p-2 rounded-md text-center uppercase outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] font-semibold" value={gradesForm[s.id]?.grade || ''} onChange={(e) => handleGradeChange(s.id, 'grade', e.target.value)} />
                          </td>
                          <td className="p-2">
                            <input type="text" className="w-full border border-slate-300 p-2 rounded-md outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={gradesForm[s.id]?.remark || ''} onChange={(e) => handleGradeChange(s.id, 'remark', e.target.value)} />
                          </td>
                          <td className="p-2 text-center">
                            <button onClick={() => handleSubmitGrade(s.id)} className="w-full bg-emerald-600 text-white p-2 rounded-md flex items-center justify-center gap-1 font-semibold text-xs shadow-sm hover:bg-emerald-700 transition-colors">
                              <Save size={14} /> Save
                            </button>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && <tr><td colSpan="5" className="text-center p-6 text-slate-500">No students enrolled in this class.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <BookOpen size={48} className="mb-4 opacity-20" />
                <p className="font-medium text-lg">Select a class from the sidebar to begin.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TutorDashboard;