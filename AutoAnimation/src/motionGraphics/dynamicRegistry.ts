/**
 * Bridge between AI-generated MotionDesignDescription and the
 * existing motion graphic registration + instance system.
 *
 * Supports flow-aware placement: when adding multiple motion designs
 * they are sequenced on the timeline with optional overlap for transitions.
 */

import React from 'react'
import { registerMotionGraphic } from './registry'
import { DynamicMotionDesignRenderer } from './DynamicMotionDesignRenderer'
import { useMotionGraphicStore } from '@/stores/useMotionGraphicStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import type { MotionDesignDescription } from '@/types/motionDesign'
import type { MotionGraphicProps } from '@/types/motionGraphic'
import type { FlowTransitionType } from '@/services/motionDesign/visualFlow'

let counter = 0

/**
 * Register a MotionDesignDescription as a motion graphic template
 * and add an instance to the canvas.
 * Returns the instance ID.
 */
export function registerAndAddMotionDesign(description: MotionDesignDescription): string {
  const templateId = `dynamic-${Date.now()}-${++counter}`

  // Register the template
  registerDynamicTemplate(templateId, description)

  // Create instance
  const { canvasWidth: width, canvasHeight: height } = useCanvasStore.getState()
  const fps = usePlaybackStore.getState().fps
  const instanceId = `mg-${templateId}`

  useMotionGraphicStore.getState().addInstance({
    id: instanceId,
    templateId,
    name: description.name,
    config: { ...description.defaultConfig },
    position: { x: width / 2, y: height / 2 },
    scale: 1,
    opacity: 1,
    zIndex: 10,
    rotation: 0,
    visible: true,
    startFrame: 0,
    endFrame: fps * 5, // default 5 seconds
    dynamicDescription: description,
    flowRole: description.flowRole,
    flowTransition: 'crossfade',
    palette: description.palette,
  })

  return instanceId
}

/**
 * Register and add a motion design with flow-aware placement.
 * Places the new instance after the last existing motion graphic with
 * an optional overlap for smooth transitions.
 */
export function registerAndAddMotionDesignInFlow(
  description: MotionDesignDescription,
  options: {
    durationSec?: number
    transitionType?: FlowTransitionType
    overlapFrames?: number
  } = {},
): string {
  const templateId = `dynamic-${Date.now()}-${++counter}`
  registerDynamicTemplate(templateId, description)

  const { canvasWidth: width, canvasHeight: height } = useCanvasStore.getState()
  const fps = usePlaybackStore.getState().fps
  const instances = useMotionGraphicStore.getState().instances
  const instanceId = `mg-${templateId}`

  const duration = Math.round((options.durationSec ?? 5) * fps)
  const overlap = options.overlapFrames ?? Math.round(fps * 0.3)

  // Find the latest end frame among existing instances
  let latestEnd = 0
  for (const inst of instances) {
    if (inst.endFrame > latestEnd) latestEnd = inst.endFrame
  }

  const startFrame = Math.max(0, latestEnd - overlap)
  const endFrame = startFrame + duration

  // Update the previous instance's flowTransition
  if (instances.length > 0 && options.transitionType) {
    const lastInst = instances.reduce((a, b) => a.endFrame > b.endFrame ? a : b)
    useMotionGraphicStore.getState().updateInstance(lastInst.id, {
      flowTransition: options.transitionType,
    })
  }

  useMotionGraphicStore.getState().addInstance({
    id: instanceId,
    templateId,
    name: description.name,
    config: { ...description.defaultConfig },
    position: { x: width / 2, y: height / 2 },
    scale: 1,
    opacity: 1,
    zIndex: 10,
    rotation: 0,
    visible: true,
    startFrame,
    endFrame,
    dynamicDescription: description,
    flowRole: description.flowRole,
    flowTransition: 'crossfade',
    palette: description.palette,
  })

  return instanceId
}

/**
 * Register a MotionDesignDescription as a template without creating an instance.
 * Used for project load to re-register persisted dynamic templates.
 */
export function reRegisterMotionDesign(
  templateId: string,
  description: MotionDesignDescription,
): void {
  registerDynamicTemplate(templateId, description)
}

export function registerDynamicTemplate(
  templateId: string,
  description: MotionDesignDescription,
): void {
  // Create a component that closes over the description
  const Component: React.FC<MotionGraphicProps> = (props) =>
    React.createElement(DynamicMotionDesignRenderer, {
      ...props,
      description,
    })
  Component.displayName = `DynamicMG_${templateId}`

  registerMotionGraphic({
    id: templateId,
    title: description.name,
    description: description.description,
    tags: ['ai-generated', 'dynamic'],
    category: 'ai-generated',
    component: Component as any,
    configSchema: description.configSchema,
    defaultConfig: description.defaultConfig,
  })
}
