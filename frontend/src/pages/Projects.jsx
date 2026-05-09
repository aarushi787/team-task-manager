import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#4f8ef7','#e8a44a','#4ecb8c','#f26b6b','#b07ef8','#f0924e','#4ecbcb','#f07eb0'];

function getInitials(name = '') { return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2); }

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/projects', form);
      onCreated(data.project);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">New Project</div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Name *</label>
            <input className="form-control" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="My Awesome Project" required autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="What is this project about?" rows={3} />
          </div>
          <div className="form-group">
            <label>Color</label>
            <div className="color-options">
              {COLORS.map(c => (
                <div key={c} className={`color-dot ${form.color===c?'selected':''}`} style={{background:c}} onClick={() => setForm(f=>({...f,color:c}))} />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{width:14,height:14,borderColor:'rgba(0,0,0,0.2)',borderTopColor:'#1a1a2e'}} /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.projects)).finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const taskProgress = (p) => {
    const tasks = p.tasks || [];
    const done = tasks.filter(t => t.status === 'done').length;
    return tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Projects</h1>
          <p>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Project
        </button>
      </div>

      <div className="page-body">
        <div className="filter-bar">
          <div className="search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="search-input" placeholder="Search projects…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
          </div>
        ) : (
          <div className="projects-grid">
            {filtered.map(project => {
              const progress = taskProgress(project);
              const taskCount = project.tasks?.length || 0;
              const doneCount = project.tasks?.filter(t=>t.status==='done').length || 0;
              return (
                <div key={project.id} className="project-card" style={{'--project-color': project.color}}
                  onClick={() => navigate(`/projects/${project.id}`)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="project-name">{project.name}</div>
                    <span className={`badge badge-${project.status}`}>{project.status}</span>
                  </div>
                  <div className="project-desc">{project.description || 'No description'}</div>

                  {/* Progress bar */}
                  <div style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:'0.75rem',color:'var(--text-muted)'}}>
                      <span>Progress</span>
                      <span style={{fontFamily:'var(--font-mono)'}}>{progress}%</span>
                    </div>
                    <div style={{height:4,background:'var(--bg-elevated)',borderRadius:2,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${progress}%`,background:project.color,borderRadius:2,transition:'width 0.3s'}} />
                    </div>
                  </div>

                  <div className="project-stats">
                    <div className="project-stat"><strong>{taskCount}</strong> tasks</div>
                    <div className="project-stat"><strong>{doneCount}</strong> done</div>
                    <div className="project-stat"><strong>{project.members?.length || 0}</strong> members</div>
                  </div>
                  <div className="project-members">
                    {(project.members || []).slice(0,5).map(m => (
                      <div key={m.id} className="member-avatar" title={m.name} style={{background: project.color + '33',color:project.color}}>
                        {getInitials(m.name)}
                      </div>
                    ))}
                    {(project.members?.length||0) > 5 && (
                      <div className="member-avatar" style={{fontSize:'0.6rem'}}>+{project.members.length-5}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} onCreated={p => setProjects(prev=>[p,...prev])} />}
    </div>
  );
}
