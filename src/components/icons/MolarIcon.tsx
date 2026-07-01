import { useId } from 'react'

interface MolarIconProps {
  size?: number
  className?: string
}

/** Contorno do molar (2 cúspides no topo, vale central, 2 raízes na base). */
const TOOTH_PATH =
  'M 8.5 4.3 C 7 3.3, 4.5 3.8, 3.5 6.4 C 2.5 9, 3 12, 3.5 14.5 ' +
  'C 3.8 16.6, 4.6 21, 6.4 21 C 8.2 21, 8.8 17.8, 12 17.4 ' +
  'C 15.2 17.8, 15.8 21, 17.6 21 C 19.4 21, 20.2 16.6, 20.5 14.5 ' +
  'C 21 12, 21.5 9, 20.5 6.4 C 19.5 3.8, 17 3.3, 15.5 4.3 ' +
  'C 14.5 5, 13.5 6.8, 12 6.8 C 10.5 6.8, 9.5 5, 8.5 4.3 Z'

/**
 * Ícone da marca OdontoCore — molar "blueprint" (contorno azul/violeta com
 * linhas horizontais internas). Sem texto/fundo; funciona em qualquer superfície.
 */
export function MolarIcon({ size = 24, className }: MolarIconProps) {
  const uid = useId()
  const gradId = `molar-grad-${uid}`
  const clipId = `molar-clip-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Gradiente da marca: indigo → violeta */}
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={TOOTH_PATH} />
        </clipPath>
      </defs>

      {/* Corpo do molar */}
      <path
        d={TOOTH_PATH}
        fill={`url(#${gradId})`}
        fillOpacity={0.1}
        stroke={`url(#${gradId})`}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />

      {/* Linhas horizontais internas (estilo blueprint), recortadas pelo dente */}
      <g clipPath={`url(#${clipId})`} stroke="#7c83f0" strokeWidth={0.9} strokeOpacity={0.6} strokeLinecap="round">
        <line x1="2" y1="9" x2="22" y2="9" />
        <line x1="2" y1="11" x2="22" y2="11" />
        <line x1="2" y1="13" x2="22" y2="13" />
        <line x1="2" y1="15" x2="22" y2="15" />
      </g>
    </svg>
  )
}
