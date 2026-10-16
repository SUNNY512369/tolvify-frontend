import { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

const ACCENT = "#ff4d6d";

const fmt = (s) => {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return m + ":" + String(r).padStart(2, "0");
};

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  loop = false,
  muted = false,
  fit = "contain",
  barOffset = 8,
  style = {},
  onRef,
  ...rest
}) {
  const videoRef = useRef(null);
  const barRef = useRef(null);
  const draggingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (onRef) onRef(videoRef.current);
  }, [onRef]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const seekFromEvent = (e) => {
    const bar = barRef.current;
    const v = videoRef.current;
    if (!bar || !v || !v.duration) return;
    const r = bar.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    v.currentTime = p * v.duration;
    setProgress(p * 100);
    setTime(v.currentTime);
  };

  const onDown = (e) => {
    e.stopPropagation();
    draggingRef.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    seekFromEvent(e);
  };
  const onMove = (e) => {
    if (draggingRef.current) seekFromEvent(e);
  };
  const onUp = (e) => {
    draggingRef.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
  };

  return (
    <div
      onClick={toggle}
      style={{ position: "relative", width: "100%", height: "100%", background: "#000", overflow: "hidden", ...style }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        preload="metadata"
        style={{ width: "100%", height: "100%", objectFit: fit, display: "block" }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          if (draggingRef.current) return;
          const v = e.currentTarget;
          setTime(v.currentTime);
          setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
        }}
        {...rest}
      />

      <div
        style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(0,0,0,0.55)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: playing ? 0 : 1, transition: "opacity 0.25s",
          pointerEvents: "none",
        }}
      >
        {playing ? <Pause size={34} /> : <Play size={34} style={{ marginLeft: 4 }} />}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "absolute", left: 12, right: 12, bottom: barOffset }}
      >
        <div style={{ fontSize: 11, color: "#fff", opacity: 0.85, marginBottom: 2 }}>
          {fmt(time)} / {fmt(duration)}
        </div>
        <div
          ref={barRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{ position: "relative", height: 28, display: "flex", alignItems: "center", touchAction: "none", cursor: "pointer" }}
        >
          <div style={{ position: "relative", width: "100%", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.3)" }}>
            <div style={{ width: progress + "%", height: "100%", borderRadius: 2, background: ACCENT }} />
            <div
              style={{
                position: "absolute", top: "50%", left: progress + "%",
                width: 14, height: 14, borderRadius: "50%", background: ACCENT,
                transform: "translate(-50%, -50%)", boxShadow: "0 0 4px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
