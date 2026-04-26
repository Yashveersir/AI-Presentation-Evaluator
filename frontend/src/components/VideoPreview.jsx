import { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

export default function VideoPreview({ videoUrl, fileName }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setDuration(video.duration);
    const onEnded = () => setPlaying(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.pause();
    } else {
      video.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * duration;
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (video?.requestFullscreen) video.requestFullscreen();
  };

  const formatTime = (t) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass-card" style={{ overflow: "hidden" }}>
      {/* Video */}
      <div style={{ position: "relative", background: "#000", cursor: "pointer" }}>
        <video
          ref={videoRef}
          src={videoUrl}
          style={{
            width: "100%",
            maxHeight: 360,
            objectFit: "contain",
            display: "block",
          }}
          onClick={togglePlay}
          playsInline
          id="video-player"
        />

        {/* Play overlay */}
        {!playing && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.3)",
            }}
            onClick={togglePlay}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)",
                transition: "transform 0.2s",
              }}
            >
              <Play size={28} color="white" style={{ marginLeft: 3 }} />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: "0.75rem 1rem" }}>
        {/* Seekbar */}
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: "var(--surface-300)",
            cursor: "pointer",
            marginBottom: "0.75rem",
            position: "relative",
          }}
          onClick={handleSeek}
          id="seek-bar"
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "var(--gradient-primary)",
              borderRadius: 2,
              transition: "width 0.1s linear",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -4,
              left: `${progressPct}%`,
              transform: "translateX(-50%)",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "var(--primary-500)",
              border: "2px solid white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={togglePlay}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--surface-900)",
                padding: 4,
                display: "flex",
              }}
              id="play-pause"
            >
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              onClick={toggleMute}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--surface-700)",
                padding: 4,
                display: "flex",
              }}
              id="mute-toggle"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <span style={{ fontSize: "0.8rem", color: "var(--surface-600)", fontFamily: "var(--font-mono)" }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {fileName && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--surface-500)",
                  maxWidth: 150,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fileName}
              </span>
            )}
            <button
              onClick={handleFullscreen}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--surface-700)",
                padding: 4,
                display: "flex",
              }}
              id="fullscreen-btn"
            >
              <Maximize size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
