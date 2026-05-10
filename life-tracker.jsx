import { useState, useRef, useEffect } from "react";
import { get, set } from "idb-keyval";

const CATEGORIES = [
  { id: "health", label: "Health", icon: "🫀", color: "#e8d5b7" },
  { id: "food", label: "Food", icon: "🍽️", color: "#d4e8c2" },
  { id: "mood", label: "Mood", icon: "🌤", color: "#c2d4e8" },
  { id: "work", label: "Work", icon: "💼", color: "#e8c2d4" },
  { id: "fitness", label: "Fitness", icon: "🏃", color: "#d4c2e8" },
  { id: "social", label: "Social", icon: "🤝", color: "#e8e4c2" },
  { id: "travel", label: "Travel", icon: "✈️", color: "#c2e8e4" },
  { id: "other", label: "Other", icon: "📌", color: "#e8cec2" },
];

const formatDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};
const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

export default function LifeTracker() {
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("journal"); // journal | add | detail
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({ category: "health", title: "", note: "", photo: null, photoPreview: null });
  const fileRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const stored = await get('life-tracker-entries');
        if (stored) {
          setEntries(stored);
        }
      } catch (error) {
        console.error('Failed to load entries from IndexedDB:', error);
      } finally {
        setLoading(false);
        loadedRef.current = true;
      }
    };
    loadEntries();
  }, []);

  useEffect(() => {
    if (loadedRef.current) {
      const saveEntries = async () => {
        try {
          await set('life-tracker-entries', entries);
        } catch (error) {
          console.error('Failed to save entries to IndexedDB:', error);
        }
      };
      saveEntries();
    }
  }, [entries]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let { width, height } = img;
        const maxSize = 1600;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setForm((f) => ({ ...f, photo: resizedDataUrl, photoPreview: resizedDataUrl }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!form.title.trim()) return;
    const entry = {
      id: Date.now(),
      category: form.category,
      title: form.title,
      note: form.note,
      photo: form.photo,
      timestamp: Date.now(),
    };
    setEntries((prev) => [entry, ...prev]);
    setForm({ category: "health", title: "", note: "", photo: null, photoPreview: null });
    setView("journal");
  };

  const filtered = filterCat === "all" ? entries : entries.filter((e) => e.category === filterCat);

  const getCat = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[7];

  // Group by date
  const grouped = filtered.reduce((acc, e) => {
    const d = formatDate(e.timestamp);
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", background: "#f5f0e8", color: "#2a2016" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; }
        .app { max-width: 480px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
        .header { padding: 28px 24px 16px; border-bottom: 1.5px solid #d6c9b0; background: #f5f0e8; position: sticky; top: 0; z-index: 10; }
        .header-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; color: #1a1208; }
        .header-sub { font-family: 'DM Sans', sans-serif; font-size: 12px; color: #8a7a60; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px; }
        .nav { display: flex; gap: 6px; padding: 16px 24px 0; background: #f5f0e8; }
        .nav-btn { font-family: 'DM Sans', sans-serif; font-size: 12px; padding: 6px 14px; border-radius: 20px; border: 1.5px solid #c9b99a; background: transparent; cursor: pointer; color: #5a4a30; transition: all 0.18s; font-weight: 500; }
        .nav-btn.active { background: #2a2016; color: #f5f0e8; border-color: #2a2016; }
        .filter-bar { display: flex; gap: 8px; padding: 14px 24px; overflow-x: auto; scrollbar-width: none; background: #f5f0e8; }
        .filter-bar::-webkit-scrollbar { display: none; }
        .chip { font-family: 'DM Sans', sans-serif; font-size: 11px; padding: 5px 12px; border-radius: 20px; border: 1.5px solid #c9b99a; background: transparent; cursor: pointer; color: #5a4a30; white-space: nowrap; transition: all 0.15s; font-weight: 500; }
        .chip.active { background: #c9b99a; color: #1a1208; border-color: #c9b99a; }
        .content { flex: 1; padding: 0 24px 24px; overflow-y: auto; }
        .date-label { font-family: 'DM Sans', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #9a8a6a; padding: 20px 0 10px; border-bottom: 1px solid #d6c9b0; margin-bottom: 12px; }
        .entry-card { background: #fff; border-radius: 12px; padding: 0; margin-bottom: 12px; border: 1.5px solid #e2d9c8; overflow: hidden; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; box-shadow: 0 2px 8px rgba(42,32,22,0.04); }
        .entry-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(42,32,22,0.09); }
        .card-photo { width: 100%; height: 180px; object-fit: cover; display: block; }
        .card-body { padding: 14px 16px; }
        .card-cat { display: inline-flex; align-items: center; gap: 5px; font-family: 'DM Sans', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 500; color: #8a7a60; margin-bottom: 6px; }
        .cat-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .card-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: #1a1208; margin-bottom: 6px; line-height: 1.3; }
        .card-note { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #6a5a40; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .card-time { font-family: 'DM Sans', sans-serif; font-size: 11px; color: #a09080; margin-top: 8px; }
        .fab { position: fixed; bottom: 28px; right: calc(50% - 240px + 24px); width: 52px; height: 52px; border-radius: 50%; background: #2a2016; color: #f5f0e8; border: none; font-size: 24px; cursor: pointer; box-shadow: 0 4px 20px rgba(42,32,22,0.3); transition: transform 0.15s; display: flex; align-items: center; justify-content: center; z-index: 20; }
        .fab:hover { transform: scale(1.08); }
        .add-form { padding: 20px 24px; flex: 1; overflow-y: auto; }
        .form-section { margin-bottom: 22px; }
        .form-label { font-family: 'DM Sans', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8a7a60; margin-bottom: 8px; display: block; font-weight: 500; }
        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .cat-item { padding: 10px 6px; border-radius: 10px; border: 1.5px solid #e2d9c8; background: #fff; cursor: pointer; text-align: center; transition: all 0.15s; }
        .cat-item.selected { border-color: #2a2016; background: #2a2016; }
        .cat-item .icon { font-size: 20px; display: block; margin-bottom: 3px; }
        .cat-item .name { font-family: 'DM Sans', sans-serif; font-size: 9px; color: #5a4a30; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
        .cat-item.selected .name { color: #f5f0e8; }
        .input { width: 100%; padding: 12px 14px; border: 1.5px solid #d6c9b0; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 15px; background: #fff; color: #2a2016; outline: none; transition: border-color 0.15s; }
        .input:focus { border-color: #2a2016; }
        .textarea { width: 100%; padding: 12px 14px; border: 1.5px solid #d6c9b0; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; background: #fff; color: #2a2016; outline: none; resize: none; transition: border-color 0.15s; line-height: 1.6; min-height: 100px; }
        .textarea:focus { border-color: #2a2016; }
        .photo-upload { border: 2px dashed #c9b99a; border-radius: 12px; padding: 28px; text-align: center; cursor: pointer; background: #faf7f2; transition: background 0.15s; }
        .photo-upload:hover { background: #f0ebe0; }
        .photo-preview { width: 100%; border-radius: 12px; overflow: hidden; position: relative; }
        .photo-preview img { width: 100%; max-height: 200px; object-fit: cover; display: block; }
        .photo-remove { position: absolute; top: 8px; right: 8px; background: rgba(42,32,22,0.7); color: #fff; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .btn-primary { width: 100%; padding: 15px; background: #2a2016; color: #f5f0e8; border: none; border-radius: 12px; font-family: 'Playfair Display', serif; font-size: 16px; cursor: pointer; transition: opacity 0.15s; letter-spacing: 0.3px; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .back-btn { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #6a5a40; background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; gap: 4px; margin-bottom: 18px; }
        .detail-view { padding: 20px 24px; flex: 1; overflow-y: auto; }
        .detail-photo { width: 100%; max-height: 300px; object-fit: cover; border-radius: 14px; margin-bottom: 20px; }
        .detail-cat-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; }
        .detail-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: #1a1208; line-height: 1.2; margin-bottom: 8px; }
        .detail-time { font-family: 'DM Sans', sans-serif; font-size: 12px; color: #a09080; margin-bottom: 20px; }
        .detail-divider { border: none; border-top: 1px solid #e2d9c8; margin: 16px 0; }
        .detail-note-label { font-family: 'DM Sans', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8a7a60; margin-bottom: 10px; font-weight: 500; }
        .detail-note { font-family: 'Georgia', serif; font-size: 15px; line-height: 1.8; color: #3a2c18; }
        .empty { padding: 60px 24px; text-align: center; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title { font-family: 'Playfair Display', serif; font-size: 20px; color: #3a2c18; margin-bottom: 8px; }
        .empty-sub { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #9a8a6a; line-height: 1.6; }
        @media (max-width: 480px) { .fab { right: 24px; } }
      `}</style>

      <div className="app">
        {/* HEADER */}
        <div className="header">
          <div className="header-title">
            {view === "add" ? "New Entry" : view === "detail" ? "Entry" : "My Journal"}
          </div>
          <div className="header-sub">
            {view === "journal" ? `${entries.length} moment${entries.length !== 1 ? "s" : ""} recorded` : new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* NAV */}
        {view === "journal" && (
          <div className="nav">
            <button className={`nav-btn ${filterCat === "all" ? "active" : ""}`} onClick={() => setFilterCat("all")}>All</button>
          </div>
        )}

        {/* FILTER CHIPS */}
        {view === "journal" && (
          <div className="filter-bar">
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`chip ${filterCat === c.id ? "active" : ""}`} onClick={() => setFilterCat(filterCat === c.id ? "all" : c.id)}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        )}

        {/* JOURNAL VIEW */}
        {view === "journal" && (
          <div className="content">
            {loading ? (
              <div className="empty">
                <div className="empty-icon">⏳</div>
                <div className="empty-title">Loading your journal...</div>
                <div className="empty-sub">Please wait while we fetch your moments.</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📔</div>
                <div className="empty-title">Your story starts here</div>
                <div className="empty-sub">Tap the + button to log your first moment — a meal, a feeling, a memory.</div>
              </div>
            ) : (
              Object.entries(grouped).map(([date, dayEntries]) => (
                <div key={date}>
                  <div className="date-label">{date}</div>
                  {dayEntries.map((entry) => {
                    const cat = getCat(entry.category);
                    return (
                      <div key={entry.id} className="entry-card" onClick={() => { setSelectedEntry(entry); setView("detail"); }}>
                        {entry.photo && <img src={entry.photo} alt="" className="card-photo" />}
                        <div className="card-body">
                          <div className="card-cat">
                            <span className="cat-dot" style={{ background: cat.color, border: "1.5px solid #c9b99a" }} />
                            {cat.icon} {cat.label}
                          </div>
                          <div className="card-title">{entry.title}</div>
                          {entry.note && <div className="card-note">{entry.note}</div>}
                          <div className="card-time">{formatTime(entry.timestamp)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}

        {/* ADD VIEW */}
        {view === "add" && (
          <div className="add-form">
            <button className="back-btn" onClick={() => setView("journal")}>← Back</button>

            <div className="form-section">
              <span className="form-label">Category</span>
              <div className="cat-grid">
                {CATEGORIES.map((c) => (
                  <div key={c.id} className={`cat-item ${form.category === c.id ? "selected" : ""}`} onClick={() => setForm((f) => ({ ...f, category: c.id }))}>
                    <span className="icon">{c.icon}</span>
                    <span className="name">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <span className="form-label">Title</span>
              <input className="input" placeholder="What happened?" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>

            <div className="form-section">
              <span className="form-label">Photo (optional)</span>
              {form.photoPreview ? (
                <div className="photo-preview">
                  <img src={form.photoPreview} alt="preview" />
                  <button className="photo-remove" onClick={() => setForm((f) => ({ ...f, photo: null, photoPreview: null }))}>×</button>
                </div>
              ) : (
                <div className="photo-upload" onClick={() => fileRef.current.click()}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#8a7a60" }}>Tap to add a photo</div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
                </div>
              )}
            </div>

            <div className="form-section">
              <span className="form-label">Notes</span>
              <textarea className="textarea" placeholder="Add your thoughts, feelings, details..." value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} rows={4} />
            </div>

            <button className="btn-primary" onClick={handleAdd} disabled={!form.title.trim()}>
              Save Entry
            </button>
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === "detail" && selectedEntry && (() => {
          const cat = getCat(selectedEntry.category);
          return (
            <div className="detail-view">
              <button className="back-btn" onClick={() => setView("journal")}>← Back to journal</button>
              {selectedEntry.photo && <img src={selectedEntry.photo} alt="" className="detail-photo" />}
              <div className="detail-cat-badge" style={{ background: cat.color }}>
                {cat.icon} {cat.label}
              </div>
              <div className="detail-title">{selectedEntry.title}</div>
              <div className="detail-time">{formatDate(selectedEntry.timestamp)} · {formatTime(selectedEntry.timestamp)}</div>
              {selectedEntry.note && (
                <>
                  <hr className="detail-divider" />
                  <div className="detail-note-label">Notes</div>
                  <div className="detail-note">{selectedEntry.note}</div>
                </>
              )}
              <hr className="detail-divider" style={{ marginTop: 30 }} />
              <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#c06050", background: "none", border: "none", cursor: "pointer", padding: "8px 0" }}
                onClick={() => { setEntries((prev) => prev.filter((e) => e.id !== selectedEntry.id)); setView("journal"); }}>
                Delete entry
              </button>
            </div>
          );
        })()}

        {/* FAB */}
        {view === "journal" && (
          <button className="fab" onClick={() => setView("add")}>+</button>
        )}
      </div>
    </div>
  );
}
