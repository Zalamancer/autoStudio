/**
 * Generator tool property panels — Image Gen, Text-to-Video, Audio-to-Video,
 * Video-to-Video, Retake, Extend, Manim, Image-to-Video, B-Roll.
 */
import { useState, useCallback } from 'react'
import { Image, Upload, FileVideo, Film, Loader2 } from 'lucide-react'
import {
  PanelSlider,
  PanelSelect,
  PanelToggle,
  PanelTextarea,
  PanelDropZone,
  PanelActionButton,
  PanelSection,
  PanelInput,
} from '@/components/ui/panel-controls'
import { useManimStore } from '@/stores/useManimStore'

const ASPECT_OPTIONS = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
]

const DURATION_OPTIONS = [
  { value: '4', label: '4s' },
  { value: '6', label: '6s' },
  { value: '8', label: '8s' },
  { value: '10', label: '10s' },
]

const EXTEND_DURATION_OPTIONS = [
  { value: '2', label: '2s' },
  { value: '4', label: '4s' },
  { value: '6', label: '6s' },
]

const STYLE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'anime', label: 'Anime' },
  { value: 'illustration', label: 'Illustration' },
  { value: '3d-render', label: '3D Render' },
]

const MOTION_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'dynamic', label: 'Dynamic' },
  { value: 'cinematic', label: 'Cinematic' },
]

const MANIM_DURATION_OPTIONS = [
  { value: '1', label: '1 min' },
  { value: '2', label: '2 min' },
  { value: '3', label: '3 min' },
  { value: '5', label: '5 min' },
]

const MANIM_DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const MANIM_QUALITY_OPTIONS = [
  { value: 'low', label: 'Draft' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const MANIM_STEP_LABELS: Record<string, string> = {
  'planning-script': 'Planning script',
  'decomposing-scenes': 'Decomposing scenes',
  'generating-code': 'Generating Manim code',
  rendering: 'Rendering scenes',
  narrating: 'Generating narration',
  assembling: 'Assembling video',
  completed: 'Completed',
  error: 'Failed',
}

function GenImagePropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [negPrompt, setNegPrompt] = useState('')
  const [aspect, setAspect] = useState('1:1')
  const [style, setStyle] = useState('auto')
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelTextarea label="Prompt" value={prompt} onChange={setPrompt} placeholder="Describe the image you want to generate..." rows={4} />
        <PanelSelect label="Aspect" value={aspect} onChange={setAspect} options={ASPECT_OPTIONS} />
        <PanelSelect label="Style" value={style} onChange={setStyle} options={STYLE_OPTIONS} />
        <PanelTextarea label="Negative prompt" value={negPrompt} onChange={setNegPrompt} placeholder="What to avoid..." rows={2} />
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}} disabled={!prompt.trim()}>Generate Image</PanelActionButton>
      </div>
    </div>
  )
}

function GenTextToVideoPropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [aspect, setAspect] = useState('16:9')
  const [duration, setDuration] = useState('4')
  const [motion, setMotion] = useState('auto')
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelTextarea label="Prompt" value={prompt} onChange={setPrompt} placeholder="Describe the video you want to generate..." rows={4} />
        <PanelSelect label="Aspect" value={aspect} onChange={setAspect} options={ASPECT_OPTIONS} />
        <PanelSelect label="Duration" value={duration} onChange={setDuration} options={DURATION_OPTIONS} />
        <PanelSelect label="Motion" value={motion} onChange={setMotion} options={MOTION_OPTIONS} />
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}} disabled={!prompt.trim()}>Generate Video</PanelActionButton>
      </div>
    </div>
  )
}

function GenAudioToVideoPropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [aspect, setAspect] = useState('16:9')
  const [duration, setDuration] = useState('4')
  const [isDragging, setIsDragging] = useState(false)
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelDropZone icon={Upload} label="Upload audio file" sublabel="MP3, WAV, M4A" isDragging={isDragging} onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={() => setIsDragging(false)} />
        <PanelTextarea label="Scene description" value={prompt} onChange={setPrompt} placeholder="Describe the visual scene..." rows={3} />
        <PanelSelect label="Aspect" value={aspect} onChange={setAspect} options={ASPECT_OPTIONS} />
        <PanelSelect label="Duration" value={duration} onChange={setDuration} options={DURATION_OPTIONS} />
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}}>Generate Video</PanelActionButton>
      </div>
    </div>
  )
}

function GenVideoToVideoPropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [strength, setStrength] = useState(0.5)
  const [isDragging, setIsDragging] = useState(false)
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelDropZone icon={FileVideo} label="Upload source video" sublabel="MP4, WebM, MOV" isDragging={isDragging} onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={() => setIsDragging(false)} />
        <PanelTextarea label="Style / transform" value={prompt} onChange={setPrompt} placeholder="Describe the desired style or transformation..." rows={3} />
        <PanelSlider label="Strength" value={strength} onChange={setStrength} min={0} max={1} step={0.05} />
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}}>Transform Video</PanelActionButton>
      </div>
    </div>
  )
}

function GenRetakePropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [aspect, setAspect] = useState('16:9')
  const [seed, setSeed] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelDropZone icon={FileVideo} label="Upload reference video" sublabel="MP4, WebM, MOV — or select from timeline" isDragging={isDragging} onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={() => setIsDragging(false)} />
        <PanelTextarea label="Adjustments" value={prompt} onChange={setPrompt} placeholder="Describe what to change..." rows={3} />
        <PanelSelect label="Aspect" value={aspect} onChange={setAspect} options={ASPECT_OPTIONS} />
        <PanelInput label="Seed" value={seed} onChange={setSeed} placeholder="Random" />
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}}>Retake Video</PanelActionButton>
      </div>
    </div>
  )
}

function GenExtendPropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [extendDuration, setExtendDuration] = useState('4')
  const [isDragging, setIsDragging] = useState(false)
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelDropZone icon={FileVideo} label="Upload video to extend" sublabel="MP4, WebM, MOV — or select from timeline" isDragging={isDragging} onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={() => setIsDragging(false)} />
        <PanelSelect label="Add" value={extendDuration} onChange={setExtendDuration} options={EXTEND_DURATION_OPTIONS} />
        <PanelTextarea label="Continuation prompt" value={prompt} onChange={setPrompt} placeholder="Describe how the video should continue..." rows={3} />
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}}>Extend Video</PanelActionButton>
      </div>
    </div>
  )
}

function GenManimPropertiesPanel() {
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState('2')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [quality, setQuality] = useState('medium')
  const [aspect, setAspect] = useState('16:9')
  const [interactive, setInteractive] = useState(true)

  const step = useManimStore((s) => s.step)
  const stepProgress = useManimStore((s) => s.stepProgress)
  const error = useManimStore((s) => s.error)
  const currentSceneIndex = useManimStore((s) => s.currentSceneIndex)
  const sceneSpecs = useManimStore((s) => s.sceneSpecs)

  const isRunning = step !== 'idle' && step !== 'completed' && step !== 'error'
  const sceneCount = sceneSpecs?.length ?? 0

  const handleGenerate = useCallback(() => {
    import('@/services/manim/manimOrchestrator').then(({ runManimPipeline }) => {
      runManimPipeline({
        topic,
        targetDurationMinutes: Number(duration),
        difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
        quality: quality as 'low' | 'medium' | 'high',
        enableInteractiveAnnotations: interactive,
        aspectRatio: aspect as '16:9' | '9:16' | '1:1',
      }).catch(() => {})
    })
  }, [topic, duration, difficulty, quality, interactive, aspect])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelTextarea label="Topic" value={topic} onChange={setTopic} placeholder="Explain eigenvalues and eigenvectors..." rows={3} />
        <PanelSelect label="Duration" value={duration} onChange={setDuration} options={MANIM_DURATION_OPTIONS} />
        <PanelSelect label="Difficulty" value={difficulty} onChange={setDifficulty} options={MANIM_DIFFICULTY_OPTIONS} />
        <PanelSelect label="Aspect" value={aspect} onChange={setAspect} options={ASPECT_OPTIONS} />
        <PanelSelect label="Render Quality" value={quality} onChange={setQuality} options={MANIM_QUALITY_OPTIONS} />
        <PanelToggle label="Interactive annotations" description="Enable pause-and-explain on playback" checked={interactive} onChange={setInteractive} />
        {step !== 'idle' && (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              {isRunning && <Loader2 size={12} className="animate-spin text-[#4a7eff]" />}
              <span className={step === 'error' ? 'text-red-400' : step === 'completed' ? 'text-green-400' : 'text-zinc-300'}>
                {MANIM_STEP_LABELS[step] ?? step}
                {isRunning && sceneCount > 0 && (step === 'generating-code' || step === 'rendering' || step === 'narrating') ? ` (${currentSceneIndex + 1}/${sceneCount})` : ''}
              </span>
            </div>
            {isRunning && (
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-[#4a7eff] transition-all duration-300" style={{ width: `${stepProgress}%` }} />
              </div>
            )}
            {step === 'error' && error && <p className="text-[11px] text-red-400/80 leading-tight line-clamp-3">{error}</p>}
          </div>
        )}
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={handleGenerate} disabled={!topic.trim() || isRunning}>
          {isRunning ? 'Generating...' : 'Generate Manim Video'}
        </PanelActionButton>
      </div>
    </div>
  )
}

function ImageToVideoPropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [aspect, setAspect] = useState('16:9')
  const [duration, setDuration] = useState('4')
  const [isDragging, setIsDragging] = useState(false)
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <PanelSection title="Source Image" icon={Image}>
          <div className="space-y-3">
            <PanelDropZone icon={Upload} label="Upload source image" sublabel="PNG, JPG, WebP" isDragging={isDragging} onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={() => setIsDragging(false)} />
            <PanelTextarea label="Motion prompt" value={prompt} onChange={setPrompt} placeholder="Describe how the image should animate..." rows={3} />
          </div>
        </PanelSection>
        <PanelSection title="Output" collapsible>
          <div className="space-y-3">
            <PanelSelect label="Aspect" value={aspect} onChange={setAspect} options={ASPECT_OPTIONS} />
            <PanelSelect label="Duration" value={duration} onChange={setDuration} options={DURATION_OPTIONS} />
          </div>
        </PanelSection>
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}}>Animate Image</PanelActionButton>
      </div>
    </div>
  )
}

function BrollSuggestPropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <PanelSection title="B-Roll Search" icon={Film}>
          <div className="space-y-3">
            <PanelTextarea value={prompt} onChange={setPrompt} placeholder="Describe the scene or topic for B-roll suggestions..." rows={3} />
          </div>
        </PanelSection>
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}} disabled={!prompt.trim()}>Find B-Roll</PanelActionButton>
      </div>
    </div>
  )
}

/** Router component — renders the correct gen panel based on the active tab */
export default function GenPropertiesPanels({ tab }: { tab: string }) {
  switch (tab) {
    case 'gen-image-properties': return <GenImagePropertiesPanel />
    case 'gen-text-to-video-properties': return <GenTextToVideoPropertiesPanel />
    case 'gen-audio-to-video-properties': return <GenAudioToVideoPropertiesPanel />
    case 'gen-video-to-video-properties': return <GenVideoToVideoPropertiesPanel />
    case 'gen-retake-properties': return <GenRetakePropertiesPanel />
    case 'gen-extend-properties': return <GenExtendPropertiesPanel />
    case 'image-to-video-properties': return <ImageToVideoPropertiesPanel />
    case 'broll-suggest-properties': return <BrollSuggestPropertiesPanel />
    case 'gen-manim-properties': return <GenManimPropertiesPanel />
    default: return null
  }
}
