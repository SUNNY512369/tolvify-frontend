import React, { useState, useRef, useEffect } from "react";
import {
  Home, Play, User, PlusSquare, Heart, MessageCircle, Share2,
  Bookmark, Search, X, Image as ImageIcon, Video, Zap, Volume2, VolumeX,
  Mail, Lock, LogOut, Loader2, Settings, Bell, Shield, Globe, Trash2,
  ChevronRight, Check, UserPlus, Flame, Send, ArrowLeft
} from "lucide-react";

const API_BASE = "https://73f66bd3-8cea-466c-bb50-f674376c52b5-00-258qwqohl8u35.pike.replit.dev/api";

const GRADIENTS = [
  "linear-gradient(135deg,#FF4D6D,#7C3AED)",
  "linear-gradient(135deg,#33D6A6,#2563EB)",
  "linear-gradient(135deg,#F2B84B,#FF4D6D)",
  "linear-gradient(135deg,#7C3AED,#33D6A6)",
  "linear-gradient(135deg,#2563EB,#F2B84B)",
  "linear-gradient(135deg,#FF4D6D,#F2B84B)",
];

const NAMES = ["Ayesha K.", "Bilal R.", "Zoya M.", "Hamza T.", "Sana W.", "Usman F.", "Mahnoor S.", "Ali Q."];

const seedPosts = Array.from({ length: 6 }).map((_, i) => ({
  id: "p" + i,
  user: NAMES[i % NAMES.length],
  time: `${i + 1}h`,
  caption: [
    "Sunset shoot came out better than expected 🌇",
    "New setup, same grind. Let's go.",
    "Karachi streets at night hit different.",
    "Three weeks of practice for this 15 seconds.",
    "Unpopular opinion: chai > coffee, always.",
    "Finally shipped the thing I've been building.",
  ][i],
  grad: GRADIENTS[i % GRADIENTS.length],
  likes: 120 + i * 37,
  comments: 8 + i * 3,
}));

const seedShorts = Array.from({ length: 5 }).map((_, i) => ({
  id: "s" + i,
  user: NAMES[(i + 3) % NAMES.length],
  caption: [
    "Wait for the drop 🔥",
    "POV: Monday motivation",
    "This trick took me 40 tries",
    "Rate this from 1-10",
    "Behind the scenes of yesterday's post",
  ][i],
  grad: GRADIENTS[(i + 2) % GRADIENTS.length],
  likes: 2400 + i * 512,
}));

const seedNotifications = [
  { id: "n1", type: "like", user: "Bilal R.", text: "aapke post ko like kiya", time: "5m", read: false },
  { id: "n2", type: "comment", user: "Zoya M.", text: 'aapke post par comment kiya: "Zabardast!"', time: "22m", read: false },
  { id: "n3", type: "follow", user: "Hamza T.", text: "aapko follow karna shuru kiya", time: "1h", read: false },
  { id: "n4", type: "like", user: "Sana W.", text: "aapke short video ko like kiya", time: "3h", read: true },
  { id: "n5", type: "comment", user: "Usman F.", text: 'aapke post par comment kiya: "Kamaal ka shot hai"', time: "6h", read: true },
];

const seedConversations = [
  {
    id: "c1",
    user: "Bilal R.",
    messages: [
      { id: "m1", from: "them", text: "Bhai wo video kamaal ki thi!", time: "10:02 AM" },
      { id: "m2", from: "me", text: "Shukriya! Kal aur ek post kar raha hoon", time: "10:05 AM" },
    ],
    unread: 1,
  },
  {
    id: "c2",
    user: "Zoya M.",
    messages: [{ id: "m3", from: "them", text: "Kal ka shoot kab hai?", time: "Yesterday" }],
    unread: 0,
  },
  {
    id: "c3",
    user: "Hamza T.",
    messages: [
      { id: "m4", from: "them", text: "Follow ho gaya, content bohat acha hai", time: "2d" },
      { id: "m5", from: "me", text: "Thankyou bhai 🙌", time: "2d" },
    ],
    unread: 0,
  },
];

function useLikeState(seedIds) {
  const [liked, setLiked] = useState(() => new Set());
  const toggle = (id) => {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  return [liked, toggle];
}

function Avatar({ name, size = 40 }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const idx = name.length % GRADIENTS.length;
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, background: GRADIENTS[idx] }}
    >
      {initials}
    </div>
  );
}

function PostCard({ post, liked, onLike, following, onFollow, extraComments, onOpenComments }) {
  const isLiked = liked.has(post.id);
  const isFollowing = following.has(post.user);
  const commentCount = post.comments + (extraComments?.length || 0);
  return (
    <article className="post-card">
      <div className="post-head">
        <Avatar name={post.user} />
        <div className="post-head-text">
          <span className="post-user">{post.user}</span>
          <span className="post-time">{post.time} ago</span>
        </div>
        <button
          className={"follow-btn" + (isFollowing ? " following" : "")}
          onClick={() => onFollow(post.user)}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>
      <p className="post-caption">{post.caption}</p>
      {post.mediaUrl ? (
        post.isVideo ? (
          <video src={post.mediaUrl} controls className="post-media post-media-real" />
        ) : (
          <img src={post.mediaUrl} alt="" className="post-media post-media-real" />
        )
      ) : (
        <div className="post-media" style={{ background: post.grad }} />
      )}
      <div className="post-actions">
        <button className={"icon-btn" + (isLiked ? " liked" : "")} onClick={() => onLike(post.id)}>
          <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          <span>{post.likes + (isLiked ? 1 : 0)}</span>
        </button>
        <button className="icon-btn" onClick={() => onOpenComments(post)}>
          <MessageCircle size={20} />
          <span>{commentCount}</span>
        </button>
        <button className="icon-btn">
          <Share2 size={20} />
        </button>
        <button className="icon-btn spacer-left">
          <Bookmark size={20} />
        </button>
      </div>
    </article>
  );
}

function CommentsModal({ post, comments, currentUser, onAddComment, onClose }) {
  const [text, setText] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(post.id, text.trim());
    setText("");
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal comments-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Comments</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="comments-list">
          {comments.length === 0 && (
            <p className="comments-empty">Abhi koi comment nahi — pehla comment aap karein!</p>
          )}
          {comments.map((c) => (
            <div className="comment-row" key={c.id}>
              <Avatar name={c.user} size={32} />
              <div>
                <span className="comment-user">{c.user}</span>
                <p className="comment-text">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="comment-form">
          <Avatar name={currentUser?.name || "You"} size={32} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(e)}
            placeholder="Comment likhein..."
          />
          <button type="button" onClick={submit} disabled={!text.trim()}>Post</button>
        </div>
      </div>
    </div>
  );
}

function ShortsView({ shorts, liked, onLike, following, onFollow }) {
  const [muted, setMuted] = useState(true);
  return (
    <div className="shorts-scroller">
      {shorts.map((s) => {
        const isLiked = liked.has(s.id);
        const isFollowing = following.has(s.user);
        return (
          <div className="short-card" key={s.id} style={{ background: s.mediaUrl ? "#000" : s.grad }}>
            {s.mediaUrl && s.isVideo ? (
              <video src={s.mediaUrl} className="short-video" autoPlay loop muted={muted} playsInline />
            ) : s.mediaUrl ? (
              <img src={s.mediaUrl} alt="" className="short-video" />
            ) : null}
            <button className="mute-btn" onClick={() => setMuted((m) => !m)}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {!s.mediaUrl && (
              <div className="short-play">
                <Play size={44} fill="white" />
              </div>
            )}
            <div className="short-rail">
              <button className={"rail-btn" + (isLiked ? " liked" : "")} onClick={() => onLike(s.id)}>
                <Heart size={26} fill={isLiked ? "currentColor" : "none"} />
                <span>{s.likes + (isLiked ? 1 : 0)}</span>
              </button>
              <button className="rail-btn">
                <MessageCircle size={26} />
                <span>Reply</span>
              </button>
              <button className="rail-btn">
                <Share2 size={26} />
                <span>Send</span>
              </button>
            </div>
            <div className="short-info">
              <div className="short-user-row">
                <Avatar name={s.user} size={34} />
                <span className="short-user">{s.user}</span>
                <button
                  className={"follow-btn ghost" + (isFollowing ? " following" : "")}
                  onClick={() => onFollow(s.user)}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
              <p className="short-caption">{s.caption}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProfileView({ posts, following, user }) {
  const displayName = user?.name || "You";
  const handle = "@" + displayName.toLowerCase().replace(/\s+/g, ".");
  return (
    <div className="profile-view">
      <div className="profile-cover" style={{ background: GRADIENTS[1] }} />
      <div className="profile-header">
        <Avatar name={displayName} size={84} />
        <div className="profile-meta">
          <h2>{displayName}</h2>
          <span className="handle">{handle}</span>
        </div>
      </div>
      <div className="profile-stats">
        <div><strong>{posts.length}</strong><span>Posts</span></div>
        <div><strong>4.2K</strong><span>Followers</span></div>
        <div><strong>{following.size}</strong><span>Following</span></div>
      </div>
      <p className="profile-bio">Visual stories from Karachi. Photography, short films, and everything in between.</p>
      <div className="profile-grid">
        {posts.map((p) => (
          <div key={p.id} className="grid-thumb" style={{ background: p.grad }} />
        ))}
      </div>
    </div>
  );
}

function UploadModal({ onClose, onPost }) {
  const [caption, setCaption] = useState("");
  const [type, setType] = useState("photo");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    if (f.type.startsWith("video/")) setType((t) => (t === "photo" ? "video" : t));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Create post</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="type-toggle">
          <button className={type === "photo" ? "active" : ""} onClick={() => setType("photo")}>
            <ImageIcon size={16} /> Photo
          </button>
          <button className={type === "video" ? "active" : ""} onClick={() => setType("video")}>
            <Video size={16} /> Video
          </button>
          <button className={type === "short" ? "active" : ""} onClick={() => setType("short")}>
            <Zap size={16} /> Short
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {!previewUrl && (
          <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon size={28} />
            <span>Photo ya video select karne ke liye tap karein</span>
          </div>
        )}

        {previewUrl && (
          <div className="upload-preview">
            {file?.type.startsWith("video/") ? (
              <video src={previewUrl} controls className="upload-preview-media" />
            ) : (
              <img src={previewUrl} alt="preview" className="upload-preview-media" />
            )}
            <button
              className="upload-preview-remove"
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
            >
              <X size={14} /> Remove
            </button>
          </div>
        )}

        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <button
          className="post-submit"
          disabled={!file}
          onClick={() => {
            onPost(caption || "New post", type, previewUrl, file?.type.startsWith("video/"));
            onClose();
          }}
        >
          {file ? "Share" : "Pehle media select karein"}
        </button>
      </div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Sahi email address daalein");
    if (password.length < 6) return setError("Password kam se kam 6 characters ka ho");
    if (mode === "signup" && !name.trim()) return setError("Apna naam daalein");

    setLoading(true);
    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const body =
        mode === "signup"
          ? { username: email.split("@")[0] + Date.now(), email, password, displayName: name }
          : { email, password };

      const res = await fetch(API_BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        return setError(data.error || "Kuch masla ho gaya, dobara try karein");
      }

      setLoading(false);
      onAuth({
        name: data.user.displayName || data.user.username,
        email,
        token: data.token,
        id: data.user.id,
      });
    } catch (err) {
      setLoading(false);
      setError("Server tak nahi pohanch paaye. Internet check karein.");
    }
  };

  return (
    <div className="auth-root">
      <style>{`
        .auth-root {
          --bg: #15121C; --surface: #201B29; --surface-2: #2A2333;
          --border: #322B3D; --text: #F3F0F7; --text-muted: #9B94A8;
          --accent: #FF4D6D; --accent-2: #33D6A6;
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: var(--bg); font-family: 'Inter', sans-serif; padding: 20px;
        }
        .auth-root * { box-sizing: border-box; }
        .auth-card {
          width: 100%; max-width: 380px; background: var(--surface);
          border: 1px solid var(--border); border-radius: 20px; padding: 32px 28px;
        }
        .auth-brand {
          font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700;
          text-align: center; margin-bottom: 4px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .auth-sub { text-align: center; color: var(--text-muted); font-size: 13px; margin-bottom: 26px; }
        .auth-tabs { display: flex; background: var(--surface-2); border-radius: 10px; padding: 4px; margin-bottom: 22px; }
        .auth-tabs button {
          flex: 1; padding: 8px; border: none; background: transparent; color: var(--text-muted);
          font-size: 13px; font-weight: 600; border-radius: 8px; cursor: pointer;
        }
        .auth-tabs button.active { background: var(--surface); color: var(--text); }
        .auth-field { margin-bottom: 14px; }
        .auth-field label { display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
        .auth-input {
          display: flex; align-items: center; gap: 8px;
          background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px;
          padding: 10px 12px;
        }
        .auth-input input {
          background: transparent; border: none; outline: none; color: var(--text);
          font-size: 14px; width: 100%;
        }
        .auth-input svg { color: var(--text-muted); flex-shrink: 0; }
        .auth-error { color: var(--accent); font-size: 12px; margin-bottom: 12px; }
        .auth-submit {
          width: 100%; padding: 12px; border-radius: 10px; border: none;
          background: var(--accent); color: white; font-weight: 600; font-size: 14px;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .auth-submit:disabled { opacity: 0.7; cursor: default; }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="auth-card">
        <div className="auth-brand">Tolvify</div>
        <div className="auth-sub">Create. Connect. Watch.</div>

        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Log In</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Sign Up</button>
        </div>

        <div>
          {mode === "signup" && (
            <div className="auth-field">
              <label>Naam</label>
              <div className="auth-input">
                <User size={16} />
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aapka naam" />
              </div>
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <div className="auth-input">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit(e)}
                placeholder="aap@example.com"
              />
            </div>
          </div>
          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input">
              <Lock size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit(e)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <div className="auth-error">⚠ {error}</div>}

          <button
            className="auth-submit"
            type="button"
            disabled={loading}
            onClick={submit}
          >
            {loading && <Loader2 size={16} className="spin" />}
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-row-text">
        <span className="setting-label">{label}</span>
        {sub && <span className="setting-sub">{sub}</span>}
      </div>
      <button className={"toggle" + (checked ? " on" : "")} onClick={() => onChange(!checked)}>
        <span className="toggle-knob" />
      </button>
    </div>
  );
}

function MessagesView({ conversations, activeId, onOpenChat, onBack, onSend, currentUser }) {
  const active = conversations.find((c) => c.id === activeId);
  const [draft, setDraft] = useState("");

  if (active) {
    const send = () => {
      if (!draft.trim()) return;
      onSend(active.id, draft.trim());
      setDraft("");
    };
    return (
      <div className="chat-view">
        <div className="chat-head">
          <button className="icon-btn" onClick={onBack}><ArrowLeft size={20} /></button>
          <Avatar name={active.user} size={34} />
          <span className="chat-head-name">{active.user}</span>
        </div>
        <div className="chat-messages">
          {active.messages.map((m) => (
            <div key={m.id} className={"chat-bubble-row" + (m.from === "me" ? " mine" : "")}>
              <div className="chat-bubble">
                <span>{m.text}</span>
                <span className="chat-bubble-time">{m.time}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message likhein..."
          />
          <button onClick={send} disabled={!draft.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dm-list">
      <h2 className="settings-title">Messages</h2>
      {conversations.map((c) => {
        const last = c.messages[c.messages.length - 1];
        return (
          <button key={c.id} className="dm-row" onClick={() => onOpenChat(c.id)}>
            <Avatar name={c.user} size={44} />
            <div className="dm-row-text">
              <span className="dm-row-name">{c.user}</span>
              <span className="dm-row-last">{last ? last.text : "Koi message nahi"}</span>
            </div>
            {c.unread > 0 && <span className="nav-badge">{c.unread}</span>}
          </button>
        );
      })}
    </div>
  );
}

function NotificationsView({ notifications, onMarkAllRead }) {


  const iconFor = (type) => {
    if (type === "like") return <Heart size={18} fill="currentColor" />;
    if (type === "comment") return <MessageCircle size={18} />;
    return <UserPlus size={18} />;
  };
  const colorFor = (type) => {
    if (type === "like") return "#FF4D6D";
    if (type === "comment") return "#3B82F6";
    return "#33D6A6";
  };
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="notif-view">
      <div className="notif-head">
        <h2 className="settings-title">Notifications</h2>
        {unread > 0 && (
          <button className="notif-markread" onClick={onMarkAllRead}>
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>
      <div className="settings-section notif-section">
        {notifications.map((n) => (
          <div key={n.id} className={"notif-row" + (n.read ? "" : " unread")}>
            <Avatar name={n.user} size={40} />
            <div className="notif-icon" style={{ color: colorFor(n.type) }}>
              {iconFor(n.type)}
            </div>
            <div className="notif-text">
              <span><strong>{n.user}</strong> {n.text}</span>
              <span className="notif-time">{n.time} ago</span>
            </div>
            {!n.read && <span className="notif-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ user, onLogout }) {
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);

  return (
    <div className="settings-view">
      <h2 className="settings-title">Settings</h2>

      <div className="settings-section">
        <span className="settings-heading">Account</span>
        <div className="setting-row">
          <div className="setting-row-text">
            <span className="setting-label">Name</span>
            <span className="setting-sub">{user?.name || "You"}</span>
          </div>
          <ChevronRight size={18} />
        </div>
        <div className="setting-row">
          <div className="setting-row-text">
            <span className="setting-label">Email</span>
            <span className="setting-sub">{user?.email || "not set"}</span>
          </div>
          <ChevronRight size={18} />
        </div>
        <div className="setting-row">
          <div className="setting-row-text">
            <span className="setting-label">Change password</span>
          </div>
          <ChevronRight size={18} />
        </div>
      </div>

      <div className="settings-section">
        <span className="settings-heading">Notifications</span>
        <ToggleRow label="Likes" sub="Jab koi aapke post ko like kare" checked={notifLikes} onChange={setNotifLikes} />
        <ToggleRow label="Comments" sub="Jab koi comment kare" checked={notifComments} onChange={setNotifComments} />
        <ToggleRow label="New followers" sub="Jab koi aapko follow kare" checked={notifFollows} onChange={setNotifFollows} />
      </div>

      <div className="settings-section">
        <span className="settings-heading">Privacy</span>
        <ToggleRow
          label="Private account"
          sub="Sirf followers hi aapke posts dekh sakein"
          checked={privateAccount}
          onChange={setPrivateAccount}
        />
      </div>

      <div className="settings-section">
        <span className="settings-heading">Playback</span>
        <ToggleRow label="Autoplay videos" sub="Feed scroll karte waqt video khud chale" checked={autoplay} onChange={setAutoplay} />
        <ToggleRow label="Data saver" sub="Kam quality mein videos chalayein (mobile data bachane ke liye)" checked={dataSaver} onChange={setDataSaver} />
      </div>

      <div className="settings-section">
        <span className="settings-heading">General</span>
        <div className="setting-row">
          <div className="setting-row-text">
            <span className="setting-label">Language</span>
            <span className="setting-sub">English</span>
          </div>
          <ChevronRight size={18} />
        </div>
        <div className="setting-row">
          <div className="setting-row-text">
            <span className="setting-label">Help & Support</span>
          </div>
          <ChevronRight size={18} />
        </div>
      </div>

      <div className="settings-section">
        <button className="setting-row danger-row" onClick={onLogout}>
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
        <button className="setting-row danger-row">
          <Trash2 size={18} />
          <span>Delete Account</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {

  const [user, setUser] = useState(null);
  const [view, setView] = useState("feed");
  const [posts, setPosts] = useState(seedPosts);
  const [shorts, setShorts] = useState(seedShorts);
  const [liked, toggleLike] = useLikeState();
  const [following, setFollowing] = useState(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [notifications, setNotifications] = useState(seedNotifications);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredPosts = searchQuery.trim()
    ? posts.filter(
        (p) =>
          p.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.user.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const [conversations, setConversations] = useState(seedConversations);
  const [activeChatId, setActiveChatId] = useState(null);
  const unreadMsgCount = conversations.reduce((sum, c) => sum + c.unread, 0);

  const openChat = (id) => {
    setActiveChatId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const sendMessage = (conversationId, text) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, { id: "m" + Date.now(), from: "me", text, time: "Abhi" }] }
          : c
      )
    );
  };

  const addComment = (postId, text) => {
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { id: "c" + Date.now(), user: user?.name || "You", text }],
    }));
  };

  const toggleFollow = (user) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      next.has(user) ? next.delete(user) : next.add(user);
      return next;
    });
  };

  const addPost = (caption, type, mediaUrl, isVideo) => {
    const grad = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
    if (type === "short") {
      setShorts((prev) => [
        { id: "s" + Date.now(), user: user?.name || "You", caption, grad, mediaUrl, isVideo, likes: 0 },
        ...prev,
      ]);
      setView("shorts");
    } else {
      setPosts((prev) => [
        {
          id: "p" + Date.now(),
          user: user?.name || "You",
          time: "now",
          caption,
          grad,
          mediaUrl,
          isVideo,
          likes: 0,
          comments: 0,
        },
        ...prev,
      ]);
      setView("feed");
    }
  };

  const navItems = [
    { key: "feed", icon: Home, label: "Home" },
    { key: "shorts", icon: Play, label: "Shorts" },
    { key: "upload", icon: PlusSquare, label: "Post" },
    { key: "messages", icon: Send, label: "Messages", badge: unreadMsgCount },
    { key: "notifications", icon: Bell, label: "Notifications", badge: unreadCount },
    { key: "profile", icon: User, label: "Profile" },
    { key: "settings", icon: Settings, label: "Settings" },
  ];

  if (!user) {
    return <AuthScreen onAuth={setUser} />;
  }

  return (
    <div className="app-root">
      <style>{`
        .app-root {
          --bg: #15121C;
          --surface: #201B29;
          --surface-2: #2A2333;
          --border: #322B3D;
          --text: #F3F0F7;
          --text-muted: #9B94A8;
          --accent: #FF4D6D;
          --accent-2: #33D6A6;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          max-width: 100%;
          box-sizing: border-box;
        }
        .app-root * { box-sizing: border-box; }
        .app-root h1, .app-root h2, .app-root h3 {
          font-family: 'Space Grotesk', 'Inter', sans-serif;
          margin: 0;
        }
        .sidebar {
          width: 220px;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .brand {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 28px;
          padding-left: 8px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 12px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s, color 0.15s;
        }
        .nav-item:hover { background: var(--surface); color: var(--text); }
        .nav-item.active { background: var(--surface-2); color: var(--text); }
        .nav-item { position: relative; }
        .nav-item.active svg { color: var(--accent); }
        .logout-item { margin-top: auto; color: #E8546E; }
        .nav-badge {
          margin-left: auto; background: var(--accent); color: white; font-size: 11px;
          font-weight: 700; padding: 1px 7px; border-radius: 10px;
        }
        .nav-badge-mobile {
          margin: 0; position: absolute; top: 2px; right: calc(50% - 16px);
          width: 8px; height: 8px; padding: 0; border-radius: 50%;
        }
        .notif-view { padding-bottom: 20px; }
        .notif-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .notif-head .settings-title { margin-bottom: 0; }
        .notif-markread {
          display: flex; align-items: center; gap: 6px; background: none; border: 1px solid var(--border);
          color: var(--text-muted); font-size: 12px; padding: 6px 12px; border-radius: 20px; cursor: pointer;
        }
        .notif-section { padding: 6px; }
        .notif-row {
          display: flex; align-items: center; gap: 12px; padding: 12px 10px;
          border-radius: 10px; position: relative;
        }
        .notif-row.unread { background: var(--surface-2); }
        .notif-icon {
          width: 28px; height: 28px; border-radius: 50%; background: var(--bg);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .notif-text { display: flex; flex-direction: column; gap: 2px; font-size: 13px; line-height: 1.4; }
        .notif-text strong { font-weight: 600; }
        .notif-time { font-size: 11px; color: var(--text-muted); }
        .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); margin-left: auto; flex-shrink: 0; }
        .dm-list { padding-bottom: 20px; }
        .dm-row {
          display: flex; align-items: center; gap: 12px; width: 100%;
          background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
          padding: 12px 14px; margin-bottom: 10px; cursor: pointer; text-align: left; color: var(--text);
        }
        .dm-row-text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
        .dm-row-name { font-size: 14px; font-weight: 600; }
        .dm-row-last {
          font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; max-width: 220px;
        }
        .chat-view { display: flex; flex-direction: column; height: calc(100vh - 48px); }
        .chat-head { display: flex; align-items: center; gap: 10px; padding-bottom: 14px; border-bottom: 1px solid var(--border); }
        .chat-head-name { font-size: 15px; font-weight: 600; }
        .chat-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 16px 4px; }
        .chat-bubble-row { display: flex; }
        .chat-bubble-row.mine { justify-content: flex-end; }
        .chat-bubble {
          max-width: 75%; background: var(--surface-2); border-radius: 14px; padding: 9px 13px;
          display: flex; flex-direction: column; gap: 3px;
        }
        .chat-bubble-row.mine .chat-bubble { background: var(--accent); color: white; }
        .chat-bubble span:first-child { font-size: 13px; line-height: 1.4; }
        .chat-bubble-time { font-size: 10px; opacity: 0.65; align-self: flex-end; }
        .chat-input-row { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border); }
        .chat-input-row input {
          flex: 1; background: var(--surface-2); border: 1px solid var(--border); border-radius: 20px;
          padding: 10px 14px; color: var(--text); font-size: 14px; outline: none;
        }
        .chat-input-row button {
          background: var(--accent); border: none; color: white; width: 40px; height: 40px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
        }
        .chat-input-row button:disabled { opacity: 0.5; cursor: default; }
        .main {
          flex: 1;
          min-width: 0;
          padding: 24px 16px 90px;
          max-width: 620px;
          margin: 0 auto;
          width: 100%;
        }
        .top-search {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 20px;
          color: var(--text-muted);
        }
        .top-search input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 14px;
          width: 100%;
        }
        .clear-search { background: none; border: none; color: var(--text-muted); cursor: pointer; flex-shrink: 0; }
        .trending-row { margin-bottom: 20px; }
        .trending-label {
          display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600;
          color: var(--text-muted); margin-bottom: 10px;
        }
        .trending-label svg { color: var(--accent); }
        .trending-chips { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
        .trending-chip {
          flex-shrink: 0; width: 130px; height: 80px; border-radius: 12px; padding: 10px;
          display: flex; flex-direction: column; justify-content: flex-end; color: white;
        }
        .trending-chip span:first-child { font-size: 12px; font-weight: 600; }
        .trending-chip-likes { font-size: 11px; opacity: 0.85; }
        .no-results { color: var(--text-muted); font-size: 13px; text-align: center; padding: 30px 0; }
        .post-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 18px;
        }
        .post-head { display: flex; align-items: center; gap: 10px; }
        .avatar {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }
        .post-head-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .post-user { font-size: 14px; font-weight: 600; }
        .post-time { font-size: 12px; color: var(--text-muted); }
        .follow-btn {
          border: 1px solid var(--accent);
          background: transparent;
          color: var(--accent);
          font-size: 13px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .follow-btn.following { border-color: var(--border); color: var(--text-muted); }
        .follow-btn.ghost { border-color: rgba(255,255,255,0.6); color: white; }
        .follow-btn.ghost.following { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.7); }
        .post-caption { font-size: 14px; line-height: 1.5; margin: 12px 0; color: var(--text); }
        .post-media { height: 280px; border-radius: 12px; }
        .post-actions { display: flex; align-items: center; gap: 18px; margin-top: 12px; }
        .icon-btn {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; color: var(--text-muted);
          cursor: pointer; font-size: 13px; padding: 4px;
        }
        .icon-btn.liked { color: var(--accent); }
        .icon-btn.spacer-left { margin-left: auto; }
        .shorts-scroller {
          height: calc(100vh - 32px);
          max-width: 380px;
          margin: 0 auto;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          border-radius: 20px;
        }
        .short-card {
          height: calc(100vh - 32px);
          scroll-snap-align: start;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          overflow: hidden;
        }
        .short-play { color: rgba(255,255,255,0.85); opacity: 0.9; }
        .mute-btn {
          position: absolute; top: 16px; right: 16px;
          background: rgba(0,0,0,0.35); border: none; color: white;
          border-radius: 50%; width: 34px; height: 34px; cursor: pointer;
        }
        .short-rail {
          position: absolute; right: 12px; bottom: 90px;
          display: flex; flex-direction: column; gap: 18px; align-items: center;
        }
        .rail-btn {
          background: none; border: none; color: white; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          font-size: 11px;
        }
        .rail-btn.liked { color: var(--accent); }
        .short-info { position: absolute; left: 16px; right: 70px; bottom: 20px; color: white; }
        .short-user-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .short-user { font-weight: 600; font-size: 14px; }
        .short-caption { font-size: 13px; line-height: 1.4; opacity: 0.95; }
        .profile-view { padding-bottom: 20px; }
        .profile-cover { height: 120px; border-radius: 16px; margin-bottom: -42px; }
        .profile-header { display: flex; align-items: flex-end; gap: 14px; padding: 0 12px; }
        .profile-meta h2 { font-size: 19px; }
        .handle { font-size: 13px; color: var(--text-muted); }
        .profile-stats {
          display: flex; gap: 28px; padding: 18px 12px; border-bottom: 1px solid var(--border);
          margin-bottom: 14px;
        }
        .profile-stats div { display: flex; flex-direction: column; font-size: 13px; color: var(--text-muted); }
        .profile-stats strong { font-size: 16px; color: var(--text); }
        .profile-bio { padding: 0 12px; font-size: 14px; color: var(--text-muted); margin-bottom: 16px; }
        .profile-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 0 12px; }
        .grid-thumb { aspect-ratio: 1; border-radius: 8px; }
        .settings-view { padding-bottom: 20px; }
        .settings-title { font-size: 22px; margin-bottom: 20px; }
        .settings-section {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 6px 16px; margin-bottom: 16px;
        }
        .settings-heading {
          display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.02em;
          color: var(--text-muted); padding: 12px 0 6px;
        }
        .setting-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 0; border-top: 1px solid var(--border);
          background: none; border-left: none; border-right: none; border-bottom: none;
          width: 100%; text-align: left; cursor: pointer; color: var(--text);
        }
        .settings-section .setting-row:first-of-type { border-top: none; }
        .setting-row-text { display: flex; flex-direction: column; gap: 2px; }
        .setting-label { font-size: 14px; font-weight: 500; }
        .setting-sub { font-size: 12px; color: var(--text-muted); }
        .setting-row svg { color: var(--text-muted); flex-shrink: 0; }
        .danger-row { color: var(--accent); gap: 10px; }
        .danger-row svg { color: var(--accent); }
        .toggle {
          width: 42px; height: 24px; border-radius: 12px; border: none;
          background: var(--border); position: relative; cursor: pointer; flex-shrink: 0;
          transition: background 0.15s;
        }
        .toggle.on { background: var(--accent); }
        .toggle-knob {
          position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
          border-radius: 50%; background: white; transition: left 0.15s;
        }
        .toggle.on .toggle-knob { left: 20px; }
        .comments-modal { max-width: 440px; display: flex; flex-direction: column; max-height: 80vh; }
        .comments-list { overflow-y: auto; max-height: 45vh; margin-bottom: 14px; display: flex; flex-direction: column; gap: 14px; }
        .comments-empty { color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0; }
        .comment-row { display: flex; gap: 10px; align-items: flex-start; }
        .comment-user { font-size: 13px; font-weight: 600; }
        .comment-text { font-size: 13px; color: var(--text); margin: 2px 0 0; line-height: 1.4; }
        .comment-form { display: flex; align-items: center; gap: 10px; border-top: 1px solid var(--border); padding-top: 14px; }
        .comment-form input {
          flex: 1; background: var(--surface-2); border: 1px solid var(--border); border-radius: 20px;
          padding: 9px 14px; color: var(--text); font-size: 13px; outline: none;
        }
        .comment-form button {
          background: none; border: none; color: var(--accent); font-weight: 600; font-size: 13px; cursor: pointer;
        }
        .comment-form button:disabled { color: var(--text-muted); cursor: default; }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center; z-index: 50;
          padding: 16px;
        }
        .modal {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 18px; padding: 20px; width: 100%; max-width: 420px;
        }
        .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .type-toggle { display: flex; gap: 8px; margin-bottom: 14px; }
        .type-toggle button {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 9px; border-radius: 10px; border: 1px solid var(--border);
          background: transparent; color: var(--text-muted); font-size: 13px; cursor: pointer;
        }
        .type-toggle button.active { background: var(--surface-2); color: var(--text); border-color: var(--accent); }
        .drop-zone {
          border: 1.5px dashed var(--border); border-radius: 12px; padding: 28px 12px;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          color: var(--text-muted); font-size: 13px; margin-bottom: 14px; text-align: center;
          cursor: pointer;
        }
        .upload-preview { position: relative; margin-bottom: 14px; }
        .upload-preview-media {
          width: 100%; max-height: 240px; object-fit: cover; border-radius: 12px; display: block;
        }
        .upload-preview-remove {
          position: absolute; top: 8px; right: 8px; display: flex; align-items: center; gap: 4px;
          background: rgba(0,0,0,0.6); border: none; color: white; font-size: 11px;
          padding: 5px 9px; border-radius: 20px; cursor: pointer;
        }
        .post-media-real { object-fit: cover; width: 100%; background: #000; }
        .post-submit:disabled { opacity: 0.5; cursor: default; }
        .short-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        textarea {
          width: 100%; background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 10px; padding: 10px 12px; color: var(--text); font-size: 14px;
          resize: none; min-height: 70px; margin-bottom: 14px; font-family: inherit;
        }
        .post-submit {
          width: 100%; padding: 11px; border-radius: 10px; border: none;
          background: var(--accent); color: white; font-weight: 600; font-size: 14px; cursor: pointer;
        }
        @media (max-width: 720px) {
          .sidebar { display: none; }
          .main { padding-bottom: 76px; max-width: 100%; }
          .bottom-nav {
            position: fixed; bottom: 0; left: 0; right: 0;
            display: flex; justify-content: space-around;
            background: var(--surface); border-top: 1px solid var(--border);
            padding: 10px 0 14px;
          }
          .bottom-nav button {
            background: none; border: none; color: var(--text-muted); cursor: pointer;
          }
          .bottom-nav button.active { color: var(--accent); }
        }
        @media (min-width: 721px) {
          .bottom-nav { display: none; }
        }
      `}</style>

      <nav className="sidebar">
        <div className="brand">Tolvify</div>
        {navItems.map((item) => (
          <button
            key={item.key}
            className={"nav-item" + (view === item.key ? " active" : "")}
            onClick={() => (item.key === "upload" ? setShowUpload(true) : setView(item.key))}
          >
            <item.icon size={19} />
            {item.label}
            {!!item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
        <button className="nav-item logout-item" onClick={() => setUser(null)}>
          <LogOut size={19} />
          Log Out
        </button>
      </nav>

      <main className="main">
        {view === "feed" && (
          <>
            <div className="top-search">
              <Search size={16} />
              <input
                placeholder="Search Tolvify"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery("")}>
                  <X size={14} />
                </button>
              )}
            </div>

            {!searchQuery && (
              <div className="trending-row">
                <div className="trending-label">
                  <Flame size={15} /> Trending now
                </div>
                <div className="trending-chips">
                  {[...posts]
                    .sort((a, b) => b.likes - a.likes)
                    .slice(0, 3)
                    .map((p) => (
                      <div key={p.id} className="trending-chip" style={{ background: p.grad }}>
                        <span>{p.user}</span>
                        <span className="trending-chip-likes">{p.likes} likes</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {filteredPosts.length === 0 && (
              <p className="no-results">"{searchQuery}" ke liye koi post nahi mila</p>
            )}

            {filteredPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                liked={liked}
                onLike={toggleLike}
                following={following}
                onFollow={toggleFollow}
                extraComments={commentsByPost[p.id]}
                onOpenComments={setActiveCommentsPost}
              />
            ))}
          </>
        )}
        {view === "shorts" && (
          <ShortsView shorts={shorts} liked={liked} onLike={toggleLike} following={following} onFollow={toggleFollow} />
        )}
        {view === "profile" && <ProfileView posts={posts} following={following} user={user} />}
        {view === "settings" && <SettingsView user={user} onLogout={() => setUser(null)} />}
        {view === "notifications" && (
          <NotificationsView notifications={notifications} onMarkAllRead={markAllRead} />
        )}
        {view === "messages" && (
          <MessagesView
            conversations={conversations}
            activeId={activeChatId}
            onOpenChat={openChat}
            onBack={() => setActiveChatId(null)}
            onSend={sendMessage}
            currentUser={user}
          />
        )}
      </main>

      <div className="bottom-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={view === item.key ? "active" : ""}
            onClick={() => (item.key === "upload" ? setShowUpload(true) : setView(item.key))}
          >
            <item.icon size={22} />
            {!!item.badge && <span className="nav-badge nav-badge-mobile" />}
          </button>
        ))}
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onPost={addPost} />}
      {activeCommentsPost && (
        <CommentsModal
          post={activeCommentsPost}
          comments={commentsByPost[activeCommentsPost.id] || []}
          currentUser={user}
          onAddComment={addComment}
          onClose={() => setActiveCommentsPost(null)}
        />
      )}
    </div>
  );
}
