import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function getInitials(name=''){return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);}

const STATUS_COLS = [
  {key:'todo',label:'To Do',color:'#555670'},
  {key:'in_progress',label:'In Progress',color:'#4f8ef7'},
  {key:'review',label:'Review',color:'#b07ef8'},
  {key:'done',label:'Done',color:'#4ecb8c'},
];

function TaskModal({ task, projectId, members, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assigneeId: task?.assignee?.id || '',
    dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isEdit) {
        const { data } = await api.put(`/tasks/${task.id}`, {...form, projectId});
        onSaved(data.task, 'update');
      } else {
        const { data } = await api.post('/tasks', {...form, projectId});
        onSaved(data.task, 'create');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input className="form-control" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required autoFocus placeholder="Task title" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="Optional details…" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assignee</label>
              <select className="form-control" value={form.assigneeId} onChange={e=>setForm(f=>({...f,assigneeId:e.target.value}))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" className="form-control" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{width:14,height:14,borderColor:'rgba(0,0,0,0.2)',borderTopColor:'#1a1a2e'}} /> : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, existingIds, onClose, onAdded }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.users.filter(u => !existingIds.includes(u.id))));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault(); if(!userId) return; setLoading(true);
    try {
      await api.post(`/projects/${projectId}/members`, { userId, role });
      const user = users.find(u=>u.id===userId);
      onAdded({ ...user, ProjectMember: { role } });
      onClose();
    } catch (err) { setError(err.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:380}}>
        <div className="modal-header">
          <div className="modal-title">Add Member</div>
          <button className="modal-close" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select User</label>
            <select className="form-control" value={userId} onChange={e=>setUserId(e.target.value)} required>
              <option value="">Choose a user…</option>
              {users.map(u=><option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="form-control" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading||!userId}>Add Member</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban');
  const [taskModal, setTaskModal] = useState(null); // null | 'create' | task object
  const [memberModal, setMemberModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => api.get(`/projects/${id}`).then(r=>setProject(r.data.project)).catch(()=>navigate('/projects')).finally(()=>setLoading(false));

  useEffect(()=>{ load(); }, [id]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!project) return null;

  const myMembership = project.members?.find(m=>m.id===user?.id);
  const amProjectAdmin = isAdmin || myMembership?.ProjectMember?.role === 'admin';
  const members = project.members || [];
  const tasks = project.tasks || [];

  const handleTaskSaved = (savedTask, type) => {
    setProject(prev => ({
      ...prev,
      tasks: type === 'create'
        ? [savedTask, ...prev.tasks]
        : prev.tasks.map(t => t.id === savedTask.id ? savedTask : t),
    }));
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setProject(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Delete project "${project.name}"? All tasks will be lost.`)) return;
    setDeleting(true);
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${memberId}`);
    setProject(prev => ({ ...prev, members: prev.members.filter(m=>m.id!==memberId) }));
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status: newStatus });
      handleTaskSaved(data.task, 'update');
    } catch {}
  };

  const tasksByStatus = STATUS_COLS.reduce((acc,col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  const done = tasks.filter(t=>t.status==='done').length;
  const progress = tasks.length ? Math.round((done/tasks.length)*100) : 0;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <button className="btn btn-ghost btn-sm" style={{padding:'4px 8px',fontSize:'0.8rem',color:'var(--text-muted)'}} onClick={()=>navigate('/projects')}>
              ← Projects
            </button>
            <div style={{width:10,height:10,borderRadius:'50%',background:project.color}} />
            <h1>{project.name}</h1>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
          </div>
          {project.description && <p>{project.description}</p>}
          <div style={{display:'flex',alignItems:'center',gap:12,marginTop:6,fontSize:'0.8rem',color:'var(--text-muted)'}}>
            <span>{tasks.length} tasks · {done} done · {progress}% complete</span>
            <span>Owner: {project.owner?.name}</span>
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {amProjectAdmin && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={()=>setMemberModal(true)}>+ Add Member</button>
              <button className="btn btn-primary btn-sm" onClick={()=>setTaskModal('create')}>+ Task</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject} disabled={deleting}>Delete</button>
            </>
          )}
          {!amProjectAdmin && (
            <button className="btn btn-primary btn-sm" onClick={()=>setTaskModal('create')}>+ Task</button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Progress bar */}
        <div style={{marginBottom:20,background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'14px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:'0.83rem'}}>
            <span style={{color:'var(--text-secondary)'}}>Overall Progress</span>
            <span style={{fontFamily:'var(--font-mono)',color:'var(--text-primary)',fontWeight:600}}>{progress}%</span>
          </div>
          <div style={{height:6,background:'var(--bg-elevated)',borderRadius:3,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${progress}%`,background:project.color,borderRadius:3,transition:'width 0.5s'}} />
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {['kanban','list','members'].map(tab => (
            <button key={tab} className={`tab-btn ${activeTab===tab?'active':''}`} onClick={()=>setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase()+tab.slice(1)}
              {tab === 'members' && <span style={{marginLeft:6,fontSize:'0.72rem',background:'var(--bg-elevated)',padding:'1px 6px',borderRadius:10}}>{members.length}</span>}
              {tab === 'list' && <span style={{marginLeft:6,fontSize:'0.72rem',background:'var(--bg-elevated)',padding:'1px 6px',borderRadius:10}}>{tasks.length}</span>}
            </button>
          ))}
        </div>

        {/* Kanban */}
        {activeTab === 'kanban' && (
          <div className="kanban-board">
            {STATUS_COLS.map(col => (
              <div key={col.key} className="kanban-col">
                <div className="kanban-col-header">
                  <div className="kanban-col-title">
                    <div className="dot" style={{background:col.color}} />
                    {col.label}
                  </div>
                  <div className="kanban-col-count">{tasksByStatus[col.key].length}</div>
                </div>
                <div className="kanban-tasks">
                  {tasksByStatus[col.key].map(task => {
                    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                    return (
                      <div key={task.id} className="kanban-card" style={isOverdue?{borderColor:'var(--red)'}:{}}>
                        <div className="kanban-card-title">{task.title}</div>
                        {task.description && <div style={{fontSize:'0.76rem',color:'var(--text-muted)',marginBottom:8,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{task.description}</div>}
                        <div className="kanban-card-footer">
                          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                          <div style={{display:'flex',gap:6,alignItems:'center'}}>
                            {task.assignee && (
                              <div className="member-avatar" style={{width:22,height:22,fontSize:'0.6rem',background:project.color+'33',color:project.color}} title={task.assignee.name}>
                                {getInitials(task.assignee.name)}
                              </div>
                            )}
                            <button style={{color:'var(--text-muted)',fontSize:'0.8rem',padding:'2px 6px',background:'var(--bg-surface)',borderRadius:4,border:'1px solid var(--border)'}}
                              onClick={()=>setTaskModal(task)}>✏</button>
                            <button style={{color:'var(--red)',fontSize:'0.8rem',padding:'2px 6px',background:'var(--red-bg)',borderRadius:4,border:'none'}}
                              onClick={()=>handleDeleteTask(task.id)}>✕</button>
                          </div>
                        </div>
                        {task.dueDate && (
                          <div style={{marginTop:6,fontSize:'0.72rem',color:isOverdue?'var(--red)':'var(--text-muted)'}}>
                            📅 {format(new Date(task.dueDate),'MMM d, yyyy')}
                          </div>
                        )}
                        {/* Quick status move */}
                        <div style={{marginTop:8,display:'flex',gap:4,flexWrap:'wrap'}}>
                          {STATUS_COLS.filter(s=>s.key!==col.key).map(s=>(
                            <button key={s.key} onClick={()=>handleStatusChange(task.id,s.key)}
                              style={{fontSize:'0.65rem',padding:'2px 6px',background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:4,color:'var(--text-muted)',cursor:'pointer'}}>
                              → {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {activeTab === 'list' && (
          <div className="card">
            {tasks.length === 0 ? (
              <div className="empty-state"><p>No tasks yet. Click "+ Task" to add one.</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => {
                      const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status!=='done';
                      return (
                        <tr key={task.id}>
                          <td style={{fontWeight:500,color:'var(--text-primary)'}}>{task.title}</td>
                          <td><span className={`badge badge-${task.status}`}>{task.status.replace('_',' ')}</span></td>
                          <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                          <td>{task.assignee?.name || <span style={{color:'var(--text-muted)'}}>—</span>}</td>
                          <td style={{color:isOverdue?'var(--red)':'inherit'}}>
                            {task.dueDate ? format(new Date(task.dueDate),'MMM d, yyyy') : '—'}
                          </td>
                          <td>
                            <div style={{display:'flex',gap:6}}>
                              <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>setTaskModal(task)}>✏</button>
                              <button className="btn btn-danger btn-sm btn-icon" onClick={()=>handleDeleteTask(task.id)}>✕</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Members */}
        {activeTab === 'members' && (
          <div className="card">
            {members.length === 0 ? (
              <div className="empty-state"><p>No members. Add members to collaborate.</p></div>
            ) : (
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th>{amProjectAdmin&&<th></th>}</tr></thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div className="user-avatar" style={{width:28,height:28,fontSize:'0.7rem',background:project.color+'33',color:project.color}}>{getInitials(m.name)}</div>
                          {m.name} {m.id === user.id && <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>(you)</span>}
                        </div>
                      </td>
                      <td>{m.email}</td>
                      <td><span className={`badge badge-${m.ProjectMember?.role||'member'}`}>{m.ProjectMember?.role||'member'}</span></td>
                      {amProjectAdmin && (
                        <td>
                          {m.id !== project.ownerId && (
                            <button className="btn btn-danger btn-sm" onClick={()=>handleRemoveMember(m.id)}>Remove</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {taskModal && (
        <TaskModal
          task={taskModal === 'create' ? null : taskModal}
          projectId={project.id}
          members={members}
          onClose={()=>setTaskModal(null)}
          onSaved={handleTaskSaved}
        />
      )}
      {memberModal && (
        <AddMemberModal
          projectId={project.id}
          existingIds={members.map(m=>m.id)}
          onClose={()=>setMemberModal(false)}
          onAdded={m=>setProject(prev=>({...prev,members:[...prev.members,m]}))}
        />
      )}
    </div>
  );
}
