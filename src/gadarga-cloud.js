// Вэб сайт (Vercel + Supabase): Supabase-ийг тоглоомын хадгалалтын (db) ба хэрэглэгчийн (user) хэлбэрээр ажиллуулна.
// config.js дотор supabaseUrl, supabaseAnonKey байхгүй бол идэвхгүй бөгөөд тоглоом тухайн төхөөрөмж дээр офлайн ажиллана.
(function () {
  'use strict';
  const cfg = window.GADARGA_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase || !window.supabase.createClient) return;

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  let session = null;
  const C = window.GADARGA_CLOUD = {
    sb,
    session: async () => { const { data } = await sb.auth.getSession(); session = data.session || null; return session; },
    sendOtp: email => sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: location.origin } }),
    verifyOtp: (email, token) => sb.auth.verifyOtp({ email, token, type: 'email' }),
    signOut: () => sb.auth.signOut(),
    email: () => (session && session.user && session.user.email) || ''
  };
  sb.auth.onAuthStateChange((_e, s) => { session = s || null; });

  /* ---------- db: «цуглуулга/баримт» замтай JSON баримтуудыг public.docs хүснэгтэд хадгална ---------- */
  const split = p => { const a = String(p).split('/'); return { col: a.slice(0, -1).join('/'), id: a[a.length - 1] }; };
  const snap = (path, row) => ({
    id: String(path).split('/').pop(), exists: !!row,
    data: () => (row ? row.data : undefined), metadata: { fromCache: false, hasPendingWrites: false }
  });
  // Хамгаалалтын дүрмээр татгалзвал тоглоомд «эрх алга» гэж мэдэгдэнэ.
  const fail = e => ({ code: /row-level|policy|permission|violat|JWT|42501/i.test((e && (e.message + ' ' + e.code)) || '') ? 'invalid_argument' : 'unavailable', message: (e && e.message) || 'error' });

  const docL = {}, colL = {};
  const notify = path => {
    const { col } = split(path);
    (docL[path] || []).forEach(f => f());
    (colL[col] || []).forEach(f => f());
  };
  // Бусдын өөрчлөлтийг шууд хүлээн авна (Realtime). Холбогдохгүй бол 30 секунд тутам шинэчилнэ.
  sb.channel('gadarga-docs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'docs' }, p => {
      const row = (p.new && p.new.path) ? p.new : p.old;
      if (row && row.path) notify(row.path);
    })
    .subscribe();

  function doc(path) {
    const { col, id } = split(path);
    return {
      id, path,
      get: async () => {
        const { data, error } = await sb.from('docs').select('data').eq('path', path).maybeSingle();
        if (error) throw fail(error);
        return snap(path, data);
      },
      set: async d => {
        const { error } = await sb.from('docs').upsert({ path, col, doc_id: id, data: d, updated_at: new Date().toISOString() });
        if (error) throw fail(error);
        notify(path);
      },
      delete: async () => {
        const { error } = await sb.from('docs').delete().eq('path', path);
        if (error) throw fail(error);
        notify(path);
      },
      onSnapshot: (next, onErr) => {
        let alive = true;
        const run = () => sb.from('docs').select('data').eq('path', path).maybeSingle().then(({ data, error }) => {
          if (!alive) return;
          if (error) { if (onErr) onErr(fail(error)); return; }
          next(snap(path, data));
        });
        (docL[path] = docL[path] || []).push(run);
        run();
        const t = setInterval(run, 30000);
        return () => { alive = false; clearInterval(t); docL[path] = (docL[path] || []).filter(f => f !== run); };
      },
      collection: sub => coll(path + '/' + sub)
    };
  }

  function coll(col) {
    return {
      path: col,
      doc: id => doc(col + '/' + id),
      onSnapshot: (next, onErr) => {
        let alive = true, timer = 0;
        const fetchAll = () => sb.from('docs').select('path,data').eq('col', col).limit(1000).then(({ data, error }) => {
          if (!alive) return;
          if (error) { if (onErr) onErr(fail(error)); return; }
          const docs = (data || []).map(r => snap(r.path, r));
          next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } });
        });
        const run = () => { clearTimeout(timer); timer = setTimeout(fetchAll, 250); };
        (colL[col] = colL[col] || []).push(run);
        fetchAll();
        const t = setInterval(fetchAll, 30000);
        return () => { alive = false; clearInterval(t); colL[col] = (colL[col] || []).filter(f => f !== run); };
      }
    };
  }
  const db = { doc, collection: coll };

  /* ---------- user: нэвтэрсэн хүн ба багшийн эрх (public.teachers) ---------- */
  let teacher;
  const loadTeacher = async () => {
    if (teacher !== undefined) return teacher;
    const uid = session && session.user && session.user.id;
    if (!uid) return (teacher = null);
    const { data } = await sb.from('teachers').select('role').eq('user_id', uid).maybeSingle();
    return (teacher = data || null);
  };
  const user = {
    id: async () => (session && session.user && session.user.id) || null,
    isOwner: async () => { const t = await loadTeacher(); return !!(t && t.role === 'owner'); },
    canEdit: async () => !!(await loadTeacher()),
    can: async () => null,
    profiles: async ids => {
      const o = {};
      [].concat(ids).forEach(i => { o[i] = { id: i, name: '', avatarUrl: '', color: '#86c1e0', email: null, isMe: !!(session && i === session.user.id), guest: false }; });
      return o;
    }
  };

  // Тоглоомын код window.claude.use(...)-ээр хадгалалт, хэрэглэгчийг авдаг тул тэр хэлбэрийг дуурайна.
  window.claude = {
    use: async name => {
      await C.session();
      if (!session) return null;
      return name === 'db' ? db : name === 'user' ? user : null;
    }
  };
})();
