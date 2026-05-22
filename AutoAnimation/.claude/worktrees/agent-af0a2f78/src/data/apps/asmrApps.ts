import type { OneClickApp } from '@/types/oneClickApp'

export const asmrApps: OneClickApp[] = [
  {
    id: 'classic-asmr',
    name: 'Classic ASMR',
    description: 'Soft spoken ASMR content',
    category: 'asmr',
    icon: 'Ear',
    color: 'text-violet-400',
    orchestratorConfig: {
      defaultPrompt: 'Create a soft-spoken ASMR video with gentle sounds and calming visuals about:',
      aspectRatio: '9:16',
      enableMusic: false,
      enableCaptions: true,
      stylePreset: 'asmr',
    },
    inputFields: [
      { id: 'topic', label: 'Topic', type: 'text', placeholder: 'ASMR topic...', required: true },
      {
        id: 'soundType',
        label: 'Sound Type',
        type: 'select',
        options: [
          { label: 'Whispering', value: 'whispering' },
          { label: 'Tapping', value: 'tapping' },
          { label: 'Scratching', value: 'scratching' },
          { label: 'Crinkling', value: 'crinkling' },
          { label: 'Brushing', value: 'brushing' },
        ],
        default: 'whispering',
      },
    ],
    tags: ['asmr', 'relaxation', 'soft'],
  },
  {
    id: 'asmr-host',
    name: 'ASMR Host',
    description: 'ASMR hosting/presenting',
    category: 'asmr',
    icon: 'Mic',
    color: 'text-violet-400',
    orchestratorConfig: {
      defaultPrompt: 'Create an ASMR hosting/presenting style video about:',
      aspectRatio: '9:16',
      enableMusic: false,
      enableCaptions: true,
    },
    inputFields: [
      { id: 'topic', label: 'Product/Topic', type: 'textarea', placeholder: 'What to present in ASMR style...', required: true },
    ],
    tags: ['asmr', 'hosting', 'presenting'],
  },
  {
    id: 'asmr-promo',
    name: 'ASMR Promo',
    description: 'ASMR product promotion',
    category: 'asmr',
    icon: 'ShoppingBag',
    color: 'text-violet-400',
    orchestratorConfig: {
      defaultPrompt: 'Create an ASMR-style product promotion video for:',
      aspectRatio: '9:16',
      enableMusic: false,
      enableCaptions: true,
    },
    inputFields: [
      { id: 'product', label: 'Product Description', type: 'textarea', placeholder: 'Describe the product...', required: true },
    ],
    tags: ['asmr', 'product', 'promotion'],
  },
  {
    id: 'asmr-addon',
    name: 'ASMR Add-On',
    description: 'Add ASMR elements to existing content',
    category: 'asmr',
    icon: 'Plus',
    color: 'text-violet-400',
    orchestratorConfig: {
      defaultPrompt: 'Add ASMR audio elements and effects to the following content:',
      aspectRatio: '9:16',
      enableMusic: false,
    },
    inputFields: [
      {
        id: 'contentType',
        label: 'Content Type',
        type: 'select',
        options: [
          { label: 'Product Review', value: 'review' },
          { label: 'Cooking', value: 'cooking' },
          { label: 'Unboxing', value: 'unboxing' },
          { label: 'Art/Craft', value: 'art' },
        ],
        default: 'review',
        required: true,
      },
    ],
    tags: ['asmr', 'addon', 'enhance'],
  },
]
