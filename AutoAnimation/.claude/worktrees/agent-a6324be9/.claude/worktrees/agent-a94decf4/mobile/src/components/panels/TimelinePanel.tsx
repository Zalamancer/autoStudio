import React, { useState, useCallback } from 'react'
import {
  View, Text, Pressable, ScrollView, StyleSheet, FlatList,
} from 'react-native'

// Track types matching web (subset)
type TrackType = 'dialogue' | 'media' | 'text' | 'shape' | 'animation' | 'camera' | 'audio'

interface Track {
  id: string
  name: string
  type: TrackType
  muted: boolean
  locked: boolean
  clips: Clip[]
}

interface Clip {
  id: string
  name: string
  startFrame: number
  endFrame: number
  color: string
}

const TRACK_ICONS: Record<TrackType, string> = {
  dialogue: '\u{1F3A4}',
  media: '\u{1F3AC}',
  text: 'T',
  shape: '\u25CF',
  animation: '\u2728',
  camera: '\u{1F3A5}',
  audio: '\u266B',
}

const TRACK_COLORS: Record<TrackType, string> = {
  dialogue: '#6366f1',
  media: '#22c55e',
  text: '#f59e0b',
  shape: '#ec4899',
  animation: '#8b5cf6',
  camera: '#06b6d4',
  audio: '#ef4444',
}

// Demo data — will be replaced with store connection
const DEMO_TRACKS: Track[] = [
  {
    id: '1', name: 'Dialogue', type: 'dialogue', muted: false, locked: false,
    clips: [
      { id: 'c1', name: 'Intro', startFrame: 0, endFrame: 90, color: '#6366f1' },
      { id: 'c2', name: 'Main', startFrame: 100, endFrame: 250, color: '#818cf8' },
    ],
  },
  {
    id: '2', name: 'Background', type: 'media', muted: false, locked: false,
    clips: [
      { id: 'c3', name: 'BG Video', startFrame: 0, endFrame: 300, color: '#22c55e' },
    ],
  },
  {
    id: '3', name: 'Title', type: 'text', muted: false, locked: false,
    clips: [
      { id: 'c4', name: 'Title Card', startFrame: 0, endFrame: 60, color: '#f59e0b' },
    ],
  },
  {
    id: '4', name: 'Music', type: 'audio', muted: false, locked: false,
    clips: [
      { id: 'c5', name: 'BGM', startFrame: 0, endFrame: 300, color: '#ef4444' },
    ],
  },
]

export function TimelinePanel() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [totalFrames] = useState(300)
  const [fps] = useState(30)
  const [tracks, setTracks] = useState<Track[]>(DEMO_TRACKS)

  const currentTime = (currentFrame / fps).toFixed(1)
  const totalTime = (totalFrames / fps).toFixed(1)

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), [])

  const toggleTrackMute = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t))
    )
  }, [])

  const toggleTrackLock = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t))
    )
  }, [])

  const addTrack = useCallback(() => {
    const newTrack: Track = {
      id: Date.now().toString(),
      name: `Track ${tracks.length + 1}`,
      type: 'media',
      muted: false,
      locked: false,
      clips: [],
    }
    setTracks((prev) => [...prev, newTrack])
  }, [tracks.length])

  return (
    <View style={styles.container}>
      {/* Playback controls */}
      <View style={styles.controls}>
        <View style={styles.playbackRow}>
          <Pressable style={styles.controlBtn} onPress={() => setCurrentFrame(0)}>
            <Text style={styles.controlIcon}>{'\u23EE'}</Text>
          </Pressable>
          <Pressable style={[styles.controlBtn, styles.playBtn]} onPress={togglePlay}>
            <Text style={styles.playIcon}>{isPlaying ? '\u23F8' : '\u25B6'}</Text>
          </Pressable>
          <Pressable style={styles.controlBtn} onPress={() => setCurrentFrame(totalFrames)}>
            <Text style={styles.controlIcon}>{'\u23ED'}</Text>
          </Pressable>
          <Text style={styles.timeCode}>{currentTime}s / {totalTime}s</Text>
        </View>
        <View style={styles.playbackRow}>
          <Text style={styles.fpsLabel}>{fps} FPS</Text>
          <Pressable style={styles.addTrackBtn} onPress={addTrack}>
            <Text style={styles.addTrackText}>+ Track</Text>
          </Pressable>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentFrame / totalFrames) * 100}%` }]} />
        <View style={[styles.playhead, { left: `${(currentFrame / totalFrames) * 100}%` }]} />
      </View>

      {/* Track list */}
      <ScrollView style={styles.trackList} showsVerticalScrollIndicator={false}>
        {tracks.map((track) => (
          <View key={track.id} style={styles.trackRow}>
            <View style={styles.trackHeader}>
              <Text style={[styles.trackIcon, { color: TRACK_COLORS[track.type] }]}>
                {TRACK_ICONS[track.type]}
              </Text>
              <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
              <Pressable style={styles.trackAction} onPress={() => toggleTrackMute(track.id)}>
                <Text style={[styles.trackActionText, track.muted && styles.trackActionMuted]}>
                  {track.muted ? '\u{1F507}' : '\u{1F50A}'}
                </Text>
              </Pressable>
              <Pressable style={styles.trackAction} onPress={() => toggleTrackLock(track.id)}>
                <Text style={[styles.trackActionText, track.locked && styles.trackActionLocked]}>
                  {track.locked ? '\u{1F512}' : '\u{1F513}'}
                </Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clipRow}>
              {track.clips.map((clip) => (
                <View
                  key={clip.id}
                  style={[
                    styles.clip,
                    {
                      backgroundColor: clip.color + '33',
                      borderColor: clip.color,
                      width: Math.max(60, (clip.endFrame - clip.startFrame) * 0.8),
                      marginLeft: clip.startFrame * 0.8,
                    },
                  ]}
                >
                  <Text style={[styles.clipText, { color: clip.color }]} numberOfLines={1}>
                    {clip.name}
                  </Text>
                </View>
              ))}
              {track.clips.length === 0 && (
                <Text style={styles.emptyClip}>Empty track</Text>
              )}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  controls: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: { backgroundColor: '#6366f1', width: 44, height: 44, borderRadius: 22 },
  controlIcon: { color: '#999', fontSize: 16 },
  playIcon: { color: '#fff', fontSize: 18 },
  timeCode: { color: '#999', fontSize: 13, fontVariant: ['tabular-nums'], marginLeft: 8 },
  fpsLabel: { color: '#666', fontSize: 12 },
  addTrackBtn: {
    marginLeft: 'auto',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  addTrackText: { color: '#6366f1', fontSize: 12, fontWeight: '600' },
  progressBar: {
    height: 4,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  progressFill: { height: 4, backgroundColor: '#6366f1' },
  playhead: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
    marginLeft: -6,
  },
  trackList: { flex: 1, paddingVertical: 4 },
  trackRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingVertical: 6,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 4,
  },
  trackIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  trackName: { color: '#ccc', fontSize: 13, flex: 1 },
  trackAction: { padding: 4 },
  trackActionText: { fontSize: 14 },
  trackActionMuted: { opacity: 0.4 },
  trackActionLocked: { opacity: 1 },
  clipRow: { paddingHorizontal: 12, height: 32 },
  clip: {
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    position: 'absolute',
    top: 0,
  },
  clipText: { fontSize: 11, fontWeight: '500' },
  emptyClip: { color: '#333', fontSize: 11, fontStyle: 'italic', lineHeight: 28 },
})
