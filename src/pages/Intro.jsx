import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Intro = () => {
  const canvasRef = useRef(null)
  const navigate = useNavigate()
  const [titleVisible, setTitleVisible] = useState(false)
  const [btnVisible, setBtnVisible] = useState(false)
  const triggered = useRef(false)
  const goHome = () => navigate('/home')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const W = canvas.width
    const H = canvas.height

    // Plane flies from left side, arcs gracefully, lands center
    const START_X = -40
    const START_Y = H * 0.25
    const END_X = W * 0.5
    const END_Y = H * 0.52
    const CTRL_X = W * 0.45
    const CTRL_Y = H * 0.08

    const FLIGHT_FRAMES = 160
    const PAUSE_FRAMES = 30
    const PIN_FRAMES = 25

    let t = 0
    let raf
    const trail = []

    const easeInOut = v => v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2
    const easeOut = v => 1 - Math.pow(1 - v, 3)

    // Quadratic bezier point
    const bezier = (t, p0x, p0y, p1x, p1y, p2x, p2y) => {
      const mt = 1 - t
      return {
        x: mt * mt * p0x + 2 * mt * t * p1x + t * t * p2x,
        y: mt * mt * p0y + 2 * mt * t * p1y + t * t * p2y,
      }
    }

    // Bezier tangent for angle
    const bezierTangent = (t, p0x, p0y, p1x, p1y, p2x, p2y) => {
      const mt = 1 - t
      return {
        x: 2 * mt * (p1x - p0x) + 2 * t * (p2x - p1x),
        y: 2 * mt * (p1y - p0y) + 2 * t * (p2y - p1y),
      }
    }

    const drawBg = () => {
      ctx.fillStyle = '#FAF7F4'
      ctx.fillRect(0, 0, W, H)
      // Subtle dot grid
      for (let x = 0; x < W; x += 48) {
        for (let y = 0; y < H; y += 48) {
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(201,110,138,0.07)'
          ctx.fill()
        }
      }
    }

    const drawTrail = () => {
      if (trail.length < 2) return
      for (let i = 1; i < trail.length; i++) {
        const alpha = (i / trail.length) * 0.4
        ctx.strokeStyle = `rgba(201,110,138,${alpha})`
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 6])
        ctx.beginPath()
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
        ctx.lineTo(trail[i].x, trail[i].y)
        ctx.stroke()
      }
      ctx.setLineDash([])
    }

    const drawPlane = (x, y, angle) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)
      // Body
      ctx.fillStyle = '#2A1F2D'
      ctx.beginPath()
      ctx.moveTo(22, 0)
      ctx.lineTo(-12, 9)
      ctx.lineTo(-7, 0)
      ctx.lineTo(-12, -9)
      ctx.closePath()
      ctx.fill()
      // Wing accent
      ctx.fillStyle = '#C96E8A'
      ctx.beginPath()
      ctx.moveTo(22, 0)
      ctx.lineTo(0, 4)
      ctx.lineTo(0, -4)
      ctx.closePath()
      ctx.fill()
      // Tail
      ctx.fillStyle = '#E8A0B4'
      ctx.beginPath()
      ctx.moveTo(-7, 0)
      ctx.lineTo(-12, 5)
      ctx.lineTo(-9, 0)
      ctx.lineTo(-12, -5)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const drawPin = (x, y, scale, rippleVal) => {
      if (scale <= 0) return

      // Ripple rings
      if (rippleVal > 0 && rippleVal < 1) {
        for (let i = 0; i < 3; i++) {
          const rr = rippleVal * 60 * (i + 1) / 3
          const ra = (1 - rippleVal) * (1 - i / 3) * 0.5
          ctx.beginPath()
          ctx.arc(x, y + 4, rr, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(201,110,138,${ra})`
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      }

      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)

      // Drop shadow
      ctx.beginPath()
      ctx.ellipse(0, 6, 9, 3, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(42,31,45,0.12)'
      ctx.fill()

      // Pin head
      ctx.fillStyle = '#C96E8A'
      ctx.beginPath()
      ctx.arc(0, -16, 15, 0, Math.PI * 2)
      ctx.fill()

      // Pin tail
      ctx.beginPath()
      ctx.moveTo(-8, -5)
      ctx.quadraticCurveTo(0, 12, 0, 14)
      ctx.quadraticCurveTo(0, 12, 8, -5)
      ctx.closePath()
      ctx.fill()

      // Inner dot
      ctx.beginPath()
      ctx.arc(0, -16, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()

      ctx.restore()
    }

    let pinScale = 0
    let rippleVal = 0
    let planeDone = false

    const frame = () => {
      t++
      drawBg()
      drawTrail()

      // Flight phase
      if (t <= FLIGHT_FRAMES) {
        const progress = easeInOut(t / FLIGHT_FRAMES)
        const pos = bezier(progress, START_X, START_Y, CTRL_X, CTRL_Y, END_X, END_Y)
        const tan = bezierTangent(progress, START_X, START_Y, CTRL_X, CTRL_Y, END_X, END_Y)
        const angle = Math.atan2(tan.y, tan.x)

        trail.push({ x: pos.x, y: pos.y })
        if (trail.length > 50) trail.shift()

        drawPlane(pos.x, pos.y, angle)
      }

      // Pause then pin appears
      if (t > FLIGHT_FRAMES && t <= FLIGHT_FRAMES + PAUSE_FRAMES) {
        // plane just landed, show briefly then fade
        const fadeOut = 1 - (t - FLIGHT_FRAMES) / PAUSE_FRAMES
        drawPlane(END_X, END_Y, Math.PI * 0.1, fadeOut)
        if (!planeDone) { planeDone = true; rippleVal = 0.01 }
      }

      // Pin grows
      if (t > FLIGHT_FRAMES + PAUSE_FRAMES) {
        const pinT = t - FLIGHT_FRAMES - PAUSE_FRAMES
        pinScale = easeOut(Math.min(1, pinT / PIN_FRAMES))
        if (rippleVal > 0 && rippleVal < 1) rippleVal = Math.min(1, rippleVal + 0.025)
        drawPin(END_X, END_Y, pinScale, rippleVal)

        if (pinScale > 0.9 && !triggered.current) {
          triggered.current = true
          setTitleVisible(true)
          setTimeout(() => setBtnVisible(true), 700)
        }
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      background: '#FAF7F4',
      overflow: 'hidden',
    }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }}
      />

      {/* Title fades in above pin */}
      <div style={{
        position: 'absolute',
        top: '28%',
        left: 0,
        right: 0,
        textAlign: 'center',
        pointerEvents: 'none',
        opacity: titleVisible ? 1 : 0,
        transform: titleVisible ? 'translateY(0)' : 'translateY(-18px)',
        transition: 'opacity 1s ease, transform 1s ease',
      }}>
        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 700,
          fontSize: 'clamp(40px, 10vw, 68px)',
          color: '#2A1F2D',
          letterSpacing: '-.03em',
          margin: '0 0 10px',
          lineHeight: 1,
        }}>
          hobby<span style={{ color: '#C96E8A' }}>find</span>
        </h1>
        <p style={{
          color: '#7A6880',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '.18em',
          fontWeight: 300,
          margin: 0,
        }}>
          discover what's near you
        </p>
      </div>

      {/* Button fades in below pin */}
      <div style={{
        position: 'absolute',
        top: '68%',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity: btnVisible ? 1 : 0,
        transform: btnVisible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}>
        <button
          onClick={goHome}
          style={{
            background: '#C96E8A',
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            padding: '15px 48px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            letterSpacing: '.03em',
          }}
        >
          Ready to explore →
        </button>
      </div>
    </div>
  )
}

export default Intro