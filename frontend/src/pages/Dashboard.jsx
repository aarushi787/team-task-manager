import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';

const STATUS_COLORS = { todo: '#555670', in_progress: '#4f8ef7', review: '#b07ef8', done: '#4ecb8c' };
const PRIORITY_COLORS = { low: '#555670', medium: '#4f8ef7', high: '#f0924e', urgent: '#f26b6b' };

function StatCard({ value, label, color, bgColor, icon }) {
  return (
    <div className="stat-card" style={{'--stat-color': color, '--stat-bg': bgColor}}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function DueLabel({ dueDate }) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  const overdue = isPast(d);
  const soon = !overdue && isWithinInterval(d, { start: new Date(), end: addDays(new Date(), 2) });
  return (
    <span className={`due-date ${overdue ? 'overdue' : soon ? 'soon' : ''}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      {overdue ? `Overdue ${formatDistanceToNow(d, { addSuffix: true })}` : formatDistanceToNow(d, { addSuffix: true })}
    </span>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/tasks/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const { stats, recentTasks } = data || { stats: {}, recentTasks: [] };

  const pieData = [
    { name: 'To Do', value: stats.todo || 0 },
    { name: 'In Progress', value: stats.inProgress || 0 },
    { name: 'Review', value: stats.review || 0 },
    { name: 'Done', value: stats.done || 0 },
  ].filter(d => d.value > 0);

  const pieColors = ['#555670', '#4f8ef7', '#b07ef8', '#4ecb8c'];

  const barData = [
    { name: 'To Do', count: stats.todo || 0, fill: '#555670' },
    { name: 'In Progress', count: stats.inProgress || 0, fill: '#4f8ef7' },
    { name: 'Review', count: stats.review || 0, fill: '#b07ef8' },
    { name: 'Done', count: stats.done || 0, fill: '#4ecb8c' },
  ];

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name?.split(' ')[0]} 👋</p>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <StatCard value={stats.total ?? 0} label="Total Tasks" color="#e8a44a" bgColor="rgba(232,164,74,0.1)"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>} />
          <StatCard value={stats.inProgress ?? 0} label="In Progress" color="#4f8ef7" bgColor="rgba(79,142,247,0.1)"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>} />
          <StatCard value={stats.done ?? 0} label="Completed" color="#4ecb8c" bgColor="rgba(78,203,140,0.1)"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>} />
          <StatCard value={stats.overdue ?? 0} label="Overdue" color="#f26b6b" bgColor="rgba(242,107,107,0.1)"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} />
          <StatCard value={stats.myTasks ?? 0} label="Assigned to Me" color="#b07ef8" bgColor="rgba(176,126,248,0.1)"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
          <StatCard value={stats.review ?? 0} label="In Review" color="#b07ef8" bgColor="rgba(176,126,248,0.1)"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} />
        </div>

        {/* Charts + Recent Tasks */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24}}>
          <div className="card">
            <div className="card-header"><div className="card-title">Task Distribution</div></div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)',fontSize:'0.875rem'}}>No tasks yet</div>
            )}
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Tasks by Status</div></div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{top:0,right:0,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{fill:'var(--text-muted)',fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'var(--text-muted)',fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13}} cursor={{fill:'var(--bg-hover)'}} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View all →</button>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-state" style={{padding:'30px 20px'}}>
              <p>No tasks yet. Create a project to get started.</p>
            </div>
          ) : (
            <div className="task-list">
              {recentTasks.map(task => (
                <div key={task.id} className={`task-item ${task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'overdue' : ''}`}
                  onClick={() => navigate(`/projects/${task.projectId}`)}>
                  <div className="task-status-dot" style={{background: STATUS_COLORS[task.status]}} />
                  <div className="task-body">
                    <div className={`task-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</div>
                    <div className="task-meta">
                      <span className={`badge badge-${task.status}`}>{task.status.replace('_',' ')}</span>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.project && <span className="text-muted" style={{fontSize:'0.75rem'}}>📁 {task.project.name}</span>}
                      {task.assignee && <span className="text-muted" style={{fontSize:'0.75rem'}}>👤 {task.assignee.name}</span>}
                      <DueLabel dueDate={task.dueDate} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
