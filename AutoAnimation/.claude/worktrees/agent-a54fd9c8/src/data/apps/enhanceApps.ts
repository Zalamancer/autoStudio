import type { OneClickApp } from '@/types/oneClickApp'

export const enhanceApps: OneClickApp[] = [
  {
    id: 'skin-enhancer',
    name: 'Skin Enhancer',
    description: 'Smooth and enhance skin in video',
    category: 'enhance',
    icon: 'Sparkles',
    color: 'text-pink-400',
    orchestratorConfig: {
      defaultPrompt: 'Apply skin enhancement and smoothing filter to character',
      aspectRatio: '9:16',
      effectsPreset: ['skin-smooth'],
    },
    inputFields: [
      {
        id: 'intensity',
        label: 'Intensity',
        type: 'select',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Medium', value: 'medium' },
          { label: 'Heavy', value: 'heavy' },
        ],
        default: 'medium',
      },
    ],
    tags: ['beauty', 'skin', 'enhance'],
  },
  {
    id: 'ai-stylist',
    name: 'AI Stylist',
    description: 'Apply fashion style to character',
    category: 'enhance',
    icon: 'Shirt',
    color: 'text-pink-400',
    orchestratorConfig: {
      defaultPrompt: 'Apply fashion styling to the character with the following style:',
      aspectRatio: '9:16',
    },
    inputFields: [
      {
        id: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { label: 'Casual', value: 'casual' },
          { label: 'Formal', value: 'formal' },
          { label: 'Streetwear', value: 'streetwear' },
          { label: 'Vintage', value: 'vintage' },
          { label: 'Futuristic', value: 'futuristic' },
        ],
        default: 'casual',
        required: true,
      },
    ],
    tags: ['fashion', 'style', 'outfit'],
  },
  {
    id: 'outfit-swap',
    name: 'Outfit Swap',
    description: 'Change character outfit',
    category: 'enhance',
    icon: 'RefreshCw',
    color: 'text-pink-400',
    orchestratorConfig: {
      defaultPrompt: 'Swap the character outfit to:',
      aspectRatio: '9:16',
    },
    inputFields: [
      { id: 'outfit', label: 'Outfit Description', type: 'textarea', placeholder: 'Describe the new outfit...', required: true },
    ],
    tags: ['outfit', 'swap', 'clothing'],
  },
  {
    id: 'style-snap',
    name: 'Style Snap',
    description: 'Apply reference image style',
    category: 'enhance',
    icon: 'ImagePlus',
    color: 'text-pink-400',
    orchestratorConfig: {
      defaultPrompt: 'Apply the visual style from the reference image to the video',
      aspectRatio: '9:16',
      stylePreset: 'reference-match',
    },
    inputFields: [
      { id: 'referenceImage', label: 'Reference Image', type: 'image', required: true },
      { id: 'strength', label: 'Style Strength', type: 'select', options: [
        { label: 'Subtle', value: 'subtle' },
        { label: 'Balanced', value: 'balanced' },
        { label: 'Strong', value: 'strong' },
      ], default: 'balanced' },
    ],
    tags: ['style', 'reference', 'transfer'],
  },
  {
    id: 'relight',
    name: 'Relight',
    description: 'Relight scene with new lighting',
    category: 'enhance',
    icon: 'Sun',
    color: 'text-pink-400',
    orchestratorConfig: {
      defaultPrompt: 'Relight the scene with the following lighting setup:',
      aspectRatio: '9:16',
    },
    inputFields: [
      {
        id: 'lighting',
        label: 'Lighting Preset',
        type: 'select',
        options: [
          { label: 'Golden Hour', value: 'golden-hour' },
          { label: 'Blue Hour', value: 'blue-hour' },
          { label: 'Studio', value: 'studio' },
          { label: 'Neon', value: 'neon' },
          { label: 'Dramatic', value: 'dramatic' },
          { label: 'Natural', value: 'natural' },
        ],
        default: 'golden-hour',
        required: true,
      },
    ],
    tags: ['lighting', 'relight', 'mood'],
  },
]
