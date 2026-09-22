'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { 
  Bot, Power, Shield, PlusCircle, HelpCircle, 
  BookOpen, LogOut, CheckCircle, RefreshCw, Calendar, Trash2, Edit3, XCircle, ArchiveRestore
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminDashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [config, setConfig] = useState({ is_active: true, chat_scope: 'both' });
  const [knowledgeEntries, setKnowledgeEntries] = useState<any[]>([]);
  const [unresolvedQueries, setUnresolvedQueries] = useState<any[]>([]);
  const [scheduledReminders, setScheduledReminders] = useState<any[]>([]);
  
  const [newContent, setNewContent] = useState('');
  const [course, setCourse] = useState('General');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Auth guard: verify session before rendering dashboard
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      setAuthChecked(true);
      fetchData();
    };
    checkAuth();

    // Listen for auth state changes (e.g. token expiry)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Config
      const { data: cfg, error: cfgErr } = await supabase.from('bot_config').select('is_active, chat_scope').eq('id', 1).maybeSingle();
      if (cfgErr) console.error('[Dashboard] Config fetch error:', cfgErr.message);
      if (cfg) setConfig(cfg);

      // 2. Knowledge Entries
      const { data: kb } = await supabase.from('knowledge_entries').select('*').order('created_at', { ascending: false });
      if (kb) setKnowledgeEntries(kb);

      // 3. Unresolved Queries
      const { data: unres } = await supabase.from('unresolved_queries').select('*').eq('is_resolved', false).order('asked_at', { ascending: false });
      if (unres) setUnresolvedQueries(unres);

      // 4. Scheduled Reminders
      const { data: rem } = await supabase.from('scheduled_reminders').select('*').order('created_at', { ascending: false });
      if (rem) setScheduledReminders(rem);

    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (fields: Partial<typeof config>) => {
    const previousConfig = { ...config };
    const updated = { ...config, ...fields };
    setConfig(updated);
    setStatusMsg('Synchronizing master controls...');
    const { error } = await supabase.from('bot_config').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) {
      console.error('[Dashboard] Config update error:', error.message, error.details, error.hint);
      setStatusMsg(`⚠️ Update failed: ${error.message}${error.hint ? ' — ' + error.hint : ''}`);
      // Revert optimistic update
      setConfig(previousConfig);
      setTimeout(() => setStatusMsg(''), 6000);
    } else {
      setStatusMsg('Master settings updated live via Realtime!');
      setTimeout(() => setStatusMsg(''), 2500);
    }
  };


  const saveKnowledge = async () => {
    if (!newContent.trim()) {
      setStatusMsg('⚠️ Please enter Q&A / guideline content before publishing.');
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }

    if (editingId) {
      setStatusMsg('Updating Knowledge Base entry...');
      const { error } = await supabase
        .from('knowledge_entries')
        .update({ course_name: course, content: newContent })
        .eq('id', editingId);

      if (error) {
        setStatusMsg(`⚠️ Update failed: ${error.message}`);
      } else {
        setStatusMsg('✅ Knowledge entry updated successfully! Bot context refreshed.');
        setEditingId(null);
        setNewContent('');
      }
    } else {
      setStatusMsg('Publishing to Knowledge Base...');
      const { error } = await supabase
        .from('knowledge_entries')
        .insert({ course_name: course, content: newContent });

      if (error) {
        setStatusMsg(`⚠️ Publish failed: ${error.message}`);
      } else {
        setStatusMsg('✅ Published! Bot context updated.');
        setNewContent('');
      }
    }

    fetchData();
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const startEditKnowledge = (entry: any) => {
    setEditingId(entry.id);
    setCourse(entry.course_name || 'General');
    setNewContent(entry.content || '');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewContent('');
    setCourse('General');
  };

  const deleteKnowledge = async (id: number) => {
    await supabase.from('knowledge_entries').delete().eq('id', id);
    if (editingId === id) {
      cancelEdit();
    }
    fetchData();
  };

  const toggleKnowledgeActive = async (id: number, currentlyActive: boolean) => {
    await supabase.from('knowledge_entries').update({ is_active: !currentlyActive }).eq('id', id);
    setStatusMsg(currentlyActive ? '📦 Entry archived.' : '♻️ Entry reactivated!');
    fetchData();
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const resolveQuery = async (id: number, question: string) => {
    setNewContent(`Q: ${question}\nA: `);
    await supabase.from('unresolved_queries').update({ is_resolved: true }).eq('id', id);
    fetchData();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };
  // Block render until auth is verified — prevents dashboard flash for unauthenticated users
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-slate-500">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-100">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              PodPal BOT <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Production</span>
            </h1>
            <p className="text-xs text-slate-400">UniPods METI AI Cohort Management Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="max-w-6xl mx-auto mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Controls */}
        <div className="space-y-6">
          
          {/* Master Kill Switch Card */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Power className="w-5 h-5 text-emerald-400" />
                <h2 className="font-semibold text-sm">Master Kill Switch</h2>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${config.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            </div>
            <p className="text-xs text-slate-400 mb-5">Instantly suspend or activate bot responses across all WhatsApp DMs and groups.</p>
            <button
              onClick={() => updateConfig({ is_active: !config.is_active })}
              className={`w-full py-3 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 ${
                config.is_active 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>Status: {config.is_active ? 'BOT ACTIVE (ONLINE)' : 'BOT OFFLINE (SUSPENDED)'}</span>
            </button>
          </div>

          {/* Scope Selector Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Shield className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-sm">Operational Scope</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">Control whether the bot responds in group chats or private DMs only.</p>
            
            <div className="space-y-3">
              <button
                onClick={() => updateConfig({ chat_scope: 'private_only' })}
                className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all ${
                  config.chat_scope === 'private_only'
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-300 font-semibold'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                🔒 Private DMs Only
              </button>

              <button
                onClick={() => updateConfig({ chat_scope: 'both' })}
                className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all ${
                  config.chat_scope === 'both'
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-300 font-semibold'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                🌐 DMs & Groups (Mention & Quote-Reply)
              </button>

              <button
                onClick={() => updateConfig({ chat_scope: 'group_deactivated' })}
                className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all ${
                  config.chat_scope === 'group_deactivated'
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-300 font-semibold'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                🔕 Private DMs Active & Group Quiet (Reactions & DM Redirect)
              </button>
            </div>
          </div>

          {/* Scheduled Reminders Overview */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Calendar className="w-5 h-5 text-purple-400" />
              <h2 className="font-semibold text-sm">Scheduled Reminders ({scheduledReminders.length})</h2>
            </div>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {scheduledReminders.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No scheduled group reminders.</p>
              ) : (
                scheduledReminders.map(rem => (
                  <div key={rem.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-slate-200">{rem.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${rem.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                        {rem.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Scheduled for: {new Date(rem.scheduled_for).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: FAQ Publisher & Ingestion */}
        <div className="lg:col-span-2 space-y-6">

          {/* Knowledge Publisher */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                {editingId ? <Edit3 className="w-5 h-5 text-blue-400" /> : <PlusCircle className="w-5 h-5 text-emerald-400" />}
                <h2 className="font-semibold text-sm">
                  {editingId ? 'Edit Grounded Knowledge Entry' : 'Publish Grounded FAQ / Meeting Update'}
                </h2>
              </div>
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Edit</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Category Track</label>
                <select 
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  className="w-full glass-input text-xs"
                >
                  <option value="General">General / All Cohort Tracks</option>
                  <option value="MIT">MIT Universal AI Track</option>
                  <option value="Wadhwani">Wadhwani Ignite Track</option>
                  <option value="Ethiopia AI">Ethiopia AI Institute Track</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Q&A / Transcript / Guideline Markdown Content</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Paste clean Q&A pairs, meeting action points, or submission instructions here..."
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={saveKnowledge}
                  className={`glass-button text-xs flex items-center gap-2 ${editingId ? 'bg-blue-600/30 border-blue-500/50 hover:bg-blue-600/40 text-blue-200' : ''}`}
                >
                  {editingId ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                  <span>{editingId ? 'Update Knowledge Base Entry' : 'Publish to Grounded Knowledge Base'}</span>
                </button>
                {editingId && (
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Unresolved Questions (Log on Miss) */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <h2 className="font-semibold text-sm">Unresolved User Queries ({unresolvedQueries.length})</h2>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {unresolvedQueries.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No unresolved user queries logged.</p>
              ) : (
                unresolvedQueries.map(unres => (
                  <div key={unres.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-medium text-slate-200">{unres.question}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Sender: {unres.sender_jid} • Asked: {new Date(unres.asked_at).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => resolveQuery(unres.id, unres.question)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold shrink-0 transition-colors"
                    >
                      Resolve & Draft
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Knowledge Base Entries Browser */}
        <div className="lg:col-span-3">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h2 className="font-semibold text-sm">
                  Knowledge Base Entries ({knowledgeEntries.filter((e: any) => e.is_active !== false).length} active{knowledgeEntries.filter((e: any) => e.is_active === false).length > 0 ? ` / ${knowledgeEntries.filter((e: any) => e.is_active === false).length} archived` : ''})
                </h2>
              </div>
              <span className="text-xs text-slate-400">Click edit icon to load content into editor</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
              {knowledgeEntries.map(entry => (
                <div 
                  key={entry.id} 
                  className={`p-4 rounded-xl border text-xs relative group transition-all ${
                    editingId === entry.id
                      ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/5'
                      : entry.is_active === false
                        ? 'bg-slate-950/30 border-slate-800/40 opacity-50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                        {entry.course_name}
                      </span>
                      {entry.is_active === false && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                          Archived
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {entry.is_active === false ? (
                        <button
                          onClick={() => toggleKnowledgeActive(entry.id, false)}
                          className="text-slate-400 hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-slate-900"
                          title="Reactivate Entry"
                        >
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => startEditKnowledge(entry)}
                          className="text-slate-400 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-slate-900"
                          title="Edit Entry"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteKnowledge(entry.id)}
                        className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-900"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className={`whitespace-pre-wrap leading-relaxed max-h-32 overflow-hidden text-ellipsis ${entry.is_active === false ? 'text-slate-500' : 'text-slate-300'}`}>{entry.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
