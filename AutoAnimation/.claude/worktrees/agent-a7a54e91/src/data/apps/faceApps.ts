import type { OneClickApp } from '@/types/oneClickApp'

export const faceApps: OneClickApp[] = [
  {
    id: 'face-swap',
    name: 'Face Swap',
    description: 'Swap face in image',
    category: 'face',
    icon: 'ScanFace',
    color: 'text-purple-400',
    orchestratorConfig: {
      defaultPrompt: 'Swap the face in the target with the source face',
      aspectRatio: '9:16',
    },
    inputFields: [
      { id: 'sourceFace', label: 'Source Face', type: 'image', required: true },
      { id: 'targetImage', label: 'Target Image', type: 'image', required: true },
    ],
    tags: ['face', 'swap', 'deepfake'],
  },
  {
    id: 'video-face-swap',
    name: 'Video Face Swap',
    description: 'Swap face across video frames',
    category: 'face',
    icon: 'Video',
    color: 'text-purple-400',
    orchestratorConfig: {
      defaultPrompt: 'Apply face swap across all video frames maintaining consistency',
      aspectRatio: '9:16',
    },
    inputFields: [
      { id: 'sourceFace', label: 'Source Face', type: 'image', required: true },
      { id: 'description', label: 'Video Description', type: 'textarea', placeholder: 'Describe the video scene...', required: true },
    ],
    tags: ['face', 'swap', 'video'],
  },
  {
    id: 'recast',
    name: 'Recast',
    description: 'Replace actor with different character',
    category: 'face',
    icon: 'UserCog',
    color: 'text-purple-400',
    orchestratorConfig: {
      defaultPrompt: 'Recast the main character as:',
      aspectRatio: '9:16',
    },
    inputFields: [
      { id: 'character', label: 'New Character Description', type: 'textarea', placeholder: 'Describe the replacement character...', required: true },
    ],
    tags: ['recast', 'character', 'replace'],
  },
  {
    id: 'character-swap',
    name: 'Character Swap',
    description: 'Swap full character body',
    category: 'face',
    icon: 'Users',
    color: 'text-purple-400',
    orchestratorConfig: {
      defaultPrompt: 'Swap the full character body and appearance',
      aspectRatio: '9:16',
    },
    inputFields: [
      { id: 'sourceCharacter', label: 'Source Character', type: 'text', placeholder: 'Original character name...', required: true },
      { id: 'targetCharacter', label: 'Target Character', type: 'text', placeholder: 'Replacement character name...', required: true },
    ],
    tags: ['character', 'swap', 'body'],
  },
]
