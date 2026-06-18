'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize } from 'lucide-react'

export interface VideoPlayerProps {
  src: string
  poster?: string
  autoPlay?: boolean
  loop?: boolean
  className?: string
  onPlayingChange?: (playing: boolean) => void
}

function fmt(t: number) {
  if (!Number.isFinite(t) || t < 0) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoPlayer({
  src,
  poster,
  autoPlay = true,
  loop = true,
  className = '',
  onPlayingChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const idleTimerRef = useRef<number | null>(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(autoPlay)
  const [volume, setVolume] = useState(1)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isTouch, setIsTouch] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showVol, setShowVol] = useState(false) // slider de volume aberto

  // Detecta dispositivo touch
  useEffect(() => {
    if (typeof window === 'undefined') return
    const m = window.matchMedia('(hover: none) and (pointer: coarse)')
    const update = () => setIsTouch(m.matches)
    update()
    m.addEventListener?.('change', update)
    return () => m.removeEventListener?.('change', update)
  }, [])

  // Eventos do <video>
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => setCurrent(v.currentTime)
    const onLoaded = () => setDuration(v.duration || 0)
    const onPlay = () => { setPlaying(true); onPlayingChange?.(true) }
    const onPause = () => { setPlaying(false); onPlayingChange?.(false) }
    const onVol = () => { setMuted(v.muted); setVolume(v.volume) }
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onLoaded)
    v.addEventListener('durationchange', onLoaded)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('volumechange', onVol)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onLoaded)
      v.removeEventListener('durationchange', onLoaded)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('volumechange', onVol)
    }
  }, [onPlayingChange])

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  // Auto-hide com timeout: mostra → fica 3s → some (apenas com vídeo tocando + não touch)
  const bumpControls = () => {
    setShowControls(true)
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
    if (playing && !isTouch) {
      idleTimerRef.current = window.setTimeout(() => setShowControls(false), 3000)
    }
  }

  // Reseta timer quando estado de playing muda
  useEffect(() => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
    if (!playing || isTouch) {
      setShowControls(true) // pausado ou touch → sempre visível
    } else {
      // tocando + não-touch → mostra mas auto-esconde após 3s
      setShowControls(true)
      idleTimerRef.current = window.setTimeout(() => setShowControls(false), 3000)
    }
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
    }
  }, [playing, isTouch])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
    bumpControls()
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    if (!v.muted && v.volume === 0) v.volume = 0.5
    bumpControls()
  }

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Number(e.target.value)
    bumpControls()
  }

  const onVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    const val = Number(e.target.value)
    v.volume = val
    v.muted = val === 0
    bumpControls()
  }

  const toggleFullscreen = () => {
    const c = containerRef.current
    if (!c) return
    if (!document.fullscreenElement) c.requestFullscreen?.().catch(() => {})
    else document.exitFullscreen?.().catch(() => {})
  }

  const seekPct = duration ? (current / duration) * 100 : 0
  const volPct = (muted ? 0 : volume) * 100
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseMove={bumpControls}
      onMouseEnter={bumpControls}
      onTouchStart={bumpControls}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={autoPlay}
        loop={loop}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        className="absolute inset-0 h-full w-full object-contain bg-black cursor-pointer"
      />

      {/* Gradiente bottom-to-top */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-60'
        } bg-gradient-to-t from-black/85 via-black/30 to-transparent`}
      />

      {/* Controles */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 px-3 sm:px-6 pb-3 sm:pb-4 transition-all duration-300 ${
          showControls
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        {/* Seek bar */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-mono text-white/85 tabular-nums shrink-0 w-9 text-right">
            {fmt(current)}
          </span>
          <div className="vp-seek-wrap flex-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={current}
              onChange={onSeek}
              className="vp-range vp-seek"
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) ${seekPct}%, rgba(255,255,255,0.22) ${seekPct}%, rgba(255,255,255,0.22) 100%)`,
              }}
              aria-label="Posição do vídeo"
            />
          </div>
          <span className="text-[10px] sm:text-xs font-mono text-white/85 tabular-nums shrink-0 w-9">
            {fmt(duration)}
          </span>
        </div>

        {/* Linha de baixo: play, volume, fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-md hover:bg-white/30 active:scale-95 transition"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <Pause className="h-4 w-4 text-white" />
            ) : (
              <Play className="h-4 w-4 text-white ml-0.5" />
            )}
          </button>

          {/* Volume — slider escondido no mobile, só botão de mute */}
          <div
            className="flex items-center"
            onMouseEnter={() => setShowVol(true)}
            onMouseLeave={() => setShowVol(false)}
          >
            <button
              onClick={toggleMute}
              className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-md hover:bg-white/30 active:scale-95 transition"
              aria-label={muted ? 'Ativar som' : 'Silenciar'}
            >
              <VolumeIcon className="h-4 w-4 text-white" />
            </button>
            <div
              className={`hidden sm:block overflow-hidden transition-all duration-300 ${
                showVol ? 'w-20 ml-2' : 'w-0 ml-0'
              }`}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={onVolume}
                className="vp-range vp-vol w-20"
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) ${volPct}%, rgba(255,255,255,0.22) ${volPct}%, rgba(255,255,255,0.22) 100%)`,
                }}
                aria-label="Volume"
              />
            </div>
          </div>

          <div className="flex-1" />

          <button
            onClick={toggleFullscreen}
            className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-md hover:bg-white/30 active:scale-95 transition"
            aria-label={fullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
          >
            {fullscreen ? <Minimize className="h-4 w-4 text-white" /> : <Maximize className="h-4 w-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  )
}
