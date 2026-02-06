import React from "react"

interface BarStoolProps {
  position: "top" | "bottom"
  index: number
  total: number
  barWidth: number
}

export const BarStool: React.FC<BarStoolProps> = ({
  position,
  index,
  total,
  barWidth,
}) => {
  // Calculate position along the bar
  const spacing = barWidth / (total + 1)
  const xPosition = spacing * (index + 1)

  const yOffset = position === "top" ? -25 : 25

  return (
    <div
      className="absolute w-5 h-5 rounded-full bg-stone-600 border-2 border-stone-800 shadow-md"
      style={{
        left: `${xPosition - 10}px`,
        top: `${yOffset}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Seat cushion */}
      <div className="absolute inset-0.5 rounded-full bg-stone-400" />
    </div>
  )
}

interface BarStoolsProps {
  count: number
  barWidth: number
}

export const BarStools: React.FC<BarStoolsProps> = ({ count, barWidth }) => {
  if (count === 0) return null

  const stools: React.ReactNode[] = []

  // Distribute stools on both sides
  const stoolsPerSide = Math.ceil(count / 2)

  for (let i = 0; i < stoolsPerSide; i++) {
    // Top stools
    if (i < count) {
      stools.push(
        <BarStool
          key={`top-${i}`}
          position="top"
          index={i}
          total={stoolsPerSide}
          barWidth={barWidth}
        />
      )
    }

    // Bottom stools (reversed order)
    const bottomIndex = count - 1 - i
    if (bottomIndex >= stoolsPerSide && bottomIndex < count) {
      stools.push(
        <BarStool
          key={`bottom-${i}`}
          position="bottom"
          index={stoolsPerSide - 1 - i}
          total={stoolsPerSide}
          barWidth={barWidth}
        />
      )
    }
  }

  return <>{stools}</>
}
