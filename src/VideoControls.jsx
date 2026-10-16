import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

const ACCENT = "#ff4d6d";

export default function VideoControls({ videoRef, showCenter = true }) {
  const trackRef = useRef(null);
  const draggingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    let raf = 0;
    const update = () => {
      if (!draggingRef.current && video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    const loop = () => {
      update();
      raf = requestAnimationFrame(loop);
    };
    const onPlay = () => {
      setPlaying(true);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(raf);
      update();
    };
    if (!video.paused) onPlay();
    else update();
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", update);
    video.addEventListener("loadedmetadata", update);
    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", update);
      video.removeEventListener("loadedmetadata", update);
    };
  }, [videoRef]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const seek = (e) => {
    const v = videoRef.current;
    const t = trackRef.current;
    if (!v || !t || !v.duration) return;
    const r = t.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    v.currentTime = p * v.duration;
    setProgress(p * 100);
  };

  const onDown = (e) => {
    draggingRef.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    seek(e);
  };
  const onMove = (e) => {
    if (draggingRef.current) seek(e);
  };
  const onUp = (e) => {
    draggingRef.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
  };

  return (
    <>
      <div
        onClick={toggle}
        style={{
          position: "absolute", inset: 0, display: showCenter ? "flex" : "none",
          alignItems: "center", justifyContent: "center",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div
          style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(0,0,0,0.55)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: playing ? 0 : 1, transition: "opacity 0.25s",
            pointerEvents: "none",
          }}
        >
          {playing ? <Pause size={34} /> : <Play size={34} style={{ marginLeft: 4 }} />}
        </div>
      </div>
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 28,
          zIndex: 2, touchAction: "none", cursor: "pointer",
          display: "flex", alignItems: "flex-end", padding: "0 12px 6px",
        }}
      >
        <div
          ref={trackRef}
          style={{
            position: "relative", width: "100%", height: 4,
            borderRadius: 2, background: "rgba(255,255,255,0.3)",
          }}
        >
          <div style={{ width: progress + "%", height: "100%", borderRadius: 2, background: ACCENT }} />
          <div
            style={{
              position: "absolute", top: "50%", left: progress + "%",
              width: 14, height: 14, borderRadius: "50%", background: ACCENT,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 4px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      </div>
    </>
  );
}
