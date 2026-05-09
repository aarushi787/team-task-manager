import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

function getInitials(name=''){return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);}
const COLORS = ['#4f8ef7','#e8a44a','#4ecb8c','#f26b6b','#b07ef8','#f0924e','#4ecbcb','#f07eb0'];
const getColor = (name='') => COLORS[name.charCodeAt(0)%COLORS.length];

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isAdmin, user: me } = useAuth();

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.users)).finally(() => setLoading(false));
  }, []);

  const updateRole = async (userId, role) => {
    const { data } = await api.put(`/users/${userId}/role`, { role });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: data.user.role } : u));
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Team</h1>
          <p>{users.length} member{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="page-body">
        <div className="filter-bar">
          <div className="search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="search-input" placeholder="Search members…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
          {filtered.map(u => (
            <div key={u.id} className="card" style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div className="user-avatar" style={{width:44,height:44,fontSize:'1rem',background:getColor(u.name)+'33',color:getColor(u.name)}}>
                  {getInitials(u.name)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:'0.95rem',display:'flex',alignItems:'center',gap:6}}>
                    {u.name}
                    {u.id === me.id && <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>(you)</span>}
                  </div>
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
                </div>
              </div>

              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span className={`badge badge-${u.role}`}>{u.role}</span>
                <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>
                  Joined {format(new Date(u.createdAt),'MMM yyyy')}
                </span>
              </div>

              {isAdmin && u.id !== me.id && (
                <div style={{borderTop:'1px solid var(--border)',paddingTop:10,display:'flex',gap:8}}>
                  <button
                    className={`btn btn-sm ${u.role==='admin'?'btn-secondary':'btn-secondary'}`}
                    style={{flex:1,fontSize:'0.78rem'}}
                    onClick={() => updateRole(u.id, u.role==='admin'?'member':'admin')}
                  >
                    {u.role === 'admin' ? '↓ Demote to Member' : '↑ Promote to Admin'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <h3>No members found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
