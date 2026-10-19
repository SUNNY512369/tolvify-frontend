import React, { useState, useRef, useEffect } from "react";
import {
  Home, Play, Pause, User, PlusSquare, Heart, MessageCircle, Share2,
  Bookmark, Search, X, Image as ImageIcon, Video, Zap, Volume2, VolumeX,
  Mail, Lock, LogOut, Loader2, Settings, Bell, Shield, Globe, Trash2,
  ChevronRight, Check, UserPlus, Flame, Send, ArrowLeft, Sparkles, Eye, Camera, Maximize2, Minimize2
} from "lucide-react";
import VideoControls from "./VideoControls";

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

function timeAgo(dateStr) {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return Math.max(1, minutes) + "m";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h";
  return Math.floor(hours / 24) + "d";
}

function notificationFromApi(n) {
  let text;
  if (n.type === "like") {
    text = n.video ? "aapke video ko like kiya" : n.short ? "aapke short video ko like kiya" : "aapke post ko like kiya";
  } else if (n.type === "comment") {
    text = (n.video ? "aapke video par" : n.short ? "aapke short video par" : "aapke post par") + ' comment kiya: "' + (n.text || "") + '"';
  } else {
    text = "aapko follow karna shuru kiya";
  }
  return {
    id: n._id,
    type: n.type,
    user: (n.actor && (n.actor.name || n.actor.username)) || "Someone",
    text,
    time: timeAgo(n.createdAt),
    read: Boolean(n.read),
  };
}

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
  return [liked, toggle, setLiked];
}

function countValue(value) {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "number") return value;
  if (value && typeof value.count === "number") return value.count;
  return 0;
}

function isEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function normalizePost(post, index = 0, fallback = {}) {
  const author =
    post.author ||
    (post.user && typeof post.user === "object" && post.user) ||
    fallback.user ||
    {};
  const media = post.media && typeof post.media === "object" ? post.media : {};
  const type = String(post.mediaType || post.type || media.type || fallback.type || "").toLowerCase();
  const mediaString = typeof post.media === "string" ? post.media : "";
  const videoUrl = post.videoUrl || media.videoUrl || (type === "video" ? mediaString : "");
  const videoField = typeof post.video === "string" ? post.video : "";
  const imageField = typeof post.image === "string" ? post.image : "";
  const mediaUrl =
    post.mediaUrl ||
    post.imageUrl ||
    post.videoUrl ||
    videoField ||
    imageField ||
    post.url ||
    post.fileUrl ||
    media.url ||
    mediaString ||
    fallback.mediaUrl ||
    "";
  const thumbnailUrl = post.thumbnailUrl || media.thumbnailUrl || fallback.thumbnailUrl || "";
  const comments = post.comments ?? post.commentsCount ?? post.commentCount;
  const commentList = Array.isArray(comments) ? comments : Array.isArray(post.commentList) ? post.commentList : [];
  const displayName = [
    author.name,
    author.username,
    author.displayName,
    typeof post.user === "string" ? post.user : "",
    typeof fallback.user === "string" ? fallback.user : "",
    post.username,
  ].find((value) => typeof value === "string" && value.trim() && !isEmailAddress(value))?.trim()
    || "Unknown creator";
  const createdAt = post.createdAt || post.created_at || post.timestamp;
  const postTime = createdAt
    ? new Date(createdAt).toLocaleDateString()
    : post.time || "Just now";

  return {
    id: String(post._id || post.id || fallback.id || `post-${index}`),
    user: displayName,
    userId: String(author._id ?? author.id ?? post.userId ?? ""),
    avatarUrl: author.profilePicture || author.profileImageUrl || author.avatarUrl || author.avatar || "",
    time: postTime,
    caption: post.caption ?? fallback.caption ?? "",
    grad: GRADIENTS[index % GRADIENTS.length],
    mediaUrl: mediaUrl || fallback.mediaUrl || "",
    thumbnailUrl,
    isVideo: Boolean(videoUrl) || type === "video" || type === "short" ||
      /\.(mp4|mov|webm|m4v)(?:$|[?#])/i.test(mediaUrl) || Boolean(fallback.isVideo),
    likes: countValue(post.likesCount ?? post.likes ?? post.likeCount),
    comments: countValue(post.commentsCount ?? post.commentCount ?? comments),
    commentsList: commentList.map((comment, commentIndex) => {
      const commentUser = comment.user && typeof comment.user === "object" ? comment.user : {};
      return {
        id: String(comment._id || comment.id || `post-${index}-comment-${commentIndex}`),
        user: commentUser.username || commentUser.displayName || comment.username ||
          (typeof comment.user === "string" ? comment.user : "User"),
        text: comment.text || comment.content || "",
      };
    }),
    isLiked: Boolean(post.liked ?? post.isLiked ?? post.likedByCurrentUser),
    saved: Boolean(post.saved ?? fallback.saved),
  };
}

function syncPostFlags(posts, setLiked, setSavedPostIds) {
  const postIds = new Set(posts.map((post) => post.id));
  setLiked((previous) => {
    const next = new Set(previous);
    postIds.forEach((id) => next.delete(id));
    posts.forEach((post) => {
      if (post.isLiked) next.add(post.id);
    });
    return next;
  });
  setSavedPostIds((previous) => {
    const next = new Set(previous);
    postIds.forEach((id) => next.delete(id));
    posts.forEach((post) => {
      if (post.saved) next.add(post.id);
    });
    return next;
  });
}

function extractPostList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.posts)) return data.posts;
  if (Array.isArray(data?.savedPosts)) return data.savedPosts;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.posts)) return data.data.posts;
  return [];
}

function normalizeShort(short, index = 0) {
  const account =
    (short.user && typeof short.user === "object" && short.user) ||
    short.uploader ||
    {};
  const userName =
    (typeof short.user === "string" && short.user) ||
    account.displayName ||
    account.name ||
    account.username ||
    short.username ||
    "User";
  const commentsList = Array.isArray(short.comments)
    ? short.comments.map((comment, commentIndex) => ({
        id: comment._id || comment.id || `comment-${commentIndex}`,
        user: comment.user?.displayName ||
          comment.user?.username ||
          comment.username ||
          (typeof comment.user === "string" ? comment.user : "User"),
        text: comment.text || comment.content || "",
      }))
    : [];

  return {
    id: String(short._id || short.id || `s${index}`),
    user: userName,
    avatarUrl:
      account.profilePicture ||
      account.profileImageUrl ||
      account.avatarUrl ||
      account.avatar ||
      short.avatarUrl ||
      short.uploader?.profilePicture ||
      short.uploader?.avatarUrl ||
      "",
    caption: short.caption || "",
    grad: GRADIENTS[index % GRADIENTS.length],
    mediaUrl: short.videoUrl || short.url || short.mediaUrl || "",
    isVideo: true,
    likes: countValue(short.likes),
    commentsCount: countValue(short.comments),
    commentsList,
    views: countValue(short.views),
  };
}

function Avatar({ name, size = 40, imageUrl, initialOnly = false }) {
  const initials = initialOnly
    ? name.slice(0, 1).toUpperCase()
    : name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const idx = name.length % GRADIENTS.length;
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, background: GRADIENTS[idx] }}
    >
      {imageUrl ? <img className="avatar-image" src={imageUrl} alt="" /> : initials}
    </div>
  );
}

function PostCard({
  post, liked, onLike, following, onFollow, onOpenComments, currentUserId,
  saved, saving, onSave, onShare, isDetailView = false,
}) {
  const isLiked = liked.has(post.id);
  const isFollowing = following.has(post.userId);
  const postAuthorId = String(post.userId ?? "").trim();
  const viewerId = String(currentUserId ?? "").trim();
  const isOwnPost = Boolean(postAuthorId && viewerId && postAuthorId === viewerId);
  const detailVideoRef = useRef(null);
  const [detailVideoPlaying, setDetailVideoPlaying] = useState(false);
  const toggleDetailVideo = () => {
    const video = detailVideoRef.current;
    if (!video) return;
    if (video.paused) {
      const playRequest = video.play();
      if (playRequest && typeof playRequest.catch === "function") {
        playRequest.catch(() => setDetailVideoPlaying(false));
      }
    } else {
      video.pause();
    }
  };
  return (
    <article className="post-card">
      <div className="post-head">
        <Avatar name={post.user} imageUrl={post.avatarUrl} initialOnly />
        <div className="post-head-text">
          <span className="post-user">{post.user}</span>
          <span className="post-time">{post.time}</span>
        </div>
        {!isOwnPost && (
          <button
            className={"follow-btn" + (isFollowing ? " following" : "")}
            onClick={() => onFollow(post.userId)}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
      <p className="post-caption">{post.caption}</p>
      {post.mediaUrl ? (
        post.isVideo ? (
          isDetailView ? (
            <div className="post-detail-video-wrap" style={{ position: "relative" }}>
              <video
                ref={detailVideoRef}
                src={post.mediaUrl}
                playsInline
                className="post-media post-media-real"
                onClick={toggleDetailVideo}
                onPlay={() => setDetailVideoPlaying(true)}
                onPause={() => setDetailVideoPlaying(false)}
                onEnded={() => setDetailVideoPlaying(false)}
              />
              <button
                type="button"
                className={"post-video-toggle" + (detailVideoPlaying ? " is-playing" : "")}
                onClick={toggleDetailVideo}
                aria-label={detailVideoPlaying ? "Pause video" : "Play video"}
                aria-pressed={detailVideoPlaying}
              >
                {detailVideoPlaying
                  ? <Pause size={30} fill="currentColor" />
                  : <Play size={30} fill="currentColor" />}
              </button>
              <VideoControls videoRef={detailVideoRef} showCenter={false} />
            </div>
          ) : (
            <video src={post.mediaUrl} controls className="post-media post-media-real" />
          )
        ) : (
          <img src={post.mediaUrl} alt="" className="post-media post-media-real" />
        )
      ) : <div className="post-media post-media-missing">Media unavailable</div>}
      <div className="post-actions">
        <button className={"icon-btn" + (isLiked ? " liked" : "")} onClick={() => onLike(post.id)}>
          <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          <span>{post.likes}</span>
        </button>
        <button className="icon-btn" onClick={() => onOpenComments(post)}>
          <MessageCircle size={20} />
          <span>{post.comments}</span>
        </button>
        <button className="icon-btn" onClick={() => onShare(post)} aria-label="Share post">
          <Share2 size={20} />
        </button>
        <button
          className={"icon-btn spacer-left" + (saved ? " saved" : "")}
          onClick={() => onSave(post)}
          disabled={saving}
          aria-label={saved ? "Remove saved post" : "Save post"}
          title={saved ? "Saved" : "Save"}
        >
          <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}

function CommentsModal({ post, comments, currentUser, onAddComment, onClose, isPost = false }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!text.trim() || (isPost && submitting)) return;
    if (!isPost) {
      onAddComment(post.id, text.trim());
      setText("");
      return;
    }

    setSubmitting(true);
    setError("");
    Promise.resolve(onAddComment(post.id, text.trim()))
      .then(() => {
      setText("");
      })
      .catch((err) => setError(err.message || "Could not post your comment. Please try again."))
      .finally(() => setSubmitting(false));
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
        {isPost && error && <p className="comment-error" role="alert">{error}</p>}
        <div className="comment-form">
          <Avatar name={currentUser?.name || "You"} size={32} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(e)}
            disabled={isPost && submitting}
            placeholder="Comment likhein..."
          />
          <button type="button" onClick={submit} disabled={!text.trim() || (isPost && submitting)}>
            {isPost && submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShortCard({
  s,
  isLiked,
  onLike,
  isFollowing,
  onFollow,
  muted,
  setMuted,
  onOpenComments,
  commentCount,
  onView,
  onShare,
  isActive,
  isSparks,
}) {
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const onViewRef = useRef(onView);
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      onViewRef.current(s.id);
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive, s.id]);

  useEffect(() => {
    onViewRef.current = onView;
  }, [onView]);

  useEffect(() => {
    if (!isSparks) return undefined;
    const syncFullscreen = () => {
      const fullscreen = document.fullscreenElement === cardRef.current;
      setIsFullscreen(fullscreen);
      if (!fullscreen) {
        try {
          window.screen.orientation?.unlock?.();
        } catch (error) {
          // Orientation unlock is not supported in every browser.
        }
      }
    };
    const video = videoRef.current;
    const handleNativeFullscreenStart = () => setIsFullscreen(true);
    const handleNativeFullscreenEnd = () => {
      setIsFullscreen(false);
      try {
        window.screen.orientation?.unlock?.();
      } catch (error) {
        // Orientation unlock is not supported in every browser.
      }
    };

    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    video?.addEventListener("webkitbeginfullscreen", handleNativeFullscreenStart);
    video?.addEventListener("webkitendfullscreen", handleNativeFullscreenEnd);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
      video?.removeEventListener("webkitbeginfullscreen", handleNativeFullscreenStart);
      video?.removeEventListener("webkitendfullscreen", handleNativeFullscreenEnd);
    };
  }, [isSparks]);

  const openFullscreen = async () => {
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video) return;

    try {
      if (document.fullscreenElement === card) {
        await document.exitFullscreen();
        return;
      }
      if (card.requestFullscreen) {
        await card.requestFullscreen({ navigationUI: "hide" });
      } else if (video.requestFullscreen) {
        await video.requestFullscreen({ navigationUI: "hide" });
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      } else {
        return;
      }
      if (isHorizontal) {
        try {
          await window.screen.orientation?.lock?.("landscape");
        } catch (error) {
          // Some platforms only rotate fullscreen video automatically.
        }
      }
    } catch (error) {
      console.error("Spark fullscreen failed:", error);
    }
  };

  return (
    <article
      ref={cardRef}
      className={"short-card" + (isSparks ? " sparks-card" : "")}
      style={{ background: "#000" }}
      data-short-id={s.id}
    >
      {s.mediaUrl && s.isVideo ? (
        <video
          ref={videoRef}
          src={s.mediaUrl}
          className={
            "short-video" +
            (isSparks ? (isHorizontal ? " spark-video-horizontal" : " spark-video-vertical") : "")
          }
          autoPlay={isActive}
          loop
          muted={muted}
          playsInline
          preload={isActive ? "auto" : "metadata"}
          onLoadedMetadata={(event) => {
            const { videoWidth, videoHeight } = event.currentTarget;
            setIsHorizontal(videoWidth > videoHeight);
          }}
        />
      ) : s.mediaUrl ? (
        <img src={s.mediaUrl} alt="" className="short-video" />
      ) : (
        <div className="short-unavailable">This video is unavailable.</div>
      )}
      {s.mediaUrl && s.isVideo && <VideoControls videoRef={videoRef} />}
      {s.mediaUrl && (
        <button
          className="mute-btn"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute video" : "Mute video"}
          title={muted ? "Unmute video" : "Mute video"}
        >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}
      <div className="short-rail">
        <button className={"rail-btn" + (isLiked ? " liked" : "")} onClick={() => onLike(s.id)}>
          <Heart size={26} fill={isLiked ? "currentColor" : "none"} />
          <span>{s.likes + (isLiked ? 1 : 0)}</span>
        </button>
        <button className="rail-btn" onClick={() => onOpenComments(s)}>
          <MessageCircle size={26} />
          <span>{commentCount > 0 ? commentCount : "Reply"}</span>
        </button>
        <button className="rail-btn" onClick={() => onShare(s)} aria-label="Share video">
          <Share2 size={26} />
          <span>Send</span>
        </button>
        {isSparks && s.mediaUrl && s.isVideo && (
          <button
            className="rail-btn fullscreen-rail-btn"
            onClick={openFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Open video fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Open video fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={25} /> : <Maximize2 size={25} />}
            <span>{isFullscreen ? "Exit" : "Full screen"}</span>
          </button>
        )}
      </div>
      <div className="short-info">
        <div className="short-user-row">
          <Avatar name={s.user} size={34} imageUrl={s.avatarUrl} />
          <span className="short-user">{s.user}</span>
          <button
            className={"follow-btn ghost" + (isFollowing ? " following" : "")}
            onClick={() => onFollow(s.user)}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>
        <p className="short-caption">{s.caption}</p>
        {s.views > 0 && <span className="short-views"><Eye size={13} /> {s.views.toLocaleString()} views</span>}
      </div>
    </article>
  );
}

function ShortsView({
  shorts,
  liked,
  onLike,
  following,
  onFollow,
  commentsByShort,
  onOpenComments,
  onView,
  onShare,
  loading,
  error,
  onRetry,
  isSparks = false,
  onCreate,
}) {
  const [muted, setMuted] = useState(true);
  const [activeShortId, setActiveShortId] = useState(shorts[0]?.id || null);
  const scrollerRef = useRef(null);
  const shortIdsKey = shorts.map((short) => short.id).join("|");

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || shorts.length === 0) {
      setActiveShortId(null);
      return undefined;
    }

    setActiveShortId((current) => (shorts.some((short) => short.id === current) ? current : shorts[0].id));
    if (!("IntersectionObserver" in window)) {
      setActiveShortId(shorts[0].id);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveShortId(visible.target.dataset.shortId);
      },
      { root: scroller, threshold: [0.25, 0.6, 0.85] }
    );
    scroller.querySelectorAll(".short-card[data-short-id]").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [shortIdsKey]);

  return (
    <div
      ref={scrollerRef}
      className={"shorts-scroller" + (isSparks ? " sparks-scroller" : "")}
      aria-label={isSparks ? "Sparks video feed" : "Reels video feed"}
    >
      {isSparks && (
        <div className="sparks-topbar">
          <div className="sparks-title"><Sparkles size={19} /> Sparks</div>
          <button className="sparks-create" onClick={onCreate}>
            <PlusSquare size={17} /> Create
          </button>
        </div>
      )}
      {loading && <div className="shorts-status"><Loader2 size={20} className="spin" /> Loading videos…</div>}
      {error && (
        <div className="shorts-status shorts-status-error">
          <span>{error}</span>
          <button onClick={onRetry}>Try again</button>
        </div>
      )}
      {!loading && !error && shorts.length === 0 && (
        <div className="shorts-status shorts-status-empty">
          <Sparkles size={26} />
          <strong>No Sparks yet</strong>
          <span>Share a 15–60 second video to start the feed.</span>
          {isSparks && <button onClick={onCreate}>Create a Spark</button>}
        </div>
      )}
      {shorts.map((s) => (
        <ShortCard
          key={s.id}
          s={s}
          isLiked={liked.has(s.id)}
          onLike={onLike}
          isFollowing={following.has(s.user)}
          onFollow={onFollow}
          muted={muted}
          setMuted={setMuted}
          onOpenComments={onOpenComments}
          commentCount={s.commentsCount + (commentsByShort[s.id] || []).length}
          onView={onView}
          onShare={onShare}
          isActive={activeShortId === s.id}
          isSparks={isSparks}
        />
      ))}
    </div>
  );
}

function SparksUploadView({ token, onBack, onShortUploaded }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [duration, setDuration] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectVideo = (selectedFile, input) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("video/")) {
      setError("Choose a video file to create a Spark.");
      input.value = "";
      return;
    }
    setFile(selectedFile);
    setDuration(null);
    setError("");
    setPreviewUrl(URL.createObjectURL(selectedFile));
    input.value = "";
  };

  const handleMetadata = (event) => {
    const seconds = event.currentTarget.duration;
    setDuration(seconds);
    if (!Number.isFinite(seconds) || seconds < 15 || seconds > 60) {
      setError("Video must be between 15 and 60 seconds.");
    } else {
      setError("");
    }
  };

  const upload = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Choose or record a video first.");
      return;
    }
    if (!Number.isFinite(duration)) {
      setError("Wait for the video duration to finish loading.");
      return;
    }
    if (duration < 15 || duration > 60) {
      setError("Video must be between 15 and 60 seconds.");
      return;
    }
    if (!token) {
      setError("Please sign in again before uploading.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("caption", caption.trim());
      const response = await fetch(API_BASE + "/shorts/upload", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Upload failed. Please try again.");
        return;
      }
      onShortUploaded(data.short || data, caption.trim());
    } catch (uploadError) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="spark-upload-view">
      <div className="spark-upload-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to Sparks">
          <ArrowLeft size={20} />
        </button>
        <h2>Create a Spark</h2>
      </div>
      <form className="spark-upload-form" onSubmit={upload}>
        <input
          ref={galleryInputRef}
          type="file"
          accept="video/*"
          className="visually-hidden"
          onChange={(event) => selectVideo(event.target.files?.[0], event.target)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="visually-hidden"
          onChange={(event) => selectVideo(event.target.files?.[0], event.target)}
        />
        {!previewUrl ? (
          <div className="spark-picker">
            <Sparkles size={30} />
            <strong>Share a moment</strong>
            <span>Choose a video or record one now. Videos must be 15–60 seconds.</span>
            <div className="spark-picker-actions">
              <button type="button" onClick={() => galleryInputRef.current?.click()}>
                <Video size={17} /> Choose from gallery
              </button>
              <button type="button" onClick={() => cameraInputRef.current?.click()}>
                <Camera size={17} /> Record a video
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="spark-upload-preview">
              <video
                src={previewUrl}
                controls
                playsInline
                onLoadedMetadata={handleMetadata}
                onError={() => setError("Could not read this video's duration. Choose another video.")}
              />
              <button
                type="button"
                className="spark-change-video"
                onClick={() => galleryInputRef.current?.click()}
              >
                Change video
              </button>
            </div>
            <div className="spark-duration">
              {duration === null ? "Checking video duration…" : `Duration: ${duration.toFixed(1)}s (15–60s)`}
            </div>
          </>
        )}
        <label className="spark-caption-label" htmlFor="spark-caption">Caption</label>
        <textarea
          id="spark-caption"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Add a caption…"
          maxLength={2200}
        />
        {error && <p className="spark-upload-error" role="alert">{error}</p>}
        <button
          className="post-submit spark-submit"
          type="submit"
          disabled={uploading || !file || !Number.isFinite(duration) || duration < 15 || duration > 60}
        >
          {uploading ? "Uploading…" : "Share Spark"}
        </button>
      </form>
    </section>
  );
}

function ProfileView({
  posts, savedPosts, profileTab, onTabChange, following, user, followersCount, followingCount,
  loading, error, onRetry, savedLoading, savedError, onSavedRetry, onOpenPost, onLogout,
}) {
  const displayName = user?.name || "You";
  const handle = "@" + (user?.username || displayName.toLowerCase().replace(/\s+/g, "."));
  const showingSaved = profileTab === "saved";
  const visiblePosts = showingSaved ? savedPosts : posts;
  const visibleLoading = showingSaved ? savedLoading : loading;
  const visibleError = showingSaved ? savedError : error;
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
        <div><strong>{followersCount ?? 0}</strong><span>Followers</span></div>
        <div><strong>{followingCount ?? following.size}</strong><span>Following</span></div>
      </div>
      <ProfileChannel user={user} onLogout={onLogout} />
      <div className="profile-tabs" role="tablist" aria-label="Profile posts">
        <button
          type="button"
          role="tab"
          aria-selected={!showingSaved}
          className={!showingSaved ? "active" : ""}
          onClick={() => onTabChange("posts")}
        >
          Posts
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={showingSaved}
          className={showingSaved ? "active" : ""}
          onClick={() => onTabChange("saved")}
        >
          Saved
        </button>
      </div>
      <div className="profile-grid">
        {visiblePosts.map((p) => (
          <button
            key={p.id}
            type="button"
            className="grid-thumb"
            onClick={() => onOpenPost(p)}
            aria-label={`Open post by ${p.user}`}
          >
            {p.mediaUrl && (p.isVideo
              ? p.thumbnailUrl
                ? <img src={p.thumbnailUrl} alt="" loading="lazy" />
                : <video src={p.mediaUrl} poster={p.thumbnailUrl || undefined} muted playsInline preload="metadata" />
              : <img src={p.thumbnailUrl || p.mediaUrl} alt="" loading="lazy" />)}
            {p.isVideo && (
              <span className="grid-video-play" aria-hidden="true">
                <span className="grid-video-play-circle"><Play size={19} fill="currentColor" /></span>
              </span>
            )}
            <span className="grid-thumb-username">{p.user}</span>
          </button>
        ))}
      </div>
      {visibleLoading && <p className="profile-posts-status">{showingSaved ? "Loading saved posts…" : "Loading your posts…"}</p>}
      {visibleError && <div className="profile-posts-status profile-posts-error" role="alert">
        <span>{visibleError}</span><button type="button" onClick={showingSaved ? onSavedRetry : onRetry}>Retry</button>
      </div>}
      {!visibleLoading && !visibleError && visiblePosts.length === 0 && (
        <p className="profile-posts-status">{showingSaved ? "No saved posts yet" : "No posts yet"}</p>
      )}
    </div>
  );
}

function UploadModal({ onClose, onPost, onShortUploaded, onOpenVideoUpload, token, user }) {
  const [caption, setCaption] = useState("");
  const [type, setType] = useState("photo");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setError("");
    setVideoDuration(null);
    setPreviewUrl(URL.createObjectURL(f));
    if (f.type.startsWith("video/")) setType((t) => (t === "photo" ? "video" : t));
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setVideoDuration(null);
    setError("");
  };

  const handleSubmit = async () => {
    if (!file) return;

    if (type === "short") {
      const isVideoFile = file.type.startsWith("video/");
      if (isVideoFile) {
        if (videoDuration === null) {
          setError("Video load ho raha hai, thora sa intezar karein");
          return;
        }
        if (videoDuration < 15 || videoDuration > 60) {
          setError("Short video ki length 15 se 60 second ke darmiyan honi chahiye");
          return;
        }
      }

      setUploading(true);
      setError("");
      try {
        const formData = new FormData();
        formData.append("video", file);
        formData.append("caption", caption || "");

        const res = await fetch(API_BASE + "/shorts/upload", {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          setUploading(false);
          setError(data.error || "Upload fail ho gaya, dobara try karein");
          return;
        }

        setUploading(false);
        onShortUploaded(data.short || data, caption);
        onClose();
      } catch (err) {
        setUploading(false);
        setError("Server tak nahi pohanch paye. Internet check karein.");
      }
      return;
    }

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("media", file);
      formData.append("caption", caption);
      const res = await fetch(API_BASE + "/posts/upload", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not upload your post. Please try again.");

      const createdPost = data.post || data.data?.post || data.data || data;
      onPost(createdPost, {
        id: `uploaded-${Date.now()}`,
        caption,
        type,
        mediaUrl: previewUrl,
        isVideo: file.type.startsWith("video/"),
        user: {
          username: user?.username || user?.name || "You",
          displayName: user?.name || "You",
          id: user?.id,
        },
      });
      onClose();
    } catch (err) {
      setError(err.message || "Could not upload your post. Please try again.");
    } finally {
      setUploading(false);
    }
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

        {onOpenVideoUpload && (
          <button type="button" className="vup-entry" onClick={onOpenVideoUpload}>
            <Video size={16} /> Lambi video upload karein (title, category, community)
          </button>
        )}
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
              <video
                src={previewUrl}
                controls
                className="upload-preview-media"
                onLoadedMetadata={(e) => setVideoDuration(e.target.duration)}
              />
            ) : (
              <img src={previewUrl} alt="preview" className="upload-preview-media" />
            )}
            <button className="upload-preview-remove" onClick={removeFile}>
              <X size={14} /> Remove
            </button>
          </div>
        )}

        {type === "short" && file?.type.startsWith("video/") && videoDuration !== null && (
          <p style={{ fontSize: 12, color: videoDuration < 15 || videoDuration > 60 ? "#FF4D6D" : "#9B94A8", marginTop: -8, marginBottom: 12 }}>
            Duration: {videoDuration.toFixed(1)}s (15-60s zaroori hai)
          </p>
        )}

        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {error && <p style={{ color: "#FF4D6D", fontSize: 12, marginTop: -8, marginBottom: 12 }}>⚠ {error}</p>}

        <button
          className="post-submit"
          disabled={!file || uploading}
          onClick={handleSubmit}
        >
          {uploading ? "Upload ho raha hai..." : file ? "Share" : "Pehle media select karein"}
        </button>
      </div>
    </div>
  );
}

function formatDuration(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(s / 60);
  return String(m).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

function VideoUploadView({ token, onBack, onDone }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [category, setCategory] = useState("General / Default");
  const [community, setCommunity] = useState("General / Default");
  const [visibility, setVisibility] = useState("Public");
  const [allowComments, setAllowComments] = useState(true);
  const [meta, setMeta] = useState({
    categories: ["General / Default"],
    communities: ["General / Default"],
    visibility: ["Public", "Unlisted", "Private"],
  });
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    fetch(API_BASE + "/videos/meta")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.categories)) setMeta(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const pickFile = (f, input) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("Sirf video file select karein");
      input.value = "";
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError("Video 100MB se chhoti honi chahiye");
      input.value = "";
      return;
    }
    setError("");
    setFile(f);
    setDuration(0);
    setPreviewUrl(URL.createObjectURL(f));
    input.value = "";
  };

  const submit = async () => {
    if (uploading) return;
    if (!file) { setError("Pehle video select karein"); return; }
    if (!title.trim()) { setError("Title likhna zaroori hai"); return; }
    if (!description.trim()) { setError("Description likhna zaroori hai"); return; }
    setError("");
    setUploading(true);
    setProgress(0);
    try {
      const auth = { Authorization: "Bearer " + token };
      const signRes = await fetch(API_BASE + "/videos/sign", { method: "POST", headers: auth });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error || "Upload shuru nahi ho saka");

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.apiKey);
      form.append("timestamp", sign.timestamp);
      form.append("signature", sign.signature);
      form.append("folder", sign.folder);

      const uploaded = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://api.cloudinary.com/v1_1/" + sign.cloudName + "/video/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          let data = {};
          try { data = JSON.parse(xhr.responseText); } catch (e) {}
          if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) resolve(data);
          else reject(new Error((data.error && data.error.message) || "Video upload fail ho gaya"));
        };
        xhr.onerror = () => reject(new Error("Internet ka masla, dobara try karein"));
        xhr.send(form);
      });

      const saveRes = await fetch(API_BASE + "/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          videoUrl: uploaded.secure_url,
          duration: uploaded.duration || duration,
          title: title.trim(),
          description: description.trim(),
          hashtags: hashtags,
          category: category,
          community: community,
          visibility: visibility,
          allowComments: allowComments,
        }),
      });
      const saved = await saveRes.json();
      if (!saveRes.ok) throw new Error(saved.error || "Video save nahi ho saki");
      setDone(true);
    } catch (err) {
      setError(err.message || "Upload fail ho gaya");
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <section className="vup">
        <div className="vup-done">
          <strong>Video upload ho gayi ✅</strong>
          <span>Aapki video save ho gayi hai. Home ke Videos tab mein nazar aayegi.</span>
          <button className="post-submit" type="button" onClick={onDone}>Wapas jao</button>
        </div>
      </section>
    );
  }

  return (
    <section className="vup">
      <div className="vup-header">
        <button className="icon-btn" type="button" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h2>Upload</h2>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={(e) => pickFile(e.target.files && e.target.files[0], e.target)}
      />
      <div className="vup-top">
        <button type="button" className="vup-thumb" onClick={() => inputRef.current && inputRef.current.click()}>
          {previewUrl ? (
            <>
              <video
                src={previewUrl + "#t=1"}
                muted
                playsInline
                preload="metadata"
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              />
              <span className="vup-dur">{formatDuration(duration)}</span>
            </>
          ) : (
            <span className="vup-pick">+ Video chunein</span>
          )}
        </button>
        <textarea
          className="vup-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Video ka title likhein *"
          maxLength={100}
        />
      </div>
      <textarea
        className="vup-desc"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Video ke baare mein likhein (max 400) *"
        maxLength={400}
      />
      <input
        className="vup-input"
        value={hashtags}
        onChange={(e) => setHashtags(e.target.value)}
        placeholder="Hashtags (jaise #example #tag)"
      />
      <label className="vup-row">
        <span>Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {meta.categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="vup-row">
        <span>Community</span>
        <select value={community} onChange={(e) => setCommunity(e.target.value)}>
          {meta.communities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="vup-row">
        <span>Visibility</span>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          {meta.visibility.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="vup-row">
        <span>Comments allow karein</span>
        <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} />
      </label>
      {error && <p className="vup-error" role="alert">⚠ {error}</p>}
      {uploading && (
        <div className="vup-progress"><div style={{ width: progress + "%" }} /></div>
      )}
      <button className="post-submit" type="button" disabled={uploading} onClick={submit}>
        {uploading ? "Upload ho raha hai " + progress + "%" : "UPLOAD"}
      </button>
    </section>
  );
}

function vfDuration(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + ss;
  return String(m).padStart(2, "0") + ":" + ss;
}

function videoAgo(d) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [name, secs] of units) {
    const n = Math.floor(s / secs);
    if (n >= 1) return n + " " + name + (n > 1 ? "s" : "") + " ago";
  }
  return "just now";
}

function shortCount(n) {
  const v = Number(n) || 0;
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(v);
}

function VideosFeed({ token, userId, community, mine }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cats, setCats] = useState(["All"]);
  const [category, setCategory] = useState("All");
  const [retry, setRetry] = useState(0);
  const [active, setActive] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [ownerId, setOwnerId] = useState("");
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const activeId = active ? active._id : null;

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    setComments([]);
    setCommentText("");
    setCommentError("");
    setCommentsLoading(true);
    fetch(API_BASE + "/videos/" + activeId + "/comments")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setComments(Array.isArray(d.comments) ? d.comments : []);
        setOwnerId(d.owner ? String(d.owner) : "");
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeId]);

  const postComment = () => {
    const text = commentText.trim();
    if (!text || posting || !token || !active) return;
    setPosting(true);
    setCommentError("");
    fetch(API_BASE + "/videos/" + active._id + "/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ text: text }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d: d })))
      .then((res) => {
        if (!res.ok) {
          setCommentError(res.d.error || "Comment nahi ho saka");
          return;
        }
        setComments((c) => [res.d.comment].concat(c));
        setCommentText("");
        setActive((a) => (a ? { ...a, commentsCount: res.d.commentsCount } : a));
      })
      .catch(() => setCommentError("Internet ka masla, dobara try karein"))
      .finally(() => setPosting(false));
  };

  const deleteComment = (id) => {
    if (!active || !token) return;
    fetch(API_BASE + "/videos/" + active._id + "/comments/" + id, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setComments((c) => c.filter((x) => x._id !== id));
        setActive((a) => (a ? { ...a, commentsCount: d.commentsCount } : a));
      })
      .catch(() => {});
  };


  useEffect(() => {
    fetch(API_BASE + "/videos/meta")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.categories)) setCats(["All"].concat(d.categories));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const params = [];
    if (category !== "All") params.push("category=" + encodeURIComponent(category));
    if (community) params.push("community=" + encodeURIComponent(community));
    const q = params.length ? "?" + params.join("&") : "";
    fetch(API_BASE + (mine ? "/videos/mine" : "/videos" + q), mine ? { headers: { Authorization: "Bearer " + token } } : undefined)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad"))))
      .then((d) => {
        if (!cancelled) setVideos(Array.isArray(d.videos) ? d.videos : []);
      })
      .catch(() => {
        if (!cancelled) setError("Videos load nahi ho sakin");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [category, retry, community, mine]);

  const openVideo = (v) => {
    setActive({ ...v, liked: false });
    fetch(API_BASE + "/videos/" + v._id)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.video) {
          setActive((a) => (a && a._id === v._id ? { ...a, views: d.video.views } : a));
        }
      })
      .catch(() => {});
  };

  const likeVideo = () => {
    if (!active || !token) return;
    fetch(API_BASE + "/videos/" + active._id + "/like", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setActive((a) => (a ? { ...a, liked: d.liked, likesCount: d.likesCount } : a));
      })
      .catch(() => {});
  };

  const authorName = (v) => (v.author && v.author.name ? v.author.name : "Unknown");

  return (
    <section className={"vf" + (mine ? " vf-mine" : "")}>
      <div className="vf-chips">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            className={c === category ? "active" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && videos.length === 0 && (
        <>
          {[0, 1, 2].map((i) => (
            <div key={i} className="vf-card vf-skel">
              <div className="vf-thumb" />
              <div className="vf-info">
                <span className="vf-avatar" />
                <div className="vf-meta"><strong>&nbsp;</strong><span>&nbsp;</span></div>
              </div>
            </div>
          ))}
        </>
      )}

      {error && (
        <div className="feed-status feed-status-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <p className="feed-status">Abhi koi video nahi hai. Create (+) dabao aur "Lambi video upload karein" chuno.</p>
      )}

      {videos.map((v) => (
        <button key={v._id} type="button" className="vf-card" onClick={() => openVideo(v)}>
          <div className="vf-thumb">
            <img src={v.thumbnailUrl} alt="" loading="lazy" />
            <span className="vf-dur">{vfDuration(v.duration)}</span>
          </div>
          <div className="vf-info">
            <span className="vf-avatar">{authorName(v).slice(0, 1).toUpperCase()}</span>
            <div className="vf-meta">
              <strong>{v.title}</strong>
              <span>{authorName(v)} · {shortCount(v.views)} views · {videoAgo(v.createdAt)}</span>
            </div>
          </div>
        </button>
      ))}

      {active && (
        <div className="vf-overlay" onClick={() => setActive(null)}>
          <div className="vf-player" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="vf-close" onClick={() => setActive(null)} aria-label="Close">
              <X size={20} />
            </button>
            <video src={active.videoUrl} poster={active.thumbnailUrl} controls autoPlay playsInline />
            <h3>{active.title}</h3>
            <div className="vf-sub">
              {authorName(active)} · {shortCount(active.views)} views · {videoAgo(active.createdAt)} · {active.community}
            </div>
            <div className="vf-actions">
              <button type="button" className={active.liked ? "active" : ""} onClick={likeVideo}>
                <Heart size={16} /> {shortCount(active.likesCount)}
              </button>
            </div>
            <p className="vf-desc">{active.description}</p>
            <div className="vf-tags">
              {(active.hashtags || []).map((t) => <span key={t}>#{t}</span>)}
            </div>
            <div className="vf-comments">
              <h4>Comments ({shortCount(comments.length)})</h4>
              {active.allowComments === false ? (
                <p className="vf-muted">Is video par comments band hain.</p>
              ) : token ? (
                <div className="vf-cform">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") postComment(); }}
                    placeholder="Comment likhein..."
                    maxLength={500}
                  />
                  <button type="button" onClick={postComment} disabled={posting || !commentText.trim()}>
                    {posting ? "..." : "Post"}
                  </button>
                </div>
              ) : null}
              {commentError && <p className="vf-cerr">⚠ {commentError}</p>}
              {commentsLoading && <p className="vf-muted">Comments load ho rahe hain...</p>}
              {!commentsLoading && comments.length === 0 && active.allowComments !== false && (
                <p className="vf-muted">Abhi koi comment nahi. Pehla comment aap karein!</p>
              )}
              {comments.map((c) => (
                <div key={c._id} className="vf-comment">
                  <span className="vf-avatar vf-avatar-sm">{(c.author.name || "?").slice(0, 1).toUpperCase()}</span>
                  <div className="vf-ctext">
                    <strong>{c.author.name} <em>{videoAgo(c.createdAt)}</em></strong>
                    <span>{c.text}</span>
                  </div>
                  {userId && (c.author._id === userId || ownerId === userId) && (
                    <button type="button" className="vf-cdel" onClick={() => deleteComment(c._id)} aria-label="Delete comment">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const COMMUNITY_COLORS = [
  ["#7c5cff", "#ff4d6d"], ["#00c6a7", "#3a7bd5"], ["#ff8a00", "#e52e71"],
  ["#4facfe", "#7c5cff"], ["#f857a6", "#ff5858"], ["#11998e", "#38ef7d"], ["#8e2de2", "#4a00e0"],
];

function CommunitiesView({ token, userId }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const headers = token ? { Authorization: "Bearer " + token } : {};
    fetch(API_BASE + "/communities", { headers: headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad"))))
      .then((d) => {
        if (!cancelled) setList(Array.isArray(d.communities) ? d.communities : []);
      })
      .catch(() => {
        if (!cancelled) setError("Communities load nahi ho sakin");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, retry]);

  const toggleJoin = (c, e) => {
    if (e) e.stopPropagation();
    if (!token) return;
    fetch(API_BASE + "/communities/" + c._id + "/join", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const patch = { joined: d.joined, membersCount: d.membersCount };
        setList((l) => l.map((x) => (x._id === c._id ? { ...x, ...patch } : x)));
        setSelected((s) => (s && s._id === c._id ? { ...s, ...patch } : s));
      })
      .catch(() => {});
  };

  if (selected) {
    return (
      <section className="cm">
        <div className="cm-head">
          <button className="icon-btn" type="button" onClick={() => setSelected(null)} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div className="cm-title">
            <strong>{selected.name}</strong>
            <span>{shortCount(selected.membersCount)} members</span>
          </div>
          <button
            type="button"
            className={"cm-join" + (selected.joined ? " joined" : "")}
            onClick={(e) => toggleJoin(selected, e)}
          >
            {selected.joined ? "Joined" : "Join"}
          </button>
        </div>
        <VideosFeed key={selected._id} token={token} userId={userId} community={selected.name} />
      </section>
    );
  }

  const cities = list.filter((c) => c.kind === "city");
  const others = list.filter((c) => c.kind !== "city");

  return (
    <section className="cm">
      <h2 className="cm-h">Communities</h2>

      {error && (
        <div className="feed-status feed-status-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </div>
      )}

      {loading && list.length === 0 && (
        <div className="cm-grid">
          {[0, 1, 2, 3].map((i) => <div key={i} className="cm-card cm-skel" />)}
        </div>
      )}

      <div className="cm-grid">
        {cities.map((c, i) => {
          const col = COMMUNITY_COLORS[i % COMMUNITY_COLORS.length];
          return (
            <button
              key={c._id}
              type="button"
              className="cm-card"
              style={{ background: "linear-gradient(135deg, " + col[0] + ", " + col[1] + ")" }}
              onClick={() => setSelected(c)}
            >
              <span className="cm-letter">{c.name.slice(0, 1)}</span>
              <strong>{c.name}</strong>
              <span className="cm-count">{shortCount(c.membersCount)} members</span>
              <span
                role="button"
                className={"cm-join sm" + (c.joined ? " joined" : "")}
                onClick={(e) => toggleJoin(c, e)}
              >
                {c.joined ? "Joined" : "Join"}
              </span>
            </button>
          );
        })}
      </div>

      {others.map((c) => (
        <div key={c._id} className="cm-row" onClick={() => setSelected(c)}>
          <span className="vf-avatar">{c.name.slice(0, 1).toUpperCase()}</span>
          <div className="cm-rowtext">
            <strong>{c.name}</strong>
            <span>{shortCount(c.membersCount)} members</span>
          </div>
          <button
            type="button"
            className={"cm-join sm" + (c.joined ? " joined" : "")}
            onClick={(e) => toggleJoin(c, e)}
          >
            {c.joined ? "Joined" : "Join"}
          </button>
        </div>
      ))}
    </section>
  );
}

function EditProfilePage({ token, profile, onClose, onSaved }) {
  const [channelName, setChannelName] = useState(profile.channelName || "");
  const [firstName, setFirstName] = useState(profile.firstName || "");
  const [lastName, setLastName] = useState(profile.lastName || "");
  const [gender, setGender] = useState(profile.gender || "");
  const [dob, setDob] = useState(profile.dob || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [nameState, setNameState] = useState({ ok: null, msg: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [pwMsg, setPwMsg] = useState({ ok: null, msg: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const auth = { Authorization: "Bearer " + token };

  useEffect(() => {
    const name = channelName.trim();
    if (name === profile.channelName) {
      setNameState({ ok: null, msg: "" });
      return;
    }
    if (name.length < 3) {
      setNameState({ ok: false, msg: "Kam az kam 3 harf likhein" });
      return;
    }
    setNameState({ ok: null, msg: "Check ho raha hai..." });
    const t = setTimeout(() => {
      fetch(API_BASE + "/users/check-name?name=" + encodeURIComponent(name), { headers: auth })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) setNameState({ ok: !!d.available, msg: d.available ? "Naam available hai ✓" : d.reason || "Naam available nahi" });
        })
        .catch(() => setNameState({ ok: null, msg: "" }));
    }, 500);
    return () => clearTimeout(t);
  }, [channelName]);

  const save = () => {
    if (saving) return;
    if (nameState.ok === false) { setError("Pehle channel name theek karein"); return; }
    setSaving(true);
    setError("");
    fetch(API_BASE + "/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({
        channelName: channelName.trim(),
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        dob: dob,
        bio: bio,
      }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d: d })))
      .then((res) => {
        if (!res.ok) { setError(res.d.error || "Save nahi ho saka"); return; }
        onSaved(res.d.profile);
      })
      .catch(() => setError("Internet ka masla, dobara try karein"))
      .finally(() => setSaving(false));
  };

  const changePassword = () => {
    if (pwBusy) return;
    if (newPw.length < 6) { setPwMsg({ ok: false, msg: "Naya password kam az kam 6 harf ka ho" }); return; }
    if (newPw !== confPw) { setPwMsg({ ok: false, msg: "Dono naye password ek jaise nahi" }); return; }
    setPwBusy(true);
    setPwMsg({ ok: null, msg: "" });
    fetch(API_BASE + "/users/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d: d })))
      .then((res) => {
        if (!res.ok) { setPwMsg({ ok: false, msg: res.d.error || "Password nahi badla" }); return; }
        setPwMsg({ ok: true, msg: "Password badal gaya ✓" });
        setCurPw(""); setNewPw(""); setConfPw("");
      })
      .catch(() => setPwMsg({ ok: false, msg: "Internet ka masla" }))
      .finally(() => setPwBusy(false));
  };

  return (
    <div className="pc-page">
      <div className="pc-pagehead">
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h2>Edit Profile</h2>
      </div>

      <label className="pc-field">
        <span>Channel Name</span>
        <input value={channelName} onChange={(e) => setChannelName(e.target.value)} maxLength={30} />
        {nameState.msg && (
          <em className={nameState.ok === true ? "ok" : nameState.ok === false ? "bad" : ""}>{nameState.msg}</em>
        )}
      </label>

      <label className="pc-field">
        <span>Email</span>
        <input value={profile.email || ""} readOnly />
      </label>

      <button type="button" className="pc-pwrow" onClick={() => setShowPw((v) => !v)}>
        <span>Change Password</span>
        <span>{showPw ? "▲" : "▼"}</span>
      </button>
      {showPw && (
        <div className="pc-pwbox">
          <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="Purana password" />
          <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Naya password (kam az kam 6 harf)" />
          <input type="password" value={confPw} onChange={(e) => setConfPw(e.target.value)} placeholder="Naya password dobara" />
          {pwMsg.msg && <em className={pwMsg.ok ? "ok" : "bad"}>{pwMsg.msg}</em>}
          <button type="button" onClick={changePassword} disabled={pwBusy}>{pwBusy ? "..." : "Password badlo"}</button>
        </div>
      )}

      <label className="pc-field">
        <span>First Name</span>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={40} />
      </label>
      <label className="pc-field">
        <span>Last Name</span>
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={40} />
      </label>
      <label className="pc-field">
        <span>Gender</span>
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Batana nahi chahta</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="pc-field">
        <span>Date of Birth</span>
        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
      </label>
      <label className="pc-field">
        <span>Bio</span>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder="Apne baare mein likhein (max 200)" />
      </label>

      {error && <p className="pc-error" role="alert">⚠ {error}</p>}
      <button type="button" className="post-submit pc-save" disabled={saving} onClick={save}>
        {saving ? "Save ho raha hai..." : "SAVE CHANGES"}
      </button>
    </div>
  );
}

function ProfileChannel({ user, onLogout }) {
  const token = user && user.token;
  const [profile, setProfile] = useState(null);
  const [showVideos, setShowVideos] = useState(false);
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [info, setInfo] = useState(null);
  const [toast, setToast] = useState("");
  const [countryName, setCountryName] = useState("");

  useEffect(() => {
    if (!profile || !profile.country) { setCountryName(""); return; }
    fetch(API_BASE + "/countries")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const c = d && d.countries ? d.countries.find((x) => x.code === profile.country) : null;
        setCountryName(c ? c.name : countryNameOf(profile.country));
      })
      .catch(() => setCountryName(countryNameOf(profile.country)));
  }, [profile && profile.country]);

  useEffect(() => {
    if (!token) return;
    fetch(API_BASE + "/users/me/profile", { headers: { Authorization: "Bearer " + token } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.profile) setProfile(d.profile);
      })
      .catch(() => {});
  }, [token]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const shareProfile = () => {
    const url = window.location.origin;
    const text = (profile ? profile.channelName : "Mera channel") + " Tolvify par";
    if (navigator.share) {
      navigator.share({ title: "Tolvify", text: text, url: url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => flash("Link copy ho gaya")).catch(() => {});
    }
  };

  const soon = (title) => {
    setMenuOpen(false);
    setInfo({ title: title, text: "Ye feature agle update mein aa raha hai." });
  };

  const showText = (title, text) => {
    setMenuOpen(false);
    setInfo({ title: title, text: text });
  };

  const n = (v) => shortCount(profile ? profile[v] : 0);

  return (
    <div className="pc">
      <div className="pc-stats">
        <div><strong>{n("videosCount")}</strong><span>Videos</span></div>
        <div><strong>{n("viewsTotal")}</strong><span>Views</span></div>
        <div><strong>{n("likesTotal")}</strong><span>Likes</span></div>
        <div><strong>{n("communitiesCount")}</strong><span>Communities</span></div>
      </div>
      {profile && profile.bio && <p className="pc-bio">{profile.bio}</p>}
      <div className="pc-actions">
        <button type="button" disabled={!profile} onClick={() => setEditing(true)}>Edit Profile</button>
        <button type="button" onClick={shareProfile}><Share2 size={15} /> Share Profile</button>
        <button type="button" className="pc-menu" onClick={() => setMenuOpen(true)} aria-label="Menu">☰</button>
      </div>
      <button type="button" className="pc-toggle" onClick={() => setShowVideos((v) => !v)}>
        <span>Meri Videos ({profile ? profile.videosCount : 0})</span>
        <span>{showVideos ? "▲" : "▼"}</span>
      </button>
      {showVideos && <VideosFeed token={token} userId={user && user.id} mine />}
      {toast && <div className="pc-toast">{toast}</div>}

      {editing && profile && (
        <EditProfilePage
          token={token}
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={(p) => {
            setProfile(p);
            setEditing(false);
            flash("Profile save ho gayi ✓");
          }}
        />
      )}

      {menuOpen && (
        <div className="pc-overlay" onClick={() => setMenuOpen(false)}>
          <div className="pc-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="pc-drawerhead">
              <span className="vf-avatar">{((profile && profile.channelName) || "?").slice(0, 1).toUpperCase()}</span>
              <strong>{profile ? profile.channelName : ""}</strong>
            </div>
            <button type="button" onClick={() => { setMenuOpen(false); setShowVideos(true); }}>Recent Uploads</button>
            <button type="button" onClick={() => soon("Watch History")}>Watch History</button>
            <button type="button" onClick={() => soon("Watch List")}>Watch List</button>
            <button type="button" onClick={() => soon("Policy Violations")}>Policy Violations</button>
            <button type="button" onClick={() => showText("Terms & Conditions", "Tolvify istemal karke aap maante hain ke aap sirf apni ya ijazat wali videos daalenge, kisi ki tauheen ya nuqsan nahi karenge, aur qaanooni qawaneen ki pairwi karenge. Qawaid khilaf-warzi par video ya account band kiya ja sakta hai. (Ye abhi ka mukhtasar masauda hai.)")}>Terms & Conditions</button>
            <button type="button" onClick={() => showText("Privacy Policy", "Hum aapka email, naam aur jo aap upload karte hain mehfooz rakhte hain. Aapka password hamesha encrypted rehta hai. Aapka data kisi ko bechne ke liye nahi hai. (Ye abhi ka mukhtasar masauda hai.)")}>Privacy Policy</button>
            <button type="button" onClick={() => soon("Delete Your Account")}>Delete Your Account</button>
            <button type="button" onClick={() => { setMenuOpen(false); if (onLogout) onLogout(); }}>Logout</button>
          </div>
        </div>
      )}

      {info && (
        <div className="pc-overlay pc-center" onClick={() => setInfo(null)}>
          <div className="pc-info" onClick={(e) => e.stopPropagation()}>
            <h3>{info.title}</h3>
            <p>{info.text}</p>
            <button type="button" onClick={() => setInfo(null)}>OK</button>
          </div>
        </div>
      )}
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

let audioCtx = null;
let seenNotifs = { token: "", ids: null };
function unlockAudio() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {}
}
if (typeof window !== "undefined") {
  ["touchstart", "click", "keydown"].forEach((ev) =>
    window.addEventListener(ev, unlockAudio, { passive: true })
  );
}
function playDing() {
  try {
    unlockAudio();
    if (!audioCtx || audioCtx.state !== "running") return;
    const t = audioCtx.currentTime;
    [880, 1318].forEach((freq, i) => {
      const start = t + i * 0.18;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(start);
      o.stop(start + 0.45);
    });
    if (navigator.vibrate) navigator.vibrate(200);
  } catch (e) {}
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
        {notifications.length === 0 && (
          <div className="notif-row">
            <div className="notif-text">
              <span>Abhi koi notification nahi hai.</span>
            </div>
          </div>
        )}
        {notifications.length === 0 && <div className="notif-time" style={{ padding: 16 }}>Abhi koi notification nahi hai</div>}
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
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [postsRetry, setPostsRetry] = useState(0);
  const [postsNextPage, setPostsNextPage] = useState(2);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [postsMoreLoading, setPostsMoreLoading] = useState(false);
  const [profilePosts, setProfilePosts] = useState([]);
  const [profilePostsLoading, setProfilePostsLoading] = useState(true);
  const [profilePostsError, setProfilePostsError] = useState("");
  const [profilePostsRetry, setProfilePostsRetry] = useState(0);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedPostsLoading, setSavedPostsLoading] = useState(true);
  const [savedPostsError, setSavedPostsError] = useState("");
  const [savedPostsRetry, setSavedPostsRetry] = useState(0);
  const [profileTab, setProfileTab] = useState("posts");
  const [shorts, setShorts] = useState([]);
  const [shortsLoading, setShortsLoading] = useState(true);
  const [shortsError, setShortsError] = useState("");
  const [shortsRetry, setShortsRetry] = useState(0);
  const [liked, toggleLike, setLiked] = useLikeState();
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [savingPostIds, setSavingPostIds] = useState(new Set());
  const [shareToast, setShareToast] = useState(false);
  const shareToastTimerRef = useRef(null);
  const [following, setFollowing] = useState(new Set());
  const [followingIds, setFollowingIds] = useState(new Set());
  const [profileFollowers, setProfileFollowers] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [selectedProfilePost, setSelectedProfilePost] = useState(null);
  const [commentsByShort, setCommentsByShort] = useState({});
  const [activeCommentsShort, setActiveCommentsShort] = useState(null);
  const viewedShortsRef = useRef(new Set());
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredPosts = searchQuery.trim()
    ? posts.filter(
        (p) =>
          p.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.user.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!user?.token) return;
    fetch(API_BASE + "/notifications/read-all", {
      method: "POST",
      headers: { Authorization: "Bearer " + user.token },
    }).catch(() => {});
  };

  const onNotificationsView = view === "notifications";
  useEffect(() => {
    if (!user?.token) {
      setNotifications([]);
      return undefined;
    }
    let cancelled = false;
    const load = () => {
      fetch(API_BASE + "/notifications", { headers: { Authorization: "Bearer " + user.token } })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
        .then((data) => {
          if (!cancelled) {
            const list = data.notifications || [];
            const prevSeen = seenNotifs.token === user.token ? seenNotifs.ids : null;
            const fresh = !!prevSeen && list.some((n) => !n.read && !prevSeen.has(n._id));
            seenNotifs = { token: user.token, ids: new Set(list.map((n) => n._id)) };
            if (fresh) playDing();
            setNotifications(list.map(notificationFromApi));
          }
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user?.token, onNotificationsView]);

  const [conversations, setConversations] = useState(seedConversations);
  const [activeChatId, setActiveChatId] = useState(null);
  const unreadMsgCount = conversations.reduce((sum, c) => sum + c.unread, 0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setShortsLoading(true);
    setShortsError("");

    fetch(API_BASE + "/shorts")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load videos.");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.shorts)
            ? data.shorts
            : [];
        setShorts(list.map(normalizeShort));
      })
      .catch((err) => {
        if (cancelled) return;
        setShortsError(err.message || "Could not load videos. Please try again.");
        console.error("Shorts fetch failed:", err);
      })
      .finally(() => {
        if (!cancelled) setShortsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, shortsRetry]);

  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;
    const pageSize = 10;
    setPostsLoading(true);
    setPostsError("");

    fetch(`${API_BASE}/posts?page=1&limit=${pageSize}`, {
      headers: { Authorization: "Bearer " + user.token },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not load posts.");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        const rawPosts = extractPostList(data);
        const normalized = rawPosts.map(normalizePost);
        setPosts(normalized);
        syncPostFlags(normalized, setLiked, setSavedPostIds);

        const pagination = data.pagination || data.meta || {};
        const hasMore = data.hasMore ?? pagination.hasMore ?? pagination.hasNextPage ??
          (typeof data.totalPages === "number"
            ? 1 < data.totalPages
            : typeof pagination.totalPages === "number"
              ? 1 < pagination.totalPages
              : rawPosts.length === pageSize);
        setPostsHasMore(Boolean(hasMore));
        setPostsNextPage(2);
      })
      .catch((err) => {
        if (cancelled) return;
        setPostsError(err.message || "Could not load posts. Please try again.");
        console.error("Posts fetch failed:", err);
      })
      .finally(() => {
        if (!cancelled) setPostsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.token, postsRetry, setLiked]);

  useEffect(() => {
    if (!user?.id || !user?.token) return;
    let cancelled = false;
    setProfilePostsLoading(true);
    setProfilePostsError("");

    fetch(`${API_BASE}/posts/user/${encodeURIComponent(user.id)}`, {
      headers: { Authorization: "Bearer " + user.token },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not load your posts.");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        const normalized = extractPostList(data).map(normalizePost);
        setProfilePosts(normalized);
        syncPostFlags(normalized, setLiked, setSavedPostIds);
      })
      .catch((err) => {
        if (cancelled) return;
        setProfilePostsError(err.message || "Could not load your posts. Please try again.");
        console.error("Profile posts fetch failed:", err);
      })
      .finally(() => {
        if (!cancelled) setProfilePostsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.token, profilePostsRetry]);

  useEffect(() => {
    if (!user?.token || profileTab !== "saved") return;
    let cancelled = false;
    setSavedPostsLoading(true);
    setSavedPostsError("");

    fetch(API_BASE + "/posts/saved", {
      headers: { Authorization: "Bearer " + user.token },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not load saved posts.");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        const normalized = extractPostList(data).map((post, index) => ({
          ...normalizePost(post, index),
          saved: true,
        }));
        setSavedPosts(normalized);
        syncPostFlags(normalized, setLiked, setSavedPostIds);
      })
      .catch((err) => {
        if (cancelled) return;
        setSavedPostsError(err.message || "Could not load saved posts. Please try again.");
        console.error("Saved posts fetch failed:", err);
      })
      .finally(() => {
        if (!cancelled) setSavedPostsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.token, profileTab, savedPostsRetry]);

  useEffect(() => {
    if (!user?.token) return undefined;
    let cancelled = false;
    fetch(API_BASE + "/users/me/following", { headers: { Authorization: "Bearer " + user.token } })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (!cancelled && Array.isArray(data.following)) setFollowingIds(new Set(data.following));
      })
      .catch((err) => console.error("Following fetch failed:", err));
    if (user?.id) {
      fetch(API_BASE + "/users/" + encodeURIComponent(user.id))
        .then((res) => res.json().catch(() => ({})))
        .then((data) => {
          if (!cancelled && typeof data.followersCount === "number") setProfileFollowers(data.followersCount);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.token, view]);

  const loadMorePosts = async () => {
    if (!user?.token || postsMoreLoading || !postsHasMore) return;
    setPostsMoreLoading(true);
    setPostsError("");
    const pageSize = 10;
    const page = postsNextPage;
    try {
      const res = await fetch(`${API_BASE}/posts?page=${page}&limit=${pageSize}`, {
        headers: { Authorization: "Bearer " + user.token },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load more posts.");
      const rawPosts = extractPostList(data);
      const normalized = rawPosts.map(normalizePost);
      setPosts((previous) => {
        const existingIds = new Set(previous.map((post) => post.id));
        return [...previous, ...normalized.filter((post) => !existingIds.has(post.id))];
      });
      const pagination = data.pagination || data.meta || {};
      const hasMore = data.hasMore ?? pagination.hasMore ?? pagination.hasNextPage ??
        (typeof data.totalPages === "number"
          ? page < data.totalPages
          : typeof pagination.totalPages === "number"
            ? page < pagination.totalPages
            : rawPosts.length === pageSize);
      setPostsHasMore(Boolean(hasMore));
      setPostsNextPage(page + 1);
      syncPostFlags(normalized, setLiked, setSavedPostIds);
    } catch (err) {
      setPostsError(err.message || "Could not load more posts. Please try again.");
    } finally {
      setPostsMoreLoading(false);
    }
  };

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

  const updatePostEverywhere = (postId, updatePost) => {
    const updateList = (previous) =>
      previous.map((post) => post.id === postId ? updatePost(post) : post);
    setPosts(updateList);
    setProfilePosts(updateList);
    setSavedPosts(updateList);
    setSelectedProfilePost((post) => post?.id === postId ? updatePost(post) : post);
  };

  const addComment = async (postId, text) => {
    if (!user?.token) throw new Error("Please sign in again to comment.");
    const res = await fetch(API_BASE + "/posts/" + encodeURIComponent(postId) + "/comments", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + user.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not post your comment. Please try again.");

    const responseComment = data.comment || data.data?.comment || {};
    const commentUser = responseComment.user && typeof responseComment.user === "object"
      ? responseComment.user
      : {};
    const comment = {
      id: String(responseComment._id || responseComment.id || "c" + Date.now()),
      user: commentUser.username || commentUser.displayName || user.username || user.name || "You",
      text: responseComment.text || responseComment.content || text,
    };
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), comment],
    }));

    const commentCount =
      typeof data.commentsCount === "number"
        ? data.commentsCount
        : typeof data.post?.commentsCount === "number"
          ? data.post.commentsCount
          : typeof data.post?.comments === "number"
            ? data.post.comments
            : null;
    updatePostEverywhere(postId, (post) => ({
      ...post,
      comments: commentCount ?? post.comments + 1,
    }));
  };

  const toggleFollow = (user) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      next.has(user) ? next.delete(user) : next.add(user);
      return next;
    });
  };

  const toggleUserFollow = async (userId) => {
    if (!user?.token || !userId) return;
    const wasFollowing = followingIds.has(userId);
    setFollowingIds((previous) => {
      const next = new Set(previous);
      wasFollowing ? next.delete(userId) : next.add(userId);
      return next;
    });
    try {
      const res = await fetch(API_BASE + "/users/" + encodeURIComponent(userId) + "/follow", {
        method: "POST",
        headers: { Authorization: "Bearer " + user.token },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.following !== "boolean") throw new Error(data.error || "Could not update follow.");
      setFollowingIds((previous) => {
        const next = new Set(previous);
        data.following ? next.add(userId) : next.delete(userId);
        return next;
      });
    } catch (err) {
      setFollowingIds((previous) => {
        const next = new Set(previous);
        wasFollowing ? next.add(userId) : next.delete(userId);
        return next;
      });
      console.error("Follow failed:", err);
    }
  };

  const addShortComment = (shortId, text) => {
    setCommentsByShort((prev) => ({
      ...prev,
      [shortId]: [...(prev[shortId] || []), { id: "sc" + Date.now(), user: user?.name || "You", text }],
    }));
  };

  const toggleShortLike = async (shortId) => {
    if (!user?.token) return;
    const wasLiked = liked.has(shortId);
    toggleLike(shortId);
    setShorts((prev) => prev.map((short) =>
      short.id === shortId
        ? { ...short, likes: Math.max(0, short.likes + (wasLiked ? -1 : 1)) }
        : short
    ));
    try {
      const res = await fetch(API_BASE + "/shorts/" + shortId + "/like", {
        method: "POST",
        headers: { Authorization: "Bearer " + user.token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update like.");
      const likesCount = typeof data.likesCount === "number"
        ? data.likesCount
        : (Array.isArray(data.likes) || typeof data.likes === "number")
          ? countValue(data.likes)
          : null;
      if (typeof likesCount === "number") {
        setShorts((prev) => prev.map((s) => (s.id === shortId ? { ...s, likes: likesCount } : s)));
      }
    } catch (err) {
      toggleLike(shortId);
      setShorts((prev) => prev.map((short) =>
        short.id === shortId
          ? { ...short, likes: Math.max(0, short.likes + (wasLiked ? 1 : -1)) }
          : short
      ));
      console.error("Short like failed:", err);
    }
  };

  const togglePostLike = async (postId) => {
    if (!user?.token) return;
    const wasLiked = liked.has(postId);
    toggleLike(postId);
    updatePostEverywhere(postId, (post) => ({
      ...post,
      likes: Math.max(0, post.likes + (wasLiked ? -1 : 1)),
    }));
    try {
      const res = await fetch(API_BASE + "/posts/" + encodeURIComponent(postId) + "/like", {
        method: "POST",
        headers: { Authorization: "Bearer " + user.token },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update like.");
      const likesCount = typeof data.likesCount === "number"
        ? data.likesCount
        : typeof data.post?.likesCount === "number"
          ? data.post.likesCount
          : Array.isArray(data.likes) || typeof data.likes === "number"
            ? countValue(data.likes)
            : null;
      if (typeof likesCount === "number") {
        updatePostEverywhere(postId, (post) => ({ ...post, likes: likesCount }));
      }
    } catch (err) {
      toggleLike(postId);
      updatePostEverywhere(postId, (post) => ({
        ...post,
        likes: Math.max(0, post.likes + (wasLiked ? 1 : -1)),
      }));
      console.error("Post like failed:", err);
    }
  };

  const togglePostSave = async (post) => {
    if (!user?.token || savingPostIds.has(post.id)) return;
    const currentPost =
      posts.find((item) => item.id === post.id) ||
      profilePosts.find((item) => item.id === post.id) ||
      savedPosts.find((item) => item.id === post.id) ||
      post;
    const wasSaved = savedPostIds.has(post.id);
    const wasInSavedFeed = savedPosts.some((item) => item.id === post.id);
    const nextSaved = !wasSaved;

    setSavingPostIds((previous) => new Set(previous).add(post.id));
    setSavedPostIds((previous) => {
      const next = new Set(previous);
      nextSaved ? next.add(post.id) : next.delete(post.id);
      return next;
    });
    updatePostEverywhere(post.id, (item) => ({ ...item, saved: nextSaved }));
    setSavedPosts((previous) => nextSaved
      ? [{ ...currentPost, saved: true }, ...previous.filter((item) => item.id !== post.id)]
      : previous.filter((item) => item.id !== post.id));

    try {
      const res = await fetch(API_BASE + "/posts/" + encodeURIComponent(post.id) + "/save", {
        method: "POST",
        headers: { Authorization: "Bearer " + user.token },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update saved post.");
      if (typeof data.saved !== "boolean") throw new Error("The server did not confirm the saved status.");

      setSavedPostIds((previous) => {
        const next = new Set(previous);
        data.saved ? next.add(post.id) : next.delete(post.id);
        return next;
      });
      updatePostEverywhere(post.id, (item) => ({ ...item, saved: data.saved }));
      setSavedPosts((previous) => data.saved
        ? [{ ...currentPost, saved: true }, ...previous.filter((item) => item.id !== post.id)]
        : previous.filter((item) => item.id !== post.id));
    } catch (err) {
      setSavedPostIds((previous) => {
        const next = new Set(previous);
        wasSaved ? next.add(post.id) : next.delete(post.id);
        return next;
      });
      updatePostEverywhere(post.id, (item) => ({ ...item, saved: wasSaved }));
      setSavedPosts((previous) => {
        const withoutPost = previous.filter((item) => item.id !== post.id);
        return wasInSavedFeed
          ? [savedPosts.find((item) => item.id === post.id) || { ...currentPost, saved: true }, ...withoutPost]
          : withoutPost;
      });
      console.error("Post save failed:", err);
    } finally {
      setSavingPostIds((previous) => {
        const next = new Set(previous);
        next.delete(post.id);
        return next;
      });
    }
  };

  const markShortViewed = (shortId) => {
    if (viewedShortsRef.current.has(shortId)) return;
    viewedShortsRef.current.add(shortId);
    setShorts((prev) => prev.map((short) =>
      short.id === shortId ? { ...short, views: short.views + 1 } : short
    ));
    fetch(API_BASE + "/shorts/" + shortId + "/view", { method: "POST" })
      .catch((err) => console.error("Short view count failed:", err));
  };

  const addPost = (postData, fallback) => {
    const uploaded = normalizePost(postData, Date.now(), fallback);
    setPosts((prev) => [uploaded, ...prev.filter((post) => post.id !== uploaded.id)]);
    setProfilePosts((prev) => [uploaded, ...prev.filter((post) => post.id !== uploaded.id)]);
    syncPostFlags([uploaded], setLiked, setSavedPostIds);
    setView("feed");
  };

  const onShortUploaded = (shortData, caption) => {
    const uploaded = normalizeShort(
      { ...shortData, caption: shortData.caption || caption || "", user: shortData.user || user?.name },
      Date.now()
    );
    setShorts((prev) => [uploaded, ...prev.filter((short) => short.id !== uploaded.id)]);
    setView("sparks");
  };

  const shareShort = async (short) => {
    const shareUrl = short.mediaUrl || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Sparks by ${short.user}`, text: short.caption, url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("Short share failed:", err);
    }
  };

  const copySiteLink = async () => {
    const siteLink = window.location.href;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(siteLink);
        return;
      } catch {
        // Try the selection-based clipboard fallback below.
      }
    }

    const input = document.createElement("textarea");
    input.value = siteLink;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw new Error("Clipboard access is unavailable.");
  };

  const sharePost = async (post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Tolvify post by ${post.user}`,
          text: post.caption,
          url: window.location.href,
        });
      } else {
        await copySiteLink();
        setShareToast(true);
        window.clearTimeout(shareToastTimerRef.current);
        shareToastTimerRef.current = window.setTimeout(() => setShareToast(false), 2200);
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("Post share failed:", err);
    }
  };

  const navItems = [
    { key: "feed", icon: Home, label: "Home" },
    { key: "shorts", icon: Play, label: "Reels" },
    { key: "sparks", icon: Sparkles, label: "Sparks" },
    { key: "upload", icon: PlusSquare, label: "Create" },
    { key: "messages", icon: Send, label: "DM", badge: unreadMsgCount },
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
        .vup { max-width: 640px; margin: 0 auto; padding: 14px 16px 90px; }
        .vup-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .vup-header h2 { font-size: 18px; margin: 0; }
        .vup-top { display: flex; gap: 12px; margin-bottom: 12px; }
        .vup-thumb {
          position: relative; flex: 0 0 120px; height: 170px; border-radius: 12px; overflow: hidden;
          background: var(--surface-2); border: 1px solid var(--border); color: var(--text-muted);
          display: grid; place-items: center; cursor: pointer; padding: 0;
        }
        .vup-thumb video { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
        .vup-pick { font-size: 13px; padding: 8px; text-align: center; }
        .vup-dur {
          position: absolute; right: 6px; bottom: 6px; background: rgba(0,0,0,0.7); color: #fff;
          font-size: 11px; padding: 2px 6px; border-radius: 6px;
        }
        .vup-title, .vup-desc, .vup-input {
          width: 100%; box-sizing: border-box; background: var(--surface-2); color: var(--text);
          border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px;
          font-size: 14px; font-family: inherit; outline: none; resize: none; margin-bottom: 12px;
        }
        .vup-title { flex: 1; height: 170px; margin-bottom: 0; }
        .vup-desc { height: 110px; }
        .vup-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 12px 4px; border-bottom: 1px solid var(--border); font-size: 14px;
        }
        .vup-row select {
          background: var(--surface-2); color: var(--text); border: 1px solid var(--border);
          border-radius: 8px; padding: 6px 8px; font-size: 13px; max-width: 55%;
        }
        .vup-row input[type="checkbox"] { width: 20px; height: 20px; accent-color: var(--accent); }
        .vup-error { color: var(--accent); font-size: 12px; margin: 12px 0 0; }
        .vup-progress { height: 6px; background: var(--surface-2); border-radius: 6px; overflow: hidden; margin: 12px 0 0; }
        .vup-progress div { height: 100%; background: var(--accent); transition: width 0.2s; }
        .vup .post-submit { margin-top: 16px; width: 100%; }
        .vup-done { display: flex; flex-direction: column; gap: 12px; align-items: center; text-align: center; padding: 60px 10px; }
        .vup-entry {
          width: 100%; margin-bottom: 12px; padding: 10px 12px; border-radius: 10px; cursor: pointer;
          background: var(--surface-2); color: var(--text); border: 1px dashed var(--border);
          display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px;
        }
        .home-tabs { display: flex; gap: 8px; max-width: 640px; margin: 0 auto; padding: 12px 16px 0; }
        .home-tabs button {
          flex: 1; padding: 9px 0; border-radius: 999px; border: 1px solid var(--border);
          background: var(--surface); color: var(--text-muted); font-weight: 600; font-size: 13px; cursor: pointer;
        }
        .home-tabs button.active {
          color: #fff; border-color: transparent;
          background: linear-gradient(135deg, var(--accent), #b04bff);
          box-shadow: 0 4px 18px rgba(255, 77, 109, 0.35);
        }
        .vf { max-width: 640px; margin: 0 auto; padding: 12px 16px 90px; }
        .vf-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: none; }
        .vf-chips::-webkit-scrollbar { display: none; }
        .vf-chips button {
          flex: 0 0 auto; padding: 7px 14px; border-radius: 999px; border: 1px solid var(--border);
          background: var(--surface); color: var(--text-muted); font-size: 12.5px; cursor: pointer; white-space: nowrap;
        }
        .vf-chips button.active { background: var(--text); color: var(--bg); border-color: var(--text); font-weight: 600; }
        .vf-card {
          display: block; width: 100%; text-align: left; padding: 0; margin-bottom: 18px; cursor: pointer;
          background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: hidden;
          color: var(--text); transition: transform 0.15s, box-shadow 0.15s;
        }
        .vf-card:active { transform: scale(0.985); }
        .vf-thumb { position: relative; aspect-ratio: 16 / 9; background: var(--surface-2); overflow: hidden; }
        .vf-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .vf-thumb::after {
          content: ""; position: absolute; inset: auto 0 0 0; height: 45%;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.55), transparent); pointer-events: none;
        }
        .vf-dur {
          position: absolute; right: 8px; bottom: 8px; z-index: 1; background: rgba(0, 0, 0, 0.75); color: #fff;
          font-size: 11.5px; font-weight: 600; padding: 3px 8px; border-radius: 8px;
        }
        .vf-info { display: flex; gap: 10px; padding: 12px; align-items: flex-start; }
        .vf-avatar {
          flex: 0 0 36px; height: 36px; border-radius: 50%; display: grid; place-items: center;
          font-weight: 700; font-size: 14px; color: #fff; background: linear-gradient(135deg, #7c5cff, var(--accent-2));
        }
        .vf-meta { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .vf-meta strong {
          font-size: 14.5px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .vf-meta span { font-size: 12px; color: var(--text-muted); }
        .vf-skel .vf-thumb, .vf-skel .vf-avatar, .vf-skel .vf-meta strong, .vf-skel .vf-meta span {
          background: linear-gradient(90deg, var(--surface-2) 25%, #362e44 50%, var(--surface-2) 75%);
          background-size: 200% 100%; animation: vf-shimmer 1.3s infinite; border-radius: 8px; color: transparent;
        }
        @keyframes vf-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .vf-overlay {
          position: fixed; inset: 0; z-index: 1000; background: rgba(8, 6, 12, 0.88);
          display: flex; align-items: flex-start; justify-content: center; overflow-y: auto;
        }
        .vf-player { position: relative; width: 100%; max-width: 640px; padding: 0 0 40px; }
        .vf-player video { width: 100%; aspect-ratio: 16 / 9; background: #000; display: block; }
        .vf-close {
          position: absolute; top: 10px; right: 10px; z-index: 2; width: 34px; height: 34px; border-radius: 50%;
          border: none; background: rgba(0, 0, 0, 0.6); color: #fff; display: grid; place-items: center; cursor: pointer;
        }
        .vf-player h3 { font-size: 17px; margin: 14px 16px 4px; line-height: 1.35; }
        .vf-sub { font-size: 12.5px; color: var(--text-muted); margin: 0 16px 12px; }
        .vf-actions { display: flex; gap: 8px; margin: 0 16px 12px; }
        .vf-actions button {
          display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 999px; cursor: pointer;
          background: var(--surface-2); border: 1px solid var(--border); color: var(--text); font-size: 13px;
        }
        .vf-actions button.active { background: var(--accent); border-color: var(--accent); color: #fff; }
        .vf-desc { margin: 0 16px 10px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
        .vf-tags { margin: 0 16px; display: flex; flex-wrap: wrap; gap: 8px; }
        .vf-tags span { color: var(--accent-2); font-size: 13px; }
        .vf-comments { margin: 18px 16px 0; padding-top: 14px; border-top: 1px solid var(--border); }
        .vf-comments h4 { margin: 0 0 12px; font-size: 14.5px; }
        .vf-muted { color: var(--text-muted); font-size: 13px; margin: 8px 0; }
        .vf-cerr { color: var(--accent); font-size: 12px; margin: 8px 0; }
        .vf-cform { display: flex; gap: 8px; margin-bottom: 14px; }
        .vf-cform input {
          flex: 1; min-width: 0; background: var(--surface-2); color: var(--text); border: 1px solid var(--border);
          border-radius: 999px; padding: 10px 14px; font-size: 14px; outline: none;
        }
        .vf-cform button {
          padding: 0 18px; border-radius: 999px; border: none; cursor: pointer; font-weight: 600; font-size: 13px;
          color: #fff; background: linear-gradient(135deg, var(--accent), #b04bff);
        }
        .vf-cform button:disabled { opacity: 0.45; cursor: default; }
        .vf-comment { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 14px; }
        .vf-avatar-sm { flex: 0 0 30px; height: 30px; font-size: 12px; }
        .vf-ctext { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .vf-ctext strong { font-size: 13px; }
        .vf-ctext em { font-style: normal; font-weight: 400; color: var(--text-muted); font-size: 11.5px; margin-left: 6px; }
        .vf-ctext span { font-size: 14px; line-height: 1.4; word-break: break-word; }
        .vf-cdel { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; }
        .cm { max-width: 640px; margin: 0 auto; padding: 12px 16px 90px; }
        .cm-h { font-size: 18px; margin: 4px 0 14px; }
        .cm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; }
        .cm-card {
          position: relative; overflow: hidden; text-align: left; border: none; border-radius: 18px; cursor: pointer;
          min-height: 118px; padding: 14px; color: #fff; display: flex; flex-direction: column; gap: 4px;
          justify-content: flex-end; transition: transform 0.15s;
        }
        .cm-card:active { transform: scale(0.97); }
        .cm-card strong { font-size: 16px; position: relative; z-index: 1; }
        .cm-count { font-size: 12px; opacity: 0.9; position: relative; z-index: 1; }
        .cm-letter {
          position: absolute; right: -6px; top: -18px; font-size: 96px; font-weight: 800;
          color: rgba(255, 255, 255, 0.18); line-height: 1; pointer-events: none;
        }
        .cm-skel {
          background: linear-gradient(90deg, var(--surface-2) 25%, #362e44 50%, var(--surface-2) 75%);
          background-size: 200% 100%; animation: vf-shimmer 1.3s infinite;
        }
        .cm-join {
          align-self: flex-start; margin-top: 6px; padding: 7px 18px; border-radius: 999px; border: none; cursor: pointer;
          font-size: 13px; font-weight: 700; color: #fff; background: linear-gradient(135deg, var(--accent), #b04bff);
          position: relative; z-index: 1;
        }
        .cm-join.sm { padding: 5px 14px; font-size: 12px; }
        .cm-card .cm-join { background: rgba(0, 0, 0, 0.35); }
        .cm-join.joined { background: var(--surface-2); color: var(--text-muted); border: 1px solid var(--border); }
        .cm-card .cm-join.joined { background: rgba(255, 255, 255, 0.25); color: #fff; border: none; }
        .cm-row {
          display: flex; align-items: center; gap: 12px; padding: 12px 4px; cursor: pointer;
          border-bottom: 1px solid var(--border);
        }
        .cm-row .cm-join { margin-top: 0; align-self: center; }
        .cm-rowtext { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .cm-rowtext strong { font-size: 14.5px; }
        .cm-rowtext span { font-size: 12px; color: var(--text-muted); }
        .cm-head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .cm-title { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .cm-title strong { font-size: 17px; }
        .cm-title span { font-size: 12px; color: var(--text-muted); }
        .cm-head .cm-join { margin-top: 0; }
        .vf-mine .vf-chips { display: none; }
        .pc { padding: 0 12px 6px; }
        .pc-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 4px 0 12px; text-align: center; }
        .pc-stats div { display: flex; flex-direction: column; gap: 2px; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 10px 2px; }
        .pc-stats strong { font-size: 16px; }
        .pc-stats span { font-size: 11px; color: var(--text-muted); }
        .pc-bio { font-size: 14px; color: var(--text-muted); margin: 0 0 12px; line-height: 1.45; }
        .pc-actions { display: flex; gap: 8px; margin-bottom: 12px; }
        .pc-actions button {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 0;
          border-radius: 12px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text);
          font-size: 13.5px; font-weight: 600; cursor: pointer;
        }
        .pc-actions button:disabled { opacity: 0.5; }
        .pc-actions .pc-menu { flex: 0 0 46px; font-size: 18px; }
        .pc-toggle {
          width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 12px 14px;
          background: var(--surface); border: 1px solid var(--border); border-radius: 12px; color: var(--text);
          font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 12px;
        }
        .pc-toast {
          position: fixed; left: 50%; bottom: 90px; transform: translateX(-50%); z-index: 3000;
          background: var(--text); color: var(--bg); padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: 600;
        }
        .pc-page { position: fixed; inset: 0; z-index: 2000; background: var(--bg); overflow-y: auto; padding: 14px 16px 60px; }
        .pc-pagehead { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .pc-pagehead h2 { font-size: 18px; margin: 0; }
        .pc-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .pc-field > span { font-size: 12px; color: var(--text-muted); }
        .pc-field input, .pc-field select, .pc-field textarea, .pc-pwbox input {
          width: 100%; box-sizing: border-box; background: var(--surface); color: var(--text); border: 1px solid var(--border);
          border-radius: 12px; padding: 12px 14px; font-size: 15px; font-family: inherit; outline: none;
        }
        .pc-field textarea { height: 90px; resize: none; }
        .pc-field input[readonly] { opacity: 0.6; }
        .pc-field em, .pc-pwbox em { font-style: normal; font-size: 12px; color: var(--text-muted); }
        .pc-field em.ok, .pc-pwbox em.ok { color: #3ddc97; }
        .pc-field em.bad, .pc-pwbox em.bad { color: var(--accent); }
        .pc-pwrow {
          width: 100%; display: flex; justify-content: space-between; padding: 12px 14px; margin-bottom: 12px;
          background: var(--surface); border: 1px solid var(--border); border-radius: 12px; color: var(--text); font-size: 15px; cursor: pointer;
        }
        .pc-pwbox { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
        .pc-pwbox button {
          padding: 10px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; color: #fff;
          background: linear-gradient(135deg, var(--accent), #b04bff);
        }
        .pc-error { color: var(--accent); font-size: 13px; margin: 6px 0 0; }
        .pc-save { width: 100%; margin-top: 14px; }
        .pc-overlay { position: fixed; inset: 0; z-index: 2500; background: rgba(8, 6, 12, 0.7); display: flex; justify-content: flex-end; }
        .pc-center { justify-content: center; align-items: center; padding: 20px; }
        .pc-drawer {
          width: 78%; max-width: 320px; height: 100%; background: var(--surface); overflow-y: auto;
          display: flex; flex-direction: column; border-left: 1px solid var(--border);
        }
        .pc-drawerhead { display: flex; align-items: center; gap: 12px; padding: 22px 18px; border-bottom: 1px solid var(--border); }
        .pc-drawer > button {
          text-align: left; padding: 16px 18px; background: transparent; border: none; color: var(--text);
          font-size: 15px; border-bottom: 1px solid var(--border); cursor: pointer;
        }
        .pc-info { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 20px; max-width: 360px; width: 100%; }
        .pc-info h3 { margin: 0 0 10px; font-size: 17px; }
        .pc-info p { margin: 0 0 16px; font-size: 14px; line-height: 1.55; color: var(--text-muted); }
        .pc-info button {
          width: 100%; padding: 10px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; color: #fff;
          background: linear-gradient(135deg, var(--accent), #b04bff);
        }
        /* cm-fix */
        .cm-card { isolation: isolate; }
        .cm-row .cm-join, .cm-head .cm-join { z-index: auto; }
        .flag-img { border-radius: 4px; object-fit: cover; display: inline-block; vertical-align: middle; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18); }
        .flag-fallback { font-size: 22px; }
        .wd-bigflag .flag-img { border-radius: 8px; }
        .pc-stats div { min-width: 0; }
        .pc-stats .pc-cname { display: block; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
        .trending-chip span:first-child {
          display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-size: 12px; font-weight: 600;
        }
        .trending-chip-likes { font-size: 11px; opacity: 0.85; }
        .no-results { color: var(--text-muted); font-size: 13px; text-align: center; padding: 30px 0; }
        .feed-status {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          color: var(--text-muted); text-align: center; padding: 38px 12px; font-size: 14px;
        }
        .feed-status-error { flex-direction: column; color: var(--text); }
        .feed-status button, .profile-posts-error button {
          border: 1px solid var(--border); border-radius: 18px; background: var(--surface-2);
          color: var(--text); padding: 7px 14px; cursor: pointer;
        }
        .load-more-posts {
          width: 100%; padding: 11px; border: 1px solid var(--border); border-radius: 12px;
          color: var(--text); background: var(--surface); font: inherit; cursor: pointer;
        }
        .load-more-posts:disabled { opacity: .6; cursor: default; }
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
          overflow: hidden;
        }
        .avatar-image { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
        .post-head-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .post-user {
          display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-size: 14px; font-weight: 600;
        }
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
        .post-detail-video-wrap {
          position: relative; height: 280px; overflow: hidden; border-radius: 12px; background: #000;
        }
        .post-detail-video-wrap .post-media { display: block; width: 100%; height: 100%; border-radius: 0; }
        .post-video-toggle {
          position: absolute; left: 50%; top: 50%; z-index: 1; transform: translate(-50%, -50%);
          width: 68px; height: 68px; display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,.45); border-radius: 50%;
          color: white; background: rgba(0,0,0,.58); cursor: pointer;
          box-shadow: 0 3px 14px rgba(0,0,0,.35);
          transition: opacity .22s ease, transform .22s ease;
        }
        .post-video-toggle.is-playing { opacity: 0; pointer-events: none; }
        .post-video-toggle:focus-visible {
          opacity: 1; outline: 2px solid white; outline-offset: 4px;
        }
        .post-video-toggle:active { transform: translate(-50%, -50%) scale(.96); }
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
        .main-sparks {
          height: 100dvh; min-height: 0; max-width: none; padding: 0; margin: 0;
          position: relative; overflow: hidden;
        }
        .sparks-scroller {
          position: relative; width: 100%; height: 100%; max-width: none; margin: 0;
          overflow-y: auto; overflow-x: hidden; border-radius: 0;
          scroll-snap-type: y mandatory; overscroll-behavior-y: contain;
          scrollbar-width: none; touch-action: pan-y;
        }
        .sparks-scroller::-webkit-scrollbar { display: none; }
        .short-card {
          height: calc(100vh - 32px);
          scroll-snap-align: start;
          scroll-snap-stop: always;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          overflow: hidden;
        }
        .sparks-card { width: 100%; height: 100%; min-height: 100%; border-radius: 0; }
        .sparks-card .spark-video-vertical { object-fit: cover; object-position: center; }
        .sparks-card .spark-video-horizontal { object-fit: contain; object-position: center; background: #000; }
        .sparks-card:fullscreen,
        .sparks-card:-webkit-full-screen {
          width: 100vw; height: 100vh; height: 100dvh; min-height: 100vh; min-height: 100dvh; max-width: none;
          border-radius: 0; background: #000;
        }
        .sparks-card:fullscreen .short-video,
        .sparks-card:-webkit-full-screen .short-video {
          width: 100%; height: 100%; object-fit: contain; background: #000;
        }
        .sparks-card:fullscreen .spark-video-vertical,
        .sparks-card:-webkit-full-screen .spark-video-vertical { object-fit: cover; }
        .sparks-card:fullscreen .spark-video-horizontal,
        .sparks-card:-webkit-full-screen .spark-video-horizontal { object-fit: contain; }
        .sparks-card:fullscreen .mute-btn,
        .sparks-card:-webkit-full-screen .mute-btn { top: calc(env(safe-area-inset-top, 0px) + 16px); }
        .fullscreen-rail-btn { white-space: nowrap; }
        .sparks-topbar {
          position: absolute; top: calc(env(safe-area-inset-top, 0px) + 12px);
          left: 16px; right: 16px; z-index: 6;
          display: flex; justify-content: space-between; align-items: center;
          pointer-events: none;
        }
        .sparks-title {
          display: flex; align-items: center; gap: 8px; color: white;
          font-size: 18px; font-weight: 700; text-shadow: 0 1px 8px rgba(0,0,0,.55);
        }
        .sparks-title svg { color: #FFD166; }
        .sparks-create {
          display: flex; align-items: center; gap: 7px; padding: 9px 12px;
          border: 1px solid rgba(255,255,255,.3); border-radius: 22px;
          color: white; background: rgba(18,15,24,.55); backdrop-filter: blur(10px);
          font-size: 12px; font-weight: 600; cursor: pointer; pointer-events: auto;
        }
        .sparks-scroller .sparks-card .mute-btn { top: 62px; }
        .shorts-status {
          position: absolute; z-index: 5; top: 50%; left: 50%; transform: translate(-50%, -50%);
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          width: min(82%, 360px); padding: 22px; border: 1px solid var(--border);
          border-radius: 16px; background: rgba(32,27,41,.94); color: var(--text-muted);
          text-align: center; font-size: 13px;
        }
        .shorts-status strong { color: var(--text); font-size: 16px; }
        .shorts-status button {
          border: 0; border-radius: 20px; padding: 9px 15px; background: var(--accent);
          color: white; font-weight: 600; cursor: pointer;
        }
        .shorts-status-error { color: var(--text); }
        .short-play { color: rgba(255,255,255,0.85); opacity: 0.9; }
        .short-unavailable {
          position: absolute; inset: 0; display: grid; place-items: center;
          padding: 20px; color: rgba(255,255,255,.75); font-size: 14px; text-align: center;
        }
        .mute-btn {
          position: absolute; top: 16px; right: 16px;
          background: rgba(0,0,0,0.35); border: none; color: white;
          border-radius: 50%; width: 36px; height: 36px; cursor: pointer;
          display: grid; place-items: center; z-index: 3;
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
        .short-views { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: rgba(255,255,255,.78); margin-top: 7px; }
        .spark-upload-view { width: 100%; max-width: 560px; margin: 0 auto; padding-bottom: 30px; }
        .spark-upload-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .spark-upload-header h2 { font-size: 21px; }
        .spark-upload-form {
          padding: 18px; border: 1px solid var(--border); border-radius: 18px;
          background: var(--surface);
        }
        .visually-hidden {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }
        .spark-picker {
          min-height: 250px; border: 1.5px dashed var(--border); border-radius: 14px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 10px; padding: 24px; text-align: center; color: var(--text-muted);
        }
        .spark-picker > svg { color: #FFD166; }
        .spark-picker strong { color: var(--text); font-size: 17px; }
        .spark-picker > span { max-width: 330px; font-size: 13px; line-height: 1.5; }
        .spark-picker-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 9px; margin-top: 10px; }
        .spark-picker-actions button {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          border: 1px solid var(--border); border-radius: 22px; padding: 10px 14px;
          color: var(--text); background: var(--surface-2); font-size: 12px;
          font-weight: 600; cursor: pointer;
        }
        .spark-picker-actions button:hover { border-color: var(--accent); }
        .spark-upload-preview { position: relative; margin-bottom: 8px; }
        .spark-upload-preview video {
          display: block; width: 100%; max-height: min(56vh, 540px);
          object-fit: contain; border-radius: 12px; background: #08070A;
        }
        .spark-change-video {
          position: absolute; top: 10px; right: 10px; border: 0; border-radius: 18px;
          padding: 7px 11px; background: rgba(0,0,0,.62); color: white;
          font-size: 11px; cursor: pointer;
        }
        .spark-duration { min-height: 18px; margin: 5px 0 14px; color: var(--text-muted); font-size: 12px; }
        .spark-caption-label { display: block; margin: 12px 0 7px; font-size: 13px; font-weight: 600; }
        .spark-upload-form textarea { min-height: 90px; margin-bottom: 8px; }
        .spark-upload-error { color: #FF6B82; font-size: 13px; margin: 2px 0 12px; }
        .spark-submit:disabled { opacity: .5; cursor: not-allowed; }
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
        .profile-tabs {
          display: flex; gap: 20px; padding: 0 12px; margin: 0 0 12px;
          border-bottom: 1px solid var(--border);
        }
        .profile-tabs button {
          position: relative; border: 0; background: none; color: var(--text-muted);
          padding: 10px 4px; font: inherit; font-size: 13px; cursor: pointer;
        }
        .profile-tabs button.active { color: var(--text); font-weight: 600; }
        .profile-tabs button.active::after {
          content: ""; position: absolute; height: 2px; left: 0; right: 0; bottom: -1px;
          background: var(--accent); border-radius: 2px;
        }
        .profile-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 0 12px; }
        .grid-thumb {
          position: relative; aspect-ratio: 1; border: 0; border-radius: 8px; padding: 0;
          overflow: hidden; background: var(--surface-2); cursor: pointer;
        }
        .grid-thumb img, .grid-thumb video { width: 100%; height: 100%; display: block; object-fit: cover; }
        .grid-video-play {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          color: white; pointer-events: none;
        }
        .grid-video-play-circle {
          width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
          border-radius: 50%; background: rgba(0,0,0,.58);
          box-shadow: 0 2px 10px rgba(0,0,0,.35); backdrop-filter: blur(2px);
        }
        .grid-thumb-username {
          position: absolute; left: 0; right: 0; bottom: 0; overflow: hidden;
          padding: 18px 7px 6px; color: white; text-align: left; font-size: 11px;
          font-weight: 600; text-overflow: ellipsis; white-space: nowrap;
          background: linear-gradient(transparent, rgba(0,0,0,.75));
        }
        .icon-btn.saved { color: var(--accent); }
        .icon-btn:disabled { opacity: .65; cursor: wait; }
        .share-toast {
          position: fixed; left: 50%; bottom: 92px; z-index: 80; transform: translateX(-50%);
          border: 1px solid var(--border); border-radius: 22px; padding: 10px 16px;
          color: var(--text); background: var(--surface-2); box-shadow: 0 8px 28px rgba(0,0,0,.35);
          font-size: 13px; animation: toast-in .16s ease-out;
        }
        @keyframes toast-in { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .profile-posts-status { color: var(--text-muted); text-align: center; font-size: 13px; padding: 24px 12px; }
        .profile-posts-error { display: flex; align-items: center; justify-content: center; gap: 10px; }
        .comments-error { color: #FF6B82; font-size: 12px; margin: 0 0 10px; }
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
        .comment-error { color: #FF6B82; font-size: 12px; margin: 0 0 10px; }
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
        .post-detail-modal {
          width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
          padding: 20px; border: 1px solid var(--border); border-radius: 18px; background: var(--surface);
        }
        .post-detail-modal .post-card { margin: 0; }
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
          .main.main-sparks { height: calc(100dvh - 64px); padding: 0; }
          .bottom-nav {
            position: fixed; bottom: 0; left: 0; right: 0;
            display: flex; justify-content: space-around; align-items: center;
            background: var(--surface); border-top: 1px solid var(--border);
            min-height: 64px; padding: 7px 0 env(safe-area-inset-bottom, 0px);
          }
          .bottom-nav button {
            flex: 1; height: 42px; display: grid; place-items: center; position: relative; position: relative;
            background: none; border: none; color: var(--text-muted); cursor: pointer;
          }
          .bottom-nav button.active { color: var(--accent); }
          .shorts-scroller { height: calc(100dvh - 90px); }
          .shorts-scroller .short-card { height: calc(100dvh - 90px); }
          .shorts-scroller.sparks-scroller { height: 100%; }
          .shorts-scroller.sparks-scroller .sparks-card { height: 100%; min-height: 100%; }
          .sparks-card .short-rail { right: 10px; bottom: 110px; }
          .sparks-card .short-info { bottom: 28px; }
          .spark-upload-view { padding-bottom: 86px; }
        }
        @media (max-width: 420px) {
          .sparks-title { font-size: 16px; }
          .sparks-create { padding: 8px 10px; }
          .spark-upload-form { padding: 14px; }
          .spark-picker-actions { flex-direction: column; width: 100%; }
          .spark-picker-actions button { width: 100%; }
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
            className={"nav-item" + (view === item.key || (item.key === "feed" && (view === "videos" || view === "communities")) ? " active" : "")}
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

      <main className={"main" + (view === "sparks" ? " main-sparks" : "")}>
        {(view === "feed" || view === "videos" || view === "communities") && (
          <div className="home-tabs">
            <button type="button" className={view === "feed" ? "active" : ""} onClick={() => setView("feed")}>Posts</button>
            <button type="button" className={view === "videos" ? "active" : ""} onClick={() => setView("videos")}>Videos</button>
            <button type="button" className={view === "communities" ? "active" : ""} onClick={() => setView("communities")}>Communities</button>
          </div>
        )}
        {view === "videos" && <VideosFeed token={user?.token} userId={user?.id} />}
        {view === "communities" && <CommunitiesView token={user?.token} userId={user?.id} />}
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

            {!searchQuery && posts.length > 0 && (
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

            {postsLoading && posts.length === 0 && (
              <p className="feed-status">Loading posts…</p>
            )}
            {postsError && (
              <div className="feed-status feed-status-error" role="alert">
                <span>{postsError}</span>
                <button type="button" onClick={() => setPostsRetry((retry) => retry + 1)}>Retry</button>
              </div>
            )}
            {!postsLoading && !postsError && posts.length === 0 && !searchQuery && (
              <p className="feed-status">No posts yet</p>
            )}
            {!postsLoading && !postsError && posts.length > 0 && filteredPosts.length === 0 && (
              <p className="no-results">"{searchQuery}" ke liye koi post nahi mila</p>
            )}

            {filteredPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                liked={liked}
                onLike={togglePostLike}
                following={followingIds}
                onFollow={toggleUserFollow}
                onOpenComments={setActiveCommentsPost}
                currentUserId={user?.id}
                saved={savedPostIds.has(p.id)}
                saving={savingPostIds.has(p.id)}
                onSave={togglePostSave}
                onShare={sharePost}
              />
            ))}
            {!searchQuery && postsHasMore && (
              <button className="load-more-posts" type="button" onClick={loadMorePosts} disabled={postsMoreLoading}>
                {postsMoreLoading ? "Loading…" : "Load more"}
              </button>
            )}
          </>
        )}
        {(view === "shorts" || view === "sparks") && (
          <ShortsView
            shorts={shorts}
            liked={liked}
            onLike={toggleShortLike}
            following={following}
            onFollow={toggleFollow}
            commentsByShort={commentsByShort}
            onOpenComments={setActiveCommentsShort}
            onView={markShortViewed}
            onShare={shareShort}
            loading={shortsLoading}
            error={shortsError}
            onRetry={() => setShortsRetry((attempt) => attempt + 1)}
            isSparks={view === "sparks"}
            onCreate={() => setView("spark-upload")}
          />
        )}
        {view === "spark-upload" && (
          <SparksUploadView
            token={user?.token}
            onBack={() => setView("sparks")}
            onShortUploaded={onShortUploaded}
          />
        )}
        {view === "profile" && (
          <ProfileView
            posts={profilePosts}
            savedPosts={savedPosts}
            profileTab={profileTab}
            onTabChange={setProfileTab}
            following={following}
            user={user}
            followersCount={profileFollowers}
            followingCount={followingIds.size}
            loading={profilePostsLoading}
            error={profilePostsError}
            onRetry={() => setProfilePostsRetry((retry) => retry + 1)}
            savedLoading={savedPostsLoading}
            savedError={savedPostsError}
            onSavedRetry={() => setSavedPostsRetry((retry) => retry + 1)}
            onOpenPost={setSelectedProfilePost}
            onLogout={() => setUser(null)}
          />
        )}
        {view === "video-upload" && (
          <VideoUploadView
            token={user?.token}
            onBack={() => setView("feed")}
            onDone={() => setView("videos")}
          />
        )}
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
        {navItems.filter((item) => item.key !== "settings").map((item) => (
          <button
            key={item.key}
            className={view === item.key || (item.key === "feed" && (view === "videos" || view === "communities")) ? "active" : ""}
            onClick={() => (item.key === "upload" ? setShowUpload(true) : setView(item.key))}
            aria-label={item.label}
            title={item.label}
          >
            <item.icon size={22} />
            {!!item.badge && <span className="nav-badge nav-badge-mobile" />}
          </button>
        ))}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onPost={addPost}
          onShortUploaded={onShortUploaded}
          onOpenVideoUpload={() => { setShowUpload(false); setView("video-upload"); }}
          token={user?.token}
          user={user}
        />
      )}
      {selectedProfilePost && (
        <div className="modal-overlay" onClick={() => setSelectedProfilePost(null)}>
          <div className="post-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Post</h3>
              <button className="icon-btn" type="button" onClick={() => setSelectedProfilePost(null)} aria-label="Close post">
                <X size={20} />
              </button>
            </div>
            <PostCard
              post={selectedProfilePost}
              liked={liked}
              onLike={togglePostLike}
              following={followingIds}
              onFollow={toggleUserFollow}
              onOpenComments={setActiveCommentsPost}
              currentUserId={user?.id}
              saved={savedPostIds.has(selectedProfilePost.id)}
              saving={savingPostIds.has(selectedProfilePost.id)}
              onSave={togglePostSave}
              onShare={sharePost}
              isDetailView
            />
          </div>
        </div>
      )}
      {activeCommentsPost && (
        <CommentsModal
          post={activeCommentsPost}
          comments={[
            ...(activeCommentsPost.commentsList || []),
            ...(commentsByPost[activeCommentsPost.id] || []),
          ]}
          currentUser={user}
          onAddComment={addComment}
          onClose={() => setActiveCommentsPost(null)}
          isPost
        />
      )}
      {activeCommentsShort && (
        <CommentsModal
          post={activeCommentsShort}
          comments={[
            ...(activeCommentsShort.commentsList || []),
            ...(commentsByShort[activeCommentsShort.id] || []),
          ]}
          currentUser={user}
          onAddComment={addShortComment}
          onClose={() => setActiveCommentsShort(null)}
        />
      )}
      {shareToast && <div className="share-toast" role="status">Link copied</div>}
    </div>
  );
}
