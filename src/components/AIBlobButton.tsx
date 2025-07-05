import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

// Glassmorphism + animated blob shader with organic distortion
const BlobMaterial = shaderMaterial(
  { time: 0, active: 0 },
  // Vertex Shader
  `
    uniform float time;
    uniform float active;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      float freq = mix(2.0, 8.0, active);
      float amp = mix(0.08, 0.32, active);
      vec3 pos = position;
      // Organic animated distortion using multiple sine/cos waves
      float t = time * 1.2;
      float distort = sin(pos.x * freq + t) * amp
                   + cos(pos.y * freq * 0.7 + t * 1.3) * amp * 0.7
                   + sin((pos.x + pos.y) * freq * 0.5 + t * 0.7) * amp * 0.5;
      pos.x += 0.08 * sin(pos.y * 6.0 + t * 1.5) * (0.5 + active);
      pos.y += 0.08 * cos(pos.x * 6.0 - t * 1.2) * (0.5 + active);
      pos.z += distort;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    void main() {
      // Glassmorphism: soft white with blue tint and blur
      vec3 color = mix(vec3(0.85,0.92,1.0), vec3(0.7,0.8,1.0), vUv.y);
      float alpha = 0.55 + 0.25 * sin(vUv.x * 3.14);
      gl_FragColor = vec4(color, alpha);
    }
  `
)
extend({ BlobMaterial })

function Blob({ active }: { active: boolean }) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!mesh.current) return
    // @ts-ignore
    mesh.current.material.time = state.clock.getElapsedTime()
    // @ts-ignore
    mesh.current.material.active = active ? 1.0 : 0.0
  })
  return (
    <mesh ref={mesh}>
      <circleGeometry args={[0.48, 64]} />
      {/* @ts-ignore */}
      <blobMaterial transparent />
    </mesh>
  )
}

interface AIBlobButtonProps {
  active: boolean;
  onClick: () => void;
}

export default function AIBlobButton({ active, onClick }: AIBlobButtonProps) {
  return (
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
        backdropFilter: 'blur(8px)',
        background: 'rgba(255,255,255,0.15)',
        border: '1.5px solid rgba(255,255,255,0.25)',
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      onClick={onClick}
    >
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 30 }}
        gl={{ alpha: true, antialias: true }}
        style={{ borderRadius: '50%', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 2, 2]} intensity={0.7} />
        <Blob active={active} />
      </Canvas>
      {/* Mic SVG Icon overlay */}
      <span
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          boxShadow: active ? '0 0 12px 2px #7ecbff' : '0 1px 4px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.2s',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="24" height="24" fill="none" />
          <path
            d="M12 16c1.66 0 3-1.34 3-3V8c0-1.66-1.34-3-3-3s-3 1.34-3 3v5c0 1.66 1.34 3 3 3zm5-3c0 2.5-2 4.5-5 4.5s-5-2-5-4.5"
            stroke="#1e293b"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 19v2"
            stroke="#1e293b"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </div>
  )
}
