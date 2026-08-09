import { useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'

let modelsLoaded = false

async function loadModels() {
  if (modelsLoaded) return
  const MODEL_URL = '/models'
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
  modelsLoaded = true
}

function FaceCapture({ onCapture, buttonLabel = 'Scan Face' }) {
  const videoRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | loading | scanning | detecting | done | error
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

      const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      setStatus('scanning')
    } catch (err) {
      console.error(err)
      setError('Could not access camera. Please allow camera permission.')
      setStatus('error')
    }
  }

  const captureAndDetect = async () => {
    setStatus('detecting')
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        setError('No face detected. Please center your face and try again.')
        setStatus('scanning')
        return
      }

      const descriptorArray = Array.from(detection.descriptor)
      stopCamera()
      setStatus('done')
      onCapture(descriptorArray)
    } catch (err) {
      console.error(err)
      setError('Face detection failed. Please try again.')
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
          <video
            ref={videoRef}
            width="240"
            height="180"
            muted
            className="rounded-lg mx-auto border border-border-soft"
          />
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

      {error && <p className="text-sm text-danger mt-2">{error}</p>}
    </div>
  )
}

export default FaceCapture
