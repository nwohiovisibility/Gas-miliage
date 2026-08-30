/*
Filename: CameraCapture.tsx
Last Edit Date: 2026-08-30 EST
Version: 1.2
*/
import { useEffect, useRef, useState } from 'react'

interface Props {
  label: string
  onCapture: (dataUrl: string) => void
  onSkip: () => void
  onBack?: () => void
}

export default function CameraCapture({ label, onCapture, onSkip, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Live camera not supported in this browser — use "Choose photo" below.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setReady(true)
        }
      } catch (err) {
        setError('Camera access was blocked. Allow camera permission, or use "Choose photo" below.')
      }
    }

    start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    onCapture(canvas.toDataURL('image/jpeg', 0.92))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onCapture(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="camera-capture">
      <p className="camera-label">{label}</p>
      {!error && (
        <div className="camera-viewport">
          <video ref={videoRef} playsInline muted />
          <div className="camera-frame-guide">
            <span />
          </div>
        </div>
      )}
      {error && <p className="camera-error">{error}</p>}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="camera-actions">
        <button className="btn btn-primary" onClick={capture} disabled={!ready}>
          📸 Capture
        </button>
        <label className="btn btn-secondary">
          Choose photo
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} hidden />
        </label>
      </div>
      <div className="camera-actions">
        <button className="btn btn-secondary" onClick={onSkip}>
          Enter manually
        </button>
        {onBack && (
          <button className="btn btn-secondary" onClick={onBack}>
            ‹ Back
          </button>
        )}
      </div>
    </div>
  )
}
