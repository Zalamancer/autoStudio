/**
 * SlidePreview.tsx
 *
 * Renders a visual preview of a parsed PPTX slide using positioned div elements
 * that approximate the original slide layout.
 */

import type { SlideData, ThemeData } from '@/types/pptx'

interface SlidePreviewProps {
  slide: SlideData
  width: number
  height: number
  theme: ThemeData
}

export function SlidePreview({ slide, width, height }: SlidePreviewProps) {
  const aspectRatio = width / height
  const previewWidth = 280
  const previewHeight = previewWidth / aspectRatio
  const scaleX = previewWidth / width
  const scaleY = previewHeight / height

  // Determine background
  let bgStyle: React.CSSProperties = { backgroundColor: '#ffffff' }
  if (slide.background.type === 'solid' && slide.background.color) {
    bgStyle = { backgroundColor: slide.background.color }
  } else if (slide.background.type === 'image' && slide.background.imageDataUrl) {
    bgStyle = {
      backgroundImage: `url(${slide.background.imageDataUrl})`,
      backgroundSize: 'cover',
    }
  }

  return (
    <div
      className="relative rounded-md overflow-hidden border border-[#3a3a3a] mx-auto"
      style={{
        width: previewWidth,
        height: previewHeight,
        ...bgStyle,
      }}
    >
      {/* Shapes */}
      {slide.shapes.map((shape, i) => {
        const x = shape.x * scaleX
        const y = shape.y * scaleY
        const w = shape.width * scaleX
        const h = shape.height * scaleY

        let borderRadius = '0'
        if (shape.type === 'ellipse') borderRadius = '50%'
        else if (shape.type === 'roundRect') borderRadius = '8px'

        return (
          <div
            key={`shape-${i}`}
            className="absolute"
            style={{
              left: x,
              top: y,
              width: w,
              height: h,
              backgroundColor: shape.fillColor,
              border: shape.strokeWidth > 0 ? `${Math.max(1, shape.strokeWidth * scaleX)}px solid ${shape.strokeColor}` : 'none',
              borderRadius,
              transform: shape.rotation ? `rotate(${shape.rotation}deg)` : undefined,
            }}
          />
        )
      })}

      {/* Images */}
      {slide.images.map((img, i) => {
        const x = img.x * scaleX
        const y = img.y * scaleY
        const w = img.width * scaleX
        const h = img.height * scaleY

        return (
          <img
            key={`img-${i}`}
            src={img.dataUrl}
            alt={img.filename}
            className="absolute object-cover"
            style={{
              left: x,
              top: y,
              width: w,
              height: h,
            }}
          />
        )
      })}

      {/* Text Boxes */}
      {slide.textBoxes.map((tb, i) => {
        const x = tb.x * scaleX
        const y = tb.y * scaleY
        const w = tb.width * scaleX
        const fontSize = Math.max(6, Math.round(tb.fontSize * scaleX * 0.8))

        return (
          <div
            key={`text-${i}`}
            className="absolute overflow-hidden"
            style={{
              left: x,
              top: y,
              width: w,
              maxHeight: tb.height * scaleY,
              textAlign: tb.alignment,
              transform: tb.rotation ? `rotate(${tb.rotation}deg)` : undefined,
            }}
          >
            <p
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.2,
                color: tb.fontColor,
                fontWeight: tb.bold ? 'bold' : 'normal',
                fontStyle: tb.italic ? 'italic' : 'normal',
              }}
            >
              {tb.text}
            </p>
          </div>
        )
      })}

      {/* Slide number */}
      <div className="absolute bottom-0.5 right-1 text-[8px] text-gray-400 bg-black/30 px-1 rounded">
        {slide.index + 1}
      </div>
    </div>
  )
}
