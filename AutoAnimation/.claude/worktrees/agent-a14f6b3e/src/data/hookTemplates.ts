export interface HookTemplate {
  id: string
  name: string
  pattern: string
  category: 'question' | 'pov' | 'list' | 'challenge' | 'controversy' | 'story' | 'reveal'
  platforms: ('tiktok' | 'youtube' | 'instagram')[]
  viralScore: number  // historical avg 0-100
}

export const HOOK_TEMPLATES: HookTemplate[] = [
  // Questions
  { id: 'hook-did-you-know', name: 'Did You Know', pattern: 'Did you know {topic}?', category: 'question', platforms: ['tiktok', 'youtube', 'instagram'], viralScore: 78 },
  { id: 'hook-what-if', name: 'What If', pattern: 'What if I told you {topic}?', category: 'question', platforms: ['tiktok', 'youtube', 'instagram'], viralScore: 82 },
  { id: 'hook-why-nobody', name: 'Why Nobody', pattern: 'Why does nobody talk about {topic}?', category: 'question', platforms: ['tiktok', 'youtube'], viralScore: 75 },
  { id: 'hook-guess-what', name: 'Guess What', pattern: 'Guess what happens when {topic}?', category: 'question', platforms: ['tiktok', 'instagram'], viralScore: 71 },

  // POV
  { id: 'hook-pov', name: 'POV', pattern: "POV: you're {topic}", category: 'pov', platforms: ['tiktok', 'instagram'], viralScore: 85 },
  { id: 'hook-imagine', name: 'Imagine', pattern: 'Imagine {topic}. This is what happens.', category: 'pov', platforms: ['tiktok', 'youtube'], viralScore: 73 },

  // Lists
  { id: 'hook-3-things', name: '3 Things', pattern: '3 things about {topic} nobody tells you', category: 'list', platforms: ['tiktok', 'youtube', 'instagram'], viralScore: 80 },
  { id: 'hook-5-mistakes', name: '5 Mistakes', pattern: '5 mistakes everyone makes with {topic}', category: 'list', platforms: ['youtube', 'instagram'], viralScore: 76 },
  { id: 'hook-top-reasons', name: 'Top Reasons', pattern: 'The top reasons why {topic}', category: 'list', platforms: ['youtube', 'tiktok'], viralScore: 74 },

  // Challenge
  { id: 'hook-stop-doing', name: 'Stop Doing', pattern: 'Stop doing {topic}. Do this instead.', category: 'challenge', platforms: ['tiktok', 'youtube', 'instagram'], viralScore: 83 },
  { id: 'hook-youre-wrong', name: "You're Wrong", pattern: "You've been doing {topic} wrong your entire life.", category: 'challenge', platforms: ['tiktok', 'youtube'], viralScore: 79 },
  { id: 'hook-bet-you', name: "Bet You Didn't", pattern: "I bet you didn't know this about {topic}.", category: 'challenge', platforms: ['tiktok', 'instagram'], viralScore: 77 },

  // Controversy
  { id: 'hook-unpopular', name: 'Unpopular Opinion', pattern: 'Unpopular opinion: {topic}', category: 'controversy', platforms: ['tiktok', 'youtube', 'instagram'], viralScore: 86 },
  { id: 'hook-this-is-why', name: 'This Is Why', pattern: 'This is why {topic} is wrong about {detail}', category: 'controversy', platforms: ['tiktok', 'youtube'], viralScore: 81 },
  { id: 'hook-nobody-ready', name: 'Nobody Ready', pattern: "Nobody is ready for this conversation about {topic}.", category: 'controversy', platforms: ['tiktok', 'instagram'], viralScore: 84 },

  // Story
  { id: 'hook-i-tried', name: 'I Tried', pattern: "I tried {topic} for 30 days. Here's what happened.", category: 'story', platforms: ['youtube', 'tiktok', 'instagram'], viralScore: 88 },
  { id: 'hook-true-story', name: 'True Story', pattern: 'True story: {topic}', category: 'story', platforms: ['tiktok', 'youtube'], viralScore: 76 },
  { id: 'hook-day-in-life', name: 'Day In Life', pattern: 'A day in the life of {topic}', category: 'story', platforms: ['tiktok', 'youtube', 'instagram'], viralScore: 79 },

  // Reveal
  { id: 'hook-real-reason', name: 'Real Reason', pattern: 'The real reason {topic}', category: 'reveal', platforms: ['tiktok', 'youtube', 'instagram'], viralScore: 82 },
  { id: 'hook-secret', name: 'Secret', pattern: "The secret about {topic} that experts won't tell you", category: 'reveal', platforms: ['tiktok', 'youtube'], viralScore: 80 },
  { id: 'hook-truth-about', name: 'Truth About', pattern: 'The truth about {topic} will surprise you', category: 'reveal', platforms: ['youtube', 'tiktok', 'instagram'], viralScore: 77 },
  { id: 'hook-finally', name: 'Finally Revealed', pattern: 'They finally revealed why {topic}', category: 'reveal', platforms: ['tiktok', 'youtube'], viralScore: 75 },
]

export function getHooksByCategory(category: HookTemplate['category']): HookTemplate[] {
  return HOOK_TEMPLATES.filter(h => h.category === category)
}

export function getHooksForPlatform(platform: 'tiktok' | 'youtube' | 'instagram'): HookTemplate[] {
  return HOOK_TEMPLATES.filter(h => h.platforms.includes(platform))
}

export function getTopHooks(count: number = 5): HookTemplate[] {
  return [...HOOK_TEMPLATES].sort((a, b) => b.viralScore - a.viralScore).slice(0, count)
}
