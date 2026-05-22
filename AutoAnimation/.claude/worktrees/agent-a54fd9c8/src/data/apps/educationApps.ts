import type { OneClickApp } from '@/types/oneClickApp'

export const educationApps: OneClickApp[] = [
  {
    id: 'explainer',
    name: 'Explainer',
    description: 'Educational explainer video',
    category: 'education',
    icon: 'GraduationCap',
    color: 'text-emerald-400',
    orchestratorConfig: {
      defaultPrompt: 'Create an educational explainer video about:',
      aspectRatio: '9:16',
      enableMusic: true,
      enableCaptions: true,
      enableMotionGraphics: true,
      enableSvgObjects: true,
    },
    inputFields: [
      { id: 'topic', label: 'Topic', type: 'textarea', placeholder: 'What to explain...', required: true },
      {
        id: 'complexity',
        label: 'Complexity Level',
        type: 'select',
        options: [
          { label: 'Beginner', value: 'beginner' },
          { label: 'Intermediate', value: 'intermediate' },
          { label: 'Advanced', value: 'advanced' },
        ],
        default: 'beginner',
      },
    ],
    tags: ['education', 'explainer', 'learning'],
  },
  {
    id: 'tutorial',
    name: 'Tutorial',
    description: 'Step-by-step tutorial',
    category: 'education',
    icon: 'BookOpen',
    color: 'text-emerald-400',
    orchestratorConfig: {
      defaultPrompt: 'Create a step-by-step tutorial video covering:',
      aspectRatio: '9:16',
      enableCaptions: true,
      enableMotionGraphics: true,
      enableMusic: true,
    },
    inputFields: [
      { id: 'steps', label: 'Steps', type: 'textarea', placeholder: 'List the tutorial steps (one per line)...', required: true },
    ],
    tags: ['tutorial', 'how-to', 'steps'],
  },
  {
    id: 'whiteboard-edu',
    name: 'Whiteboard',
    description: 'Whiteboard animation',
    category: 'education',
    icon: 'PenTool',
    color: 'text-emerald-400',
    orchestratorConfig: {
      defaultPrompt: 'Create a whiteboard animation explaining:',
      aspectRatio: '16:9',
      enableMusic: true,
      enableCaptions: true,
      stylePreset: 'whiteboard',
    },
    inputFields: [
      { id: 'content', label: 'Content', type: 'textarea', placeholder: 'Content to illustrate...', required: true },
      {
        id: 'drawingStyle',
        label: 'Drawing Style',
        type: 'select',
        options: [
          { label: 'Simple Line', value: 'simple' },
          { label: 'Sketch', value: 'sketch' },
          { label: 'Detailed', value: 'detailed' },
        ],
        default: 'simple',
      },
    ],
    tags: ['whiteboard', 'drawing', 'education'],
  },
  {
    id: 'flashcard',
    name: 'Flashcard',
    description: 'Animated flashcard quiz',
    category: 'education',
    icon: 'Layers',
    color: 'text-emerald-400',
    orchestratorConfig: {
      defaultPrompt: 'Create animated flashcard quiz content with:',
      aspectRatio: '9:16',
      enableMusic: true,
      enableMotionGraphics: true,
    },
    inputFields: [
      { id: 'pairs', label: 'Q&A Pairs', type: 'textarea', placeholder: 'Question: Answer (one pair per line)...', required: true },
    ],
    tags: ['flashcard', 'quiz', 'learning'],
  },
]
