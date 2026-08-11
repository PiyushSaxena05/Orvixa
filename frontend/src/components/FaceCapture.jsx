import { useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'

let modelsLoaded = false

async function loadModels() {
  if (modelsLoaded) return
  const MODEL_URL = '/models'
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
  modelsLoaded = true
  console.log('ssdMobilenetv1 loaded:', faceapi.nets.ssdMobilenetv1.isLoaded)
  console.log('faceLandmark68Net loaded:', faceapi.nets.faceLandmark68Net.isLoaded)
  console.log('faceRecognitionNet loaded:', faceapi.nets.faceRecognitionNet.isLoaded)
}

function FaceCapture({ onCapture, buttonLabel = 'Scan Face' }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  const startScan = async () => {
    setError('')
    setStatus('loading')
    try {
      await loadModels()
      setStatus('scanning')
    } catch (err) {
      console.error('Model load error:', err)
      setError(`Model load error: ${err.name} - ${err.message}`)
      setStatus('error')
    }
  }

  useEffect(() => {
    if (status !== 'scanning') return

    let stream

    const enableCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: {} })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        console.error(err)
        setError(`Camera error: ${err.name} - ${err.message}`)
        setStatus('error')
      }
    }

    enableCamera()

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop())
    }
  }, [status])

  const captureAndDetect = async () => {
    console.log('=== CAPTURE CLICKED ===')
    setStatus('detecting')

    if (videoRef.current.readyState < 2) {
      await new Promise((resolve) => {
        videoRef.current.onloadeddata = resolve
      })
    }

    console.log('Video ready state:', videoRef.current.readyState)
    console.log('Video actual size:', videoRef.current.videoWidth, videoRef.current.videoHeight)
    console.log('ssdMobilenetv1 isLoaded:', faceapi.nets.ssdMobilenetv1.isLoaded)

    try {
      // Sabse pehle low confidence pe saare detections dhundo, dikhne ke liye
      const allBoxes = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.05 })
      )
      console.log('Raw boxes found at 0.05 confidence:', allBoxes.length, allBoxes)

      // Detection box ko canvas pe draw karo taaki dikhe
      if (canvasRef.current && allBoxes.length > 0) {
        const displaySize = { width: videoRef.current.width, height: videoRef.current.height }
        faceapi.matchDimensions(canvasRef.current, displaySize)
        const resized = faceapi.resizeResults(allBoxes, displaySize)
        const ctx = canvasRef.current.getContext('2d')
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        faceapi.draw.drawDetections(canvasRef.current, resized)
      }

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.05 }))
        .withFaceLandmarks()
        .withFaceDescriptor()

      console.log('Final detection:', detection)

      if (!detection) {
        setError(`No face detected (found ${allBoxes.length} raw boxes at low confidence). Check console for details.`)
        setStatus('scanning')
        return
      }

      const descriptorArray = Array.from(detection.descriptor)
      stopCamera()
      setStatus('done')
      onCapture(descriptorArray)
    } catch (err) {
      console.error('Detection error:', err)
      setError(`Detection error: ${err.name} - ${err.message}`)
      setStatus('scanning')
    }
  }

  return (
    <div className="text-center">
      {status === 'idle' && (
        <button
          onClick={startScan}
          type="button"
          className="bg-brass hover:bg-brass-dim transition-colors text-ink font-medium px-4 py-2 rounded-lg text-sm"
        >
          {buttonLabel}
        </button>
      )}

      {status === 'loading' && <p className="text-sm text-text-muted">Loading camera...</p>}

      {(status === 'scanning' || status === 'detecting') && (
        <div>
          <div style={{ position: 'relative', width: 240, height: 180, margin: '0 auto' }}>
            <video
              ref={videoRef}
              width="240"
              height="180"
              muted
              className="rounded-lg border border-border-soft"
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
            <canvas
              ref={canvasRef}
              width="240"
              height="180"
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
          </div>
          <button
            onClick={captureAndDetect}
            disabled={status === 'detecting'}
            type="button"
            className="mt-3 bg-brass hover:bg-brass-dim transition-colors text-ink font-medium px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {status === 'detecting' ? 'Detecting...' : 'Capture'}
          </button>
        </div>
      )}

      {status === 'done' && <p className="text-sm text-success">Face captured ✓</p>}
      {status === 'error' && (
        <button onClick={startScan} type="button" className="text-sm text-brass underline">
          Try again
        </button>
      )}

      {error && <p className="text-sm text-danger mt-2">{error}</p>}
    </div>
  )
}

export default FaceCapture
