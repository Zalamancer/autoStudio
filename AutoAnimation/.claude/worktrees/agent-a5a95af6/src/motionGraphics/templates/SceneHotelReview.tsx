import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HotelReviewConfig {
  hotelName: string
  location: string
  rating: number
  priceRange: string
  review: string
  amenities: string[]
  bgColor: string
  textColor: string
  accentColor: string
  starColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneHotelReviewComponent({ config, progress }: MotionGraphicProps<HotelReviewConfig>) {
  const { hotelName, location, rating, priceRange, review, amenities, bgColor, textColor, accentColor, starColor } = config
  const clampedRating = Math.min(5, Math.max(0, Math.round(rating)))

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card slides in from bottom
  const cardEnter = easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.35)))
  const cardY = (1 - cardEnter) * 60

  // Hotel name
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3)))

  // Location
  const locEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.25)))

  // Stars fill one by one
  const getStarProgress = (idx: number): number => {
    const start = 0.35 + idx * 0.06
    return elasticOut(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Price
  const priceEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.2)))

  // Review
  const reviewEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.25)))

  // Amenities staggered
  const getAmenityProgress = (idx: number): number => {
    const start = 0.7 + idx * 0.06
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Hold: subtle card elevation
  const holdElevation = progress >= 0.25 && progress < 0.8
    ? 10 + Math.sin(holdProgress * Math.PI * 3) * 3
    : 10

  const amenityIcons: Record<string, string> = {
    'WiFi': '📶', 'Pool': '🏊', 'Spa': '💆', 'Gym': '🏋️',
    'Restaurant': '🍽️', 'Bar': '🍸', 'Parking': '🅿️', 'Beach': '🏖️',
    'AC': '❄️', 'Breakfast': '☕', 'Pets': '🐾', 'Room Service': '🛎️',
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * -30}px)`,
        }}
      >
        {/* Card */}
        <div
          style={{
            background: `${textColor}08`,
            borderRadius: 'clamp(12px, 2vw, 20px)',
            padding: 'clamp(16px, 3.5vw, 32px)',
            maxWidth: 420,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(8px, 1.5vh, 14px)',
            transform: `translateY(${cardY}px)`,
            opacity: cardEnter,
            boxShadow: `0 ${holdElevation}px ${holdElevation * 3}px rgba(0,0,0,0.3)`,
            border: `1px solid ${textColor}10`,
          }}
        >
          {/* Hotel name */}
          <div
            style={{
              fontSize: 'clamp(22px, 5vw, 36px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.15,
              opacity: nameEnter,
              transform: `translateX(${(1 - nameEnter) * 15}px)`,
            }}
          >
            {hotelName}
          </div>

          {/* Location */}
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 16px)',
              fontWeight: 500,
              color: `${textColor}70`,
              opacity: locEnter,
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(3px, 0.6vw, 6px)',
            }}
          >
            <span style={{ fontSize: 'clamp(12px, 2vw, 16px)' }}>📍</span>
            {location}
          </div>

          {/* Stars + Price row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'clamp(6px, 1.2vw, 12px)',
            }}
          >
            {/* Stars */}
            <div style={{ display: 'flex', gap: 'clamp(2px, 0.4vw, 4px)' }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < clampedRating
                const starProg = getStarProgress(i)
                return (
                  <svg
                    key={i}
                    viewBox="0 0 24 24"
                    style={{
                      width: 'clamp(14px, 2.8vw, 22px)',
                      height: 'clamp(14px, 2.8vw, 22px)',
                      transform: `scale(${starProg})`,
                    }}
                  >
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill={filled ? starColor : 'none'}
                      stroke={starColor}
                      strokeWidth="1.5"
                    />
                  </svg>
                )
              })}
            </div>

            {/* Price */}
            <div
              style={{
                fontSize: 'clamp(14px, 2.5vw, 20px)',
                fontWeight: 700,
                color: accentColor,
                opacity: priceEnter,
              }}
            >
              {priceRange}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: '100%',
              height: 1,
              background: `${textColor}12`,
              opacity: reviewEnter,
            }}
          />

          {/* Review */}
          <div
            style={{
              fontSize: 'clamp(12px, 2.2vw, 18px)',
              fontWeight: 400,
              color: `${textColor}bb`,
              fontStyle: 'italic',
              lineHeight: 1.5,
              opacity: reviewEnter,
              transform: `translateY(${(1 - reviewEnter) * 10}px)`,
            }}
          >
            &ldquo;{review}&rdquo;
          </div>

          {/* Amenities row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(4px, 0.8vw, 8px)',
              marginTop: 'clamp(2px, 0.5vh, 6px)',
            }}
          >
            {amenities.map((amenity, i) => {
              const amenProg = getAmenityProgress(i)
              const icon = amenityIcons[amenity] || '✓'
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(3px, 0.5vw, 5px)',
                    background: `${accentColor}12`,
                    padding: 'clamp(3px, 0.5vh, 6px) clamp(8px, 1.5vw, 14px)',
                    borderRadius: 'clamp(10px, 2vw, 16px)',
                    fontSize: 'clamp(10px, 1.6vw, 13px)',
                    fontWeight: 600,
                    color: `${textColor}cc`,
                    opacity: amenProg,
                    transform: `scale(${amenProg})`,
                  }}
                >
                  <span style={{ fontSize: 'clamp(10px, 1.6vw, 14px)' }}>{icon}</span>
                  {amenity}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hotel-review',
  title: 'Hotel Review',
  description: 'Hotel review card with sliding entrance, star rating fill, amenity badges, and booking-app aesthetic',
  tags: ['scene', 'travel', 'hotel', 'review', 'accommodation', 'adventure'],
  category: 'scene-layout',
  component: SceneHotelReviewComponent as any,
  defaultConfig: {
    hotelName: 'The Grand Azure',
    location: 'Amalfi Coast, Italy',
    rating: 4,
    priceRange: '$$$',
    review: 'Stunning views, impeccable service, and the best breakfast buffet we have ever had.',
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Beach'],
    bgColor: '#0f1623',
    textColor: '#f0eee8',
    accentColor: '#38bdf8',
    starColor: '#fbbf24',
  },
  configSchema: [
    { key: 'hotelName', label: 'Hotel Name', type: 'text', defaultValue: 'The Grand Azure', group: 'Content' },
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'Amalfi Coast, Italy', group: 'Content' },
    { key: 'rating', label: 'Rating (1-5)', type: 'number', defaultValue: 4, min: 1, max: 5, group: 'Content' },
    { key: 'priceRange', label: 'Price Range', type: 'text', defaultValue: '$$$', group: 'Content' },
    { key: 'review', label: 'Review', type: 'text', defaultValue: 'Stunning views, impeccable service, and the best breakfast buffet we have ever had.', group: 'Content' },
    { key: 'amenities', label: 'Amenities', type: 'text-array', defaultValue: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Beach'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f1623', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f0eee8', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#38bdf8', group: 'Style' },
    { key: 'starColor', label: 'Star Color', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
  ],
})
