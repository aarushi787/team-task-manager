import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', overdue: '' });
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ assigneeId: user.id });
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.overdue) params.set('overdue', 'true');
    const { data } = await api.get(`/tasks?${params}`);
    setTasks(data.tasks);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const updateStatus = async (taskId, status) => {
    const { data } = await api.put(`/tasks/${taskId}`, { status });
    setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
  };

  const filtered = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  const grouped = filtered.reduce((acc, t) => {
    const key = t.status; acc[key] = acc[key] || []; acc[key].push(t); return acc;
  }, {});

  const STATUS_CONFIG = {
    todo: { label: 'To Do', color: '#555670' },
    in_progress: { label: 'In Progress', color: '#4f8ef7' },
    review: { label: 'Review', color: '#b07ef8' },
    done: { label: 'Done', color: '#4ecb8c' },
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Tasks</h1>
          <p>{filtered.length} task{filtered.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </div>

      <div className="page-body">
        <div className="filter-bar">
          <div className="search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="search-input" placeholder="Search tasks…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <select className="select-filter" value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}>
            <option value="">All statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select className="select-filter" value={filters.priority} onChange={e=>setFilters(f=>({...f,priority:e.target.value}))}>
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button
            className={`btn btn-sm ${filters.overdue ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilters(f => ({...f, overdue: f.overdue ? '' : '1'}))}
          >
            ⚠ Overdue only
          </button>
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:60}}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <h3>No tasks found</h3>
            <p>Tasks assigned to you will appear here</p>
          </div>
        ) : (
          Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const statusTasks = grouped[status] || [];
            if (statusTasks.length === 0) return null;
            return (
              <div key={status} style={{marginBottom:24}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:config.color}} />
                  <span style={{fontSize:'0.875rem',fontWeight:600,color:'var(--text-secondary)'}}>{config.label}</span>
                  <span style={{fontSize:'0.75rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)',background:'var(--bg-elevated)',padding:'1px 7px',borderRadius:10}}>{statusTasks.length}</span>
                </div>
                <div className="task-list">
                  {statusTasks.map(task => {
                    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                    return (
                      <div key={task.id} className={`task-item ${isOverdue?'overdue':''}`}>
                        <div className="task-status-dot" style={{background:config.color}} />
                        <div className="task-body">
                          <div className={`task-title ${task.status==='done'?'done':''}`}>{task.title}</div>
                          {task.description && <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:4,display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{task.description}</div>}
                          <div className="task-meta">
                            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                            {task.project && (
                              <button style={{background:'var(--bg-elevated)',border:'none',borderRadius:4,padding:'2px 8px',fontSize:'0.75rem',color:'var(--text-secondary)',cursor:'pointer'}}
                                onClick={()=>navigate(`/projects/${task.project.id}`)}>
                                📁 {task.project.name}
                              </button>
                            )}
                            {task.dueDate && (
                              <span style={{fontSize:'0.75rem',color:isOverdue?'var(--red)':'var(--text-muted)'}}>
                                📅 {format(new Date(task.dueDate),'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Quick status buttons */}
                        <div style={{display:'flex',gap:4,flexShrink:0}}>
                          {status !== 'in_progress' && <button className="btn btn-secondary btn-sm" onClick={()=>updateStatus(task.id,'in_progress')}>Start</button>}
                          {status !== 'done' && <button className="btn btn-sm" style={{background:'var(--green-bg)',color:'var(--green)',border:'none'}} onClick={()=>updateStatus(task.id,'done')}>✓</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
