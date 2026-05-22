import type { OneClickApp } from '@/types/oneClickApp'

export const gameApps: OneClickApp[] = [
  {
    id: 'game-dump',
    name: 'Game Dump',
    description: 'Gaming highlight reel',
    category: 'games',
    icon: 'Gamepad2',
    color: 'text-green-400',
    orchestratorConfig: {
      defaultPrompt: 'Create a gaming highlight reel with energetic editing for:',
      aspectRatio: '9:16',
      enableMusic: true,
      enableCaptions: true,
      effectsPreset: ['glitch', 'zoom'],
    },
    inputFields: [
      { id: 'game', label: 'Game Name', type: 'text', placeholder: 'Game name...', required: true },
      {
        id: 'highlightType',
        label: 'Highlight Type',
        type: 'select',
        options: [
          { label: 'Best Moments', value: 'best-moments' },
          { label: 'Fails', value: 'fails' },
          { label: 'Clutch Plays', value: 'clutch' },
          { label: 'Funny Moments', value: 'funny' },
        ],
        default: 'best-moments',
      },
    ],
    tags: ['gaming', 'highlights', 'reel'],
  },
  {
    id: 'nano-strike',
    name: 'Nano Strike',
    description: 'Action game style video',
    category: 'games',
    icon: 'Crosshair',
    color: 'text-green-400',
    orchestratorConfig: {
      defaultPrompt: 'Create an action-packed FPS game style video featuring:',
      aspectRatio: '9:16',
      enableMusic: true,
      effectsPreset: ['glitch', 'neon'],
    },
    inputFields: [
      { id: 'character', label: 'Character', type: 'text', placeholder: 'Character name or description...', required: true },
      { id: 'action', label: 'Action', type: 'text', placeholder: 'Action sequence...', required: true },
    ],
    tags: ['action', 'fps', 'gaming'],
  },
  {
    id: 'nano-theft',
    name: 'Nano Theft',
    description: 'Heist/stealth style video',
    category: 'games',
    icon: 'Eye',
    color: 'text-green-400',
    orchestratorConfig: {
      defaultPrompt: 'Create a heist/stealth game style video with:',
      aspectRatio: '9:16',
      enableMusic: true,
    },
    inputFields: [
      { id: 'scenario', label: 'Scenario', type: 'textarea', placeholder: 'Describe the heist scenario...', required: true },
    ],
    tags: ['heist', 'stealth', 'gaming'],
  },
  {
    id: 'sim-life',
    name: 'SimLife',
    description: 'Life simulation style content',
    category: 'games',
    icon: 'Home',
    color: 'text-green-400',
    orchestratorConfig: {
      defaultPrompt: 'Create a life simulation style video following a character through their day:',
      aspectRatio: '9:16',
      enableMusic: true,
      enableCaptions: true,
    },
    inputFields: [
      { id: 'character', label: 'Character', type: 'text', placeholder: 'Character name...', required: true },
      { id: 'routine', label: 'Daily Routine', type: 'textarea', placeholder: 'Describe the daily routine...', required: true },
    ],
    tags: ['simulation', 'life', 'daily'],
  },
  {
    id: 'plushies',
    name: 'Plushies',
    description: 'Cute plush toy animation',
    category: 'games',
    icon: 'Heart',
    color: 'text-green-400',
    orchestratorConfig: {
      defaultPrompt: 'Create a cute plush toy character animation featuring:',
      aspectRatio: '9:16',
      enableMusic: true,
      stylePreset: 'cute',
    },
    inputFields: [
      { id: 'character', label: 'Plushie Description', type: 'textarea', placeholder: 'Describe the plush character...', required: true },
    ],
    tags: ['plush', 'cute', 'toy'],
  },
]
