import { useState, useEffect, useMemo } from 'react';
import { Users, CheckCircle, Search, Menu, LogOut, Settings, BookOpen, PlusCircle, Trash2, Edit, Eye, FileText } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const AdminDashboard = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('results');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [allResults, setAllResults] = useState([]);
  const [previewRecord, setPreviewRecord] = useState(null);

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const [newClass, setNewClass] = useState('');
  const [editClassId, setEditClassId] = useState(null);

  const [newSubject, setNewSubject] = useState({ name: '', class_id: '' });
  const [editSubjectId, setEditSubjectId] = useState(null);

  const [newExamType, setNewExamType] = useState('');
  const [newYear, setNewYear] = useState('');

  const [newStudent, setNewStudent] = useState({ student_id: '', first_name: '', last_name: '', gender: '', class_id: '', photo: null });
  const [editStudentId, setEditStudentId] = useState(null);

  const [newTutor, setNewTutor] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const [newAssignment, setNewAssignment] = useState({ tutor_id: '', class_id: '' });

  // EXACT RESOLVED PATTERN: loadData perfectly encapsulated inside useEffect
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      await Promise.resolve(); // Yield execution to prevent synchronous setState warning
      if (!isMounted) return;

      setLoading(true);
      try {
        if (activeTab === 'results') {
          const res = await api.get('/admin/results/all');
          if (isMounted) setAllResults(res.data);
        } else if (activeTab === 'students') {
          const [studRes, classRes] = await Promise.all([api.get('/admin/students'), api.get('/admin/classes')]);
          if (isMounted) {
            setStudents(studRes.data);
            setClasses(classRes.data);
          }
        } else if (activeTab === 'tutors') {
          const [tutRes, assgnRes, classRes] = await Promise.all([
            api.get('/admin/tutors'), api.get('/admin/tutors/assign'),
            api.get('/admin/classes')
          ]);
          if (isMounted) {
            setTutors(tutRes.data);
            setAssignments(assgnRes.data);
            setClasses(classRes.data);
          }
        } else if (activeTab === 'classes_subjects') {
          const [classRes, subRes] = await Promise.all([api.get('/admin/classes'), api.get('/admin/subjects')]);
          if (isMounted) {
            setClasses(classRes.data);
            setSubjects(subRes.data);
          }
        } else if (activeTab === 'setup') {
          const [examRes, yearRes] = await Promise.all([api.get('/admin/setup/exams'), api.get('/admin/setup/years')]);
          if (isMounted) {
            setExamTypes(examRes.data);
            setAcademicYears(yearRes.data);
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshTrigger]);

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Delete this? This cannot be undone.`)) return;
    try {
      let endpoint = `/admin/${type}s/${id}`;
      if (type === 'assignment') endpoint = `/admin/tutors/assign/${id}`;
      if (type === 'setup/exam') endpoint = `/admin/setup/exams/${id}`;
      if (type === 'setup/year') endpoint = `/admin/setup/years/${id}`;
      await api.delete(endpoint);
      triggerRefresh();
    } catch (err) {
      console.error("Delete Error:", err);
      alert(err.response?.data?.msg || `Failed to delete.`);
    }
  };

  const handleApprove = async (recordId) => {
    if (!window.confirm("Approve and publish this complete result slip?")) return;
    try {
      await api.patch(`/admin/results/${recordId}/approve`);
      setPreviewRecord(null);
      triggerRefresh();
    } catch (err) {
      console.error("Approval Error:", err);
      alert("Failed to approve result.");
    }
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('student_id', newStudent.student_id);
    formData.append('first_name', newStudent.first_name);
    formData.append('last_name', newStudent.last_name);
    formData.append('gender', newStudent.gender);
    formData.append('class_id', newStudent.class_id);
    if (newStudent.photo) formData.append('photo', newStudent.photo);

    try {
      if (editStudentId) await api.put(`/admin/students/${editStudentId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      else await api.post('/admin/students', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setNewStudent({ student_id: '', first_name: '', last_name: '', gender: '', class_id: '', photo: null });
      setEditStudentId(null);
      triggerRefresh();
    } catch (err) {
      console.error("Save Student Error:", err);
      alert("Failed to save student.");
    }
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    try {
      if (editClassId) await api.put(`/admin/classes/${editClassId}`, { name: newClass });
      else await api.post('/admin/classes', { name: newClass });
      setNewClass('');
      setEditClassId(null);
      triggerRefresh();
    } catch (err) {
      console.error("Save Class Error:", err);
      alert("Failed to save class.");
    }
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    try {
      if (editSubjectId) {
        await api.put(`/admin/subjects/${editSubjectId}`, newSubject);
      } else {
        await api.post('/admin/subjects', newSubject);
      }
      setNewSubject({ name: '', class_id: '' });
      setEditSubjectId(null);
      triggerRefresh();
    } catch (err) {
      console.error("Save Subject Error:", err);
      alert(err.response?.data?.msg || "Failed to save subject.");
    }
  };

  const handleSaveExamType = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/setup/exams', { name: newExamType });
      setNewExamType('');
      triggerRefresh();
    } catch (err) {
      console.error("Save Exam Type Error:", err);
      alert("Failed to save exam type.");
    }
  };

  const handleSaveYear = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/setup/years', { year_string: newYear, is_active: true });
      setNewYear('');
      triggerRefresh();
    } catch (err) {
      console.error("Save Year Error:", err);
      alert("Failed to save academic year.");
    }
  };

  const handleCreateTutor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/tutors', newTutor);
      setNewTutor({ first_name: '', last_name: '', email: '', password: '' });
      triggerRefresh();
    } catch (err) {
      console.error("Create Tutor Error:", err);
      alert("Failed to create tutor.");
    }
  };

  const handleAssignTutor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/tutors/assign', newAssignment);
      setNewAssignment({ tutor_id: '', class_id: '' });
      triggerRefresh();
    } catch (err) {
      console.error("Assign Tutor Error:", err);
      alert(err.response?.data?.msg || "Failed to assign tutor.");
    }
  };

  const filteredData = useMemo(() => {
    if (activeTab === 'results') return allResults.filter(r => r.student.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeTab === 'students') return students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.student_id.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeTab === 'tutors') return tutors.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return [];
  }, [activeTab, allResults, students, tutors, searchQuery]);

  const groupedStudents = useMemo(() => {
    const groups = {};
    if (activeTab === 'students') {
      filteredData.forEach(student => {
        const classObj = classes.find(c => c.id === student.class_id);
        const className = classObj ? classObj.name : 'Unassigned';
        if (!groups[className]) groups[className] = [];
        groups[className].push(student);
      });
    }
    return groups;
  }, [filteredData, classes, activeTab]);

  return (
    <div className="flex h-screen bg-[#f7f5f1] overflow-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
      `}</style>

      {/* RESULT SLIP PREVIEW MODAL */}
      {previewRecord && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 flex justify-center items-start pt-10 pb-10 px-4 overflow-y-auto">
          <div className="bg-white max-w-4xl w-full rounded-lg shadow-xl overflow-hidden relative">
            <div className="p-8">
              <div className="bg-[#fdf6e3] flex flex-col md:flex-row items-center justify-between p-6 border-b-[6px] border-[#0f172a] mb-8 rounded-t-md">
                <div className="flex items-center gap-4">
                  <img src="https://pub-8e6b93e949904a4483a44991b1520604.r2.dev/public/britannia-logo.png" alt="Logo" className="h-20 w-20 object-contain" />
                  <div>
                    <h1 className="font-display text-xl md:text-2xl font-semibold text-[#0f172a] uppercase tracking-wide">Britannia International Academy</h1>
                    <p className="text-sm font-semibold text-[#c2410c] tracking-widest uppercase mt-1">Official Result Statement Preview</p>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase shadow-sm border ${previewRecord.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    Status: {previewRecord.status}
                  </span>
                </div>
              </div>

              <div className="mb-8 border-2 border-slate-800 rounded-sm overflow-hidden">
                <div className="bg-[#0f172a] text-white font-semibold p-2.5 text-sm tracking-widest border-b-2 border-slate-800 uppercase">
                  Candidate's Details
                </div>
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-3/4 p-0">
                    <table className="w-full text-sm text-left">
                      <tbody>
                        <tr className="border-b border-slate-300">
                          <th className="p-3 font-semibold w-2/5 bg-slate-50 border-r border-slate-300 uppercase text-xs text-slate-600">Student ID Number</th>
                          <td className="p-3 font-bold text-lg text-[#0f172a]">{previewRecord.candidate.student_id}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <th className="p-3 font-semibold w-2/5 bg-slate-50 border-r border-slate-300 uppercase text-xs text-slate-600">Candidate Name</th>
                          <td className="p-3 uppercase font-bold text-[#0f172a] tracking-wide">{previewRecord.candidate.name}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <th className="p-3 font-semibold w-2/5 bg-slate-50 border-r border-slate-300 uppercase text-xs text-slate-600">Type of Examination</th>
                          <td className="p-3 uppercase font-semibold text-slate-800">{previewRecord.candidate.exam_type}</td>
                        </tr>
                        <tr>
                          <th className="p-3 font-semibold w-2/5 bg-slate-50 border-r border-slate-300 uppercase text-xs text-slate-600">Examination Year</th>
                          <td className="p-3 uppercase font-semibold text-slate-800">{previewRecord.candidate.academic_year}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="w-full md:w-1/4 flex items-center justify-center p-6 border-t md:border-t-0 md:border-l border-slate-300 bg-slate-100">
                    <div className="bg-white p-2 border-2 border-slate-300 shadow-sm">
                      <img
                        src={
                          previewRecord.candidate.photo_url
                            ? previewRecord.candidate.photo_url
                            : (previewRecord.candidate.gender?.toLowerCase() === 'female'
                                ? "/female-shadow.png"
                                : "/male-shadow.png")
                        }
                        alt="Candidate Photo"
                        className="h-32 w-32 object-cover border border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-slate-800 rounded-sm overflow-hidden shadow-sm">
                <div className="bg-[#0f172a] text-white font-semibold p-2.5 text-sm tracking-widest border-b-2 border-slate-800 uppercase flex justify-between items-center">
                  <span>Statement of Results</span>
                  <span className="text-xs text-[#eab308] bg-slate-800 px-2 py-0.5 rounded">Compiled from {previewRecord.items_count} subject entries</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap min-w-[500px]">
                    <thead className="bg-slate-100 border-b-2 border-slate-800">
                      <tr>
                        <th className="p-3 font-bold text-slate-800 border-r border-slate-300 w-2/5 uppercase text-xs">Subject</th>
                        <th className="p-3 font-bold text-slate-800 text-center border-r border-slate-300 w-1/5 uppercase text-xs">Grade</th>
                        <th className="p-3 font-bold text-slate-800 text-center border-r border-slate-300 w-1/5 uppercase text-xs">Mark</th>
                        <th className="p-3 font-bold text-slate-800 text-center w-1/5 uppercase text-xs">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRecord.results.map((item, index) => (
                        <tr key={index} className="border-b border-slate-300 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-semibold text-slate-800 border-r border-slate-300 tracking-wide">{item.subject.toUpperCase()}</td>
                          <td className="p-3 text-center font-bold text-[#c2410c] text-base border-r border-slate-300">{item.grade}</td>
                          <td className="p-3 text-center font-semibold text-slate-800 border-r border-slate-300">{item.mark}</td>
                          <td className="p-3 text-center text-slate-600 font-semibold uppercase text-xs">{item.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-between items-center">
              <p className="text-xs text-slate-500 font-medium max-w-sm">If a tutor updates a grade later, this slip will automatically revert to "Pending" for re-approval.</p>
              <div className="flex gap-3">
                <button onClick={() => setPreviewRecord(null)} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-md shadow-sm hover:bg-slate-50 transition-colors">
                  Close
                </button>
                {previewRecord.status === 'pending' && (
                  <button onClick={() => handleApprove(previewRecord.record_id)} className="px-5 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-md shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2">
                    <CheckCircle size={18} /> Approve &amp; Publish Slip
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 flex flex-col`}>
        <div className="p-6 border-b-4 border-[#eab308] bg-[#0f172a] text-center">
          <img src="https://pub-8e6b93e949904a4483a44991b1520604.r2.dev/public/britannia-logo.png" alt="Logo" className="h-12 w-12 mx-auto mb-2 bg-white rounded-full p-1 object-contain" />
          <h2 className="font-display text-lg font-semibold text-white">Admin Portal</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button onClick={() => { setActiveTab('results'); setIsMobileMenuOpen(false); setSearchQuery(''); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${activeTab === 'results' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:bg-slate-100'}`}><FileText size={18} /> <span className="font-medium">Results Approval</span></button>
          <button onClick={() => { setActiveTab('setup'); setIsMobileMenuOpen(false); setSearchQuery(''); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${activeTab === 'setup' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Settings size={18} /> <span className="font-medium">Setup</span></button>
          <button onClick={() => { setActiveTab('classes_subjects'); setIsMobileMenuOpen(false); setSearchQuery(''); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${activeTab === 'classes_subjects' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Settings size={18} /> <span className="font-medium">Classes &amp; Subjects</span></button>
          <button onClick={() => { setActiveTab('tutors'); setIsMobileMenuOpen(false); setSearchQuery(''); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${activeTab === 'tutors' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:bg-slate-100'}`}><BookOpen size={18} /> <span className="font-medium">Tutors</span></button>
          <button onClick={() => { setActiveTab('students'); setIsMobileMenuOpen(false); setSearchQuery(''); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${activeTab === 'students' ? 'bg-[#0f172a] text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Users size={18} /> <span className="font-medium">Students</span></button>
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm"><LogOut size={18} /> <span className="font-medium">Logout</span></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(true)}><Menu size={22} /></button>
          <div className="text-sm text-slate-600 font-medium ml-auto">Logged in as: <span className="font-semibold text-[#0f172a]">{user?.first_name} {user?.last_name}</span></div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {(activeTab === 'results' || activeTab === 'students' || activeTab === 'tutors') && (
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="font-display text-2xl font-semibold text-[#0f172a] capitalize">{activeTab === 'results' ? 'Master results ledger' : `Manage ${activeTab}`}</h1>
              <div className="relative w-full md:w-72">
                <input type="text" placeholder="Search records..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] shadow-sm text-sm" />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              </div>
            </div>
          )}

          {/* MASTER RESULTS LEDGER */}
          {activeTab === 'results' && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-[#0f172a] text-white">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-sm">Student Info</th>
                      <th className="px-6 py-4 font-semibold text-sm">Exam Details</th>
                      <th className="px-6 py-4 font-semibold text-sm">Compiled Subjects</th>
                      <th className="px-6 py-4 font-semibold text-sm">Status</th>
                      <th className="px-6 py-4 font-semibold text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {loading ? <tr><td colSpan="5" className="text-center py-8 font-medium text-slate-500">Fetching data...</td></tr> :
                     filteredData.length === 0 ? <tr><td colSpan="5" className="text-center py-8 text-slate-500">No records found.</td></tr> :
                     filteredData.map(record => (
                      <tr key={record.record_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#0f172a]">{record.student}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{record.exam_type} <br/><span className="text-xs text-slate-400">({record.academic_year})</span></td>
                        <td className="px-6 py-4"><span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-xs font-semibold">{record.items_count} Subjects Appended</span></td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${record.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => setPreviewRecord(record)} className={`px-4 py-2 rounded-md text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 ${record.status === 'pending' ? 'bg-[#c2410c] hover:bg-[#9a3412] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>
                            <Eye size={16}/> {record.status === 'pending' ? 'Review to Publish' : 'View Slip'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === 'students' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                  <h2 className="text-base font-semibold text-[#0f172a]">{editStudentId ? 'Edit Student' : 'Add New Student'}</h2>
                  {editStudentId && <button onClick={() => { setEditStudentId(null); setNewStudent({ student_id: '', first_name: '', last_name: '', gender: '', class_id: '', photo: null }); }} className="text-xs text-red-500 hover:underline">Cancel</button>}
                </div>
                <form onSubmit={handleSaveStudent} className="space-y-3 text-sm">
                  <input type="text" placeholder="Student ID (e.g. BIA-2026-001)" required className="w-full p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={newStudent.student_id} onChange={e => setNewStudent({...newStudent, student_id: e.target.value})} />
                  <input type="text" placeholder="First Name" required className="w-full p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={newStudent.first_name} onChange={e => setNewStudent({...newStudent, first_name: e.target.value})} />
                  <input type="text" placeholder="Last Name" required className="w-full p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={newStudent.last_name} onChange={e => setNewStudent({...newStudent, last_name: e.target.value})} />
                  <select required className="w-full p-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={newStudent.gender} onChange={e => setNewStudent({...newStudent, gender: e.target.value})}>
                    <option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                  <select required className="w-full p-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={newStudent.class_id} onChange={e => setNewStudent({...newStudent, class_id: e.target.value})}>
                    <option value="">Select class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Passport Photo {editStudentId ? '(Optional Update)' : '(Optional)'}</label>
                    <input type="file" accept="image/*" className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0f172a] file:text-white hover:file:bg-slate-800" onChange={e => setNewStudent({...newStudent, photo: e.target.files[0]})} />
                  </div>
                  <button type="submit" className="w-full bg-[#0f172a] text-white p-2.5 rounded-md font-semibold hover:bg-slate-800 transition-colors">{editStudentId ? 'Update Student' : 'Add Student'}</button>
                </form>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-6">
                {Object.keys(groupedStudents).length === 0 && !loading && (
                    <div className="text-center py-10 bg-white rounded-lg border border-slate-200 text-slate-500 font-medium shadow-sm">No students found.</div>
                )}
                {Object.entries(groupedStudents).map(([className, classStudents]) => (
                  <div key={className} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-[#0f172a] text-white px-4 py-3 font-semibold text-sm tracking-wide flex justify-between">
                      <span>Class Group: {className}</span><span className="text-[#eab308]">{classStudents.length} Students</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left whitespace-nowrap text-sm">
                        <thead className="bg-slate-100 border-b-2 border-slate-200">
                          <tr><th className="px-4 py-3 font-semibold text-slate-700">Photo</th><th className="px-4 py-3 font-semibold text-slate-700">Student ID</th><th className="px-4 py-3 font-semibold text-slate-700">Name</th><th className="px-4 py-3 font-semibold text-slate-700 text-center">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {classStudents.map(student => (
                            <tr key={student.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2">
                                <img
                                  src={
                                    student.photo_url
                                      ? student.photo_url
                                      : (student.gender?.toLowerCase() === 'female'
                                          ? "/female-shadow.png"
                                          : "/male-shadow.png")
                                  }
                                  alt="Profile"
                                  className="h-10 w-10 rounded-full border border-slate-300 object-cover shadow-sm bg-white"
                                />
                              </td>
                              <td className="px-4 py-2 font-semibold text-[#0f172a]">{student.student_id}</td>
                              <td className="px-4 py-2 font-medium text-slate-700">{student.name}</td>
                              <td className="px-4 py-2 text-center">
                                <button onClick={() => { setEditStudentId(student.id); setNewStudent({ student_id: student.student_id, first_name: student.first_name, last_name: student.last_name, gender: student.gender || 'Male', class_id: student.class_id, photo: null }); }} className="text-blue-600 hover:text-blue-800 p-1.5 mr-2 bg-blue-50 rounded-md transition-colors"><Edit size={16}/></button>
                                <button onClick={() => handleDelete('student', student.id)} className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 rounded-md transition-colors"><Trash2 size={16}/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CLASSES & SUBJECTS TAB */}
          {activeTab === 'classes_subjects' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                   <h2 className="text-base font-semibold text-[#0f172a] flex items-center gap-2"><PlusCircle size={18}/> {editClassId ? 'Edit Class Group' : 'Create Class Group'}</h2>
                   {editClassId && <button onClick={() => {setEditClassId(null); setNewClass('');}} className="text-xs text-red-500 hover:underline">Cancel</button>}
                 </div>
                 <form onSubmit={handleSaveClass} className="flex gap-3">
                    <input type="text" placeholder="Class Name (e.g., Year 10)" value={newClass} onChange={(e) => setNewClass(e.target.value)} required className="flex-1 p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" />
                    <button type="submit" className="bg-[#0f172a] text-white px-6 py-2 rounded-md font-semibold hover:bg-slate-800 transition-colors">{editClassId ? 'Update' : 'Add'}</button>
                 </form>
                 <div className="mt-6">
                   <h3 className="text-[11px] font-semibold text-slate-500 tracking-[0.15em] uppercase mb-2">Existing Classes</h3>
                   <div className="max-h-56 overflow-y-auto">
                     <ul className="flex flex-col gap-2">
                       {classes.map(c => (
                         <li key={c.id} className="bg-slate-50 px-4 py-2 rounded-md text-sm font-semibold text-slate-700 border border-slate-200 flex justify-between items-center">
                           {c.name}
                           <div className="flex gap-3">
                             <button onClick={() => { setEditClassId(c.id); setNewClass(c.name); }} className="text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                             <button onClick={() => handleDelete('class', c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                           </div>
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
               </div>

               <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                   <h2 className="text-base font-semibold text-[#0f172a] flex items-center gap-2"><PlusCircle size={18}/> {editSubjectId ? 'Edit Subject' : 'Add Subject to Class'}</h2>
                   {editSubjectId && <button onClick={() => {setEditSubjectId(null); setNewSubject({name: '', class_id: ''});}} className="text-xs text-red-500 hover:underline">Cancel</button>}
                 </div>
                 <form onSubmit={handleSaveSubject} className="flex flex-col gap-3">
                    <select required className="p-2.5 border border-slate-300 rounded-md outline-none text-sm focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] bg-white" value={newSubject.class_id} onChange={(e) => setNewSubject({...newSubject, class_id: e.target.value})}>
                      <option value="">Select class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex gap-3">
                      <input type="text" placeholder="Subject Name (e.g., Mathematics)" value={newSubject.name} onChange={(e) => setNewSubject({...newSubject, name: e.target.value})} required className="flex-1 p-2.5 border border-slate-300 rounded-md outline-none text-sm focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" />
                      <button type="submit" className="bg-[#0f172a] text-white px-6 py-2 rounded-md font-semibold hover:bg-slate-800 transition-colors">{editSubjectId ? 'Update' : 'Add'}</button>
                    </div>
                 </form>
                 <div className="mt-6">
                   <h3 className="text-[11px] font-semibold text-slate-500 tracking-[0.15em] uppercase mb-2">Existing Subjects</h3>
                   <div className="max-h-56 overflow-y-auto">
                     <ul className="flex flex-col gap-2">
                       {subjects.map(s => (
                         <li key={s.id} className="bg-slate-50 px-4 py-2 rounded-md text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm flex justify-between items-center">
                           <span>{s.name} <span className="text-xs text-[#c2410c] ml-2 px-2 py-0.5 bg-white rounded border border-slate-200">{s.class_name}</span></span>
                           <div className="flex gap-3">
                             <button onClick={() => { setEditSubjectId(s.id); setNewSubject({name: s.name, class_id: s.class_id}); }} className="text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                             <button onClick={() => handleDelete('subject', s.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                           </div>
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'tutors' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                  <h2 className="text-base font-semibold border-b border-slate-200 pb-2 mb-4 text-[#0f172a]">Create Tutor Account</h2>
                  <form onSubmit={handleCreateTutor} className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <input type="text" placeholder="First Name" required className="flex-1 p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={newTutor.first_name} onChange={e => setNewTutor({...newTutor, first_name: e.target.value})} />
                      <input type="text" placeholder="Last Name" required className="flex-1 p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={newTutor.last_name} onChange={e => setNewTutor({...newTutor, last_name: e.target.value})} />
                    </div>
                    <input type="email" placeholder="Email Address" required className="w-full p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={newTutor.email} onChange={e => setNewTutor({...newTutor, email: e.target.value})} />
                    <input type="password" placeholder="Temporary Password" required className="w-full p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={newTutor.password} onChange={e => setNewTutor({...newTutor, password: e.target.value})} />
                    <button type="submit" className="w-full bg-[#0f172a] text-white p-2.5 rounded-md font-semibold hover:bg-slate-800 transition-colors">Create Tutor</button>
                  </form>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-3 border-b border-slate-200 font-semibold text-sm text-[#0f172a]">Active Tutors Database</div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <tbody className="divide-y divide-slate-100">
                        {filteredData.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50 flex justify-between p-3 items-center">
                            <td className="font-semibold text-slate-700">{t.name} <br/><span className="text-xs font-normal text-slate-500">{t.email}</span></td>
                            <td><button onClick={() => handleDelete('tutor', t.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md"><Trash2 size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                  <h2 className="text-base font-semibold border-b border-slate-200 pb-2 mb-4 text-[#0f172a] flex items-center gap-2"><BookOpen size={18} /> Assign Tutor to Class</h2>
                  <form onSubmit={handleAssignTutor} className="space-y-3 text-sm">
                    <select required className="w-full p-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={newAssignment.tutor_id} onChange={e => setNewAssignment({...newAssignment, tutor_id: e.target.value})}>
                      <option value="">Select tutor</option>
                      {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select required className="w-full p-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" value={newAssignment.class_id} onChange={e => setNewAssignment({...newAssignment, class_id: e.target.value})}>
                      <option value="">Select class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="submit" className="w-full bg-emerald-600 text-white p-2.5 rounded-md font-semibold hover:bg-emerald-700 shadow-sm transition-colors">Assign Tutor to Class</button>
                  </form>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-3 border-b border-slate-200 font-semibold text-sm text-[#0f172a]">Current Class Assignments</div>
                  <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-left whitespace-nowrap text-sm">
                      <thead className="bg-white border-b-2 border-slate-200 sticky top-0">
                        <tr><th className="px-4 py-2 text-slate-600 font-semibold">Tutor</th><th className="px-4 py-2 text-slate-600 font-semibold">Class Assigned</th><th className="px-4 py-2 text-slate-600 font-semibold">Act</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {loading ? <tr><td colSpan="3" className="text-center py-4 text-slate-500">Loading...</td></tr> :
                        assignments.map(a => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-semibold text-slate-700">{a.tutor_name}</td>
                            <td className="px-4 py-2 text-slate-700">{a.class_name}</td>
                            <td className="px-4 py-2"><button onClick={() => handleDelete('assignment', a.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md"><Trash2 size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                   <h2 className="text-base font-semibold text-[#0f172a] flex items-center gap-2"><PlusCircle size={18}/> Create Exam Type</h2>
                 </div>
                 <form onSubmit={handleSaveExamType} className="flex gap-3">
                    <input type="text" placeholder="e.g., WASSCE, Mock" value={newExamType} onChange={(e) => setNewExamType(e.target.value)} required className="flex-1 p-2.5 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" />
                    <button type="submit" className="bg-[#0f172a] text-white px-6 py-2 rounded-md font-semibold hover:bg-slate-800 transition-colors">Add</button>
                 </form>
                 <div className="mt-6">
                   <h3 className="text-[11px] font-semibold text-slate-500 tracking-[0.15em] uppercase mb-2">Existing Exam Types</h3>
                   <div className="max-h-56 overflow-y-auto">
                     <ul className="flex flex-col gap-2">
                       {examTypes.map(e => (
                         <li key={e.id} className="bg-slate-50 px-4 py-2 rounded-md text-sm font-semibold text-slate-700 border border-slate-200 flex justify-between items-center">
                           {e.name}
                           <button onClick={() => handleDelete('setup/exam', e.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
               </div>

               <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                   <h2 className="text-base font-semibold text-[#0f172a] flex items-center gap-2"><PlusCircle size={18}/> Create Academic Year</h2>
                 </div>
                 <form onSubmit={handleSaveYear} className="flex gap-3">
                    <input type="text" placeholder="e.g., 2026/2027" value={newYear} onChange={(e) => setNewYear(e.target.value)} required className="flex-1 p-2.5 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]" />
                    <button type="submit" className="bg-[#0f172a] text-white px-6 py-2 rounded-md font-semibold hover:bg-slate-800 transition-colors">Add</button>
                 </form>
                 <div className="mt-6">
                   <h3 className="text-[11px] font-semibold text-slate-500 tracking-[0.15em] uppercase mb-2">Existing Academic Years</h3>
                   <div className="max-h-56 overflow-y-auto">
                     <ul className="flex flex-col gap-2">
                       {academicYears.map(y => (
                         <li key={y.id} className="bg-slate-50 px-4 py-2 rounded-md text-sm font-semibold text-slate-700 border border-slate-200 flex justify-between items-center">
                           {y.year_string}
                           <button onClick={() => handleDelete('setup/year', y.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;