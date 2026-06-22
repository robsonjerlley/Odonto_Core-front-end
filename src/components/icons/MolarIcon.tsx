import { useId } from 'react'

interface MolarIconProps {
  size?: number
  className?: string
}

export function MolarIcon({ size = 24, className }: MolarIconProps) {
  const uid = useId()
  const gradId = `molar-grad-${uid}`
  const highlightId = `molar-hi-${uid}`

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
        {/* Gradiente principal: teal → green (tokens brand + success) */}
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        {/* Gradiente para o reflexo de esmalte */}
        <linearGradient id={highlightId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.35" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/*
        Corpo do molar: 2 cúspides no topo (y≈4.5), vale entre elas (y=7),
        corpo arredondado descendo até y≈20.5.
        Percurso: cúspide esquerda → lado esquerdo → base → lado direito →
        cúspide direita → vale → fecha na cúspide esquerda.
      */}
      <path
        d="
          M 8.5 4.5
          C 7 3.5, 4.5 4, 3.5 6.5
          C 2.5 9, 3 12, 3.5 14
          C 4 17, 6 20.5, 12 20.5
          C 18 20.5, 20 17, 20.5 14
          C 21 12, 21.5 9, 20.5 6.5
          C 19.5 4, 17 3.5, 15.5 4.5
          C 14.5 5.2, 13.5 7, 12 7
          C 10.5 7, 9.5 5.2, 8.5 4.5
          Z
        "
        fill={`url(#${gradId})`}
        fillOpacity={0.10}
        stroke={`url(#${gradId})`}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Reflexo de esmalte — pequeno arco na cúspide esquerda */}
      <path
        d="M 7 6.5 C 6.5 5.2, 7.2 4.3, 8.5 4.8"
        stroke={`url(#${highlightId})`}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </svg>
  )
}
