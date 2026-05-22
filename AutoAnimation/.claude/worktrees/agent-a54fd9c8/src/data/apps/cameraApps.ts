import type { OneClickApp } from '@/types/oneClickApp'

export const cameraApps: OneClickApp[] = [
  {
    id: 'content-scoring',
    name: 'Content Scoring',
    description: 'Analyze video for engagement score',
    category: 'camera',
    icon: 'BarChart3',
    color: 'text-blue-400',
    orchestratorConfig: {
      defaultPrompt: 'Analyze the following content and provide an engagement score with recommendations',
      aspectRatio: '9:16',
      enableCaptions: true,
    },
    inputFields: [
      { id: 'content', label: 'Content Description', type: 'textarea', placeholder: 'Describe your video content...', required: true },
    ],
    tags: ['analytics', 'scoring', 'engagement'],
  },
  {
    id: 'camera-angles',
    name: 'Camera Angles',
    description: 'Generate video with dynamic camera angles',
    category: 'camera',
    icon: 'Camera',
    color: 'text-blue-400',
    orchestratorConfig: {
      defaultPrompt: 'Create a dynamic video with cinematic camera angles for:',
      aspectRatio: '9:16',
      enableMusic: true,
      cameraPreset: 'dynamic',
    },
    inputFields: [
      { id: 'subject', label: 'Subject', type: 'text', placeholder: 'What to film...', required: true },
    ],
    tags: ['camera', 'cinematic', 'angles'],
  },
  {
    id: 'shot-types',
    name: 'Shot Types',
    description: 'Auto-generate shots (wide, medium, close-up, extreme CU)',
    category: 'camera',
    icon: 'Aperture',
    color: 'text-blue-400',
    orchestratorConfig: {
      defaultPrompt: 'Generate a sequence of varied shot types (wide, medium, close-up, extreme close-up) for:',
      aspectRatio: '9:16',
      enableMusic: true,
      cameraPreset: 'shot-variety',
    },
    inputFields: [
      { id: 'scene', label: 'Scene Description', type: 'textarea', placeholder: 'Describe the scene...', required: true },
    ],
    tags: ['shots', 'cinematography', 'variety'],
  },
  {
    id: 'dynamic-zooms',
    name: 'Dynamic Zooms',
    description: 'Add cinematic zoom moves to video',
    category: 'camera',
    icon: 'ZoomIn',
    color: 'text-blue-400',
    orchestratorConfig: {
      defaultPrompt: 'Create a video with dynamic zoom transitions and movements',
      aspectRatio: '9:16',
      enableMusic: true,
      cameraPreset: 'zoom',
    },
    inputFields: [
      { id: 'subject', label: 'Subject', type: 'text', placeholder: 'Subject to zoom on...', required: true },
      {
        id: 'zoomStyle',
        label: 'Zoom Style',
        type: 'select',
        options: [
          { label: 'Smooth Dolly', value: 'smooth-dolly' },
          { label: 'Snap Zoom', value: 'snap-zoom' },
          { label: 'Vertigo Effect', value: 'vertigo' },
          { label: 'Punch In', value: 'punch-in' },
        ],
        default: 'smooth-dolly',
      },
    ],
    tags: ['zoom', 'cinematic', 'movement'],
  },
  {
    id: 'behind-the-scenes',
    name: 'Behind the Scenes',
    description: 'Generate BTS-style content',
    category: 'camera',
    icon: 'Clapperboard',
    color: 'text-blue-400',
    orchestratorConfig: {
      defaultPrompt: 'Create behind-the-scenes style content showing the making of:',
      aspectRatio: '9:16',
      enableMusic: true,
      enableCaptions: true,
    },
    inputFields: [
      { id: 'content', label: 'Main Content Description', type: 'textarea', placeholder: 'What is the main content about...', required: true },
    ],
    tags: ['bts', 'behind-the-scenes', 'making-of'],
  },
]
