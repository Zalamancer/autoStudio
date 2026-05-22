/**
 * PortfolioPage — Public portfolio page for displaying user's exported videos.
 *
 * Accessible at /portfolio/:username. Shows the creator's profile, bio,
 * social links, and a grid of published video projects with embeddable player.
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePortfolioStore } from '@/stores/usePortfolioStore'
import type { PortfolioProject, EmbedConfig } from '@/types/portfolio'
import { generateEmbedCode, DEFAULT_EMBED_CONFIG } from '@/types/portfolio'
import {
  User,
  Globe,
  Play,
  Heart,
  Eye,
  Code2,
  X,
  Copy,
  Check,
  ArrowLeft,
} from 'lucide-react'
import { PanelSlider } from '@/components/ui/panel-controls'

export function PortfolioPage() {
  const { username } = useParams<{ username: string }>()
  const viewingProfile = usePortfolioStore((s) => s.viewingProfile)
  const viewingProjects = usePortfolioStore((s) => s.viewingProjects)
  const fetchProfile = usePortfolioStore((s) => s.fetchProfile)
  const fetchProfileProjects = usePortfolioStore((s) => s.fetchProfileProjects)
  const likeProject = usePortfolioStore((s) => s.likeProject)

  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null)
  const [showEmbed, setShowEmbed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (username) {
      fetchProfile(username)
    }
  }, [username, fetchProfile])

  useEffect(() => {
    if (viewingProfile?.userId) {
      fetchProfileProjects(viewingProfile.userId)
    }
  }, [viewingProfile?.userId, fetchProfileProjects])

  const handleCopyEmbed = useCallback((projectId: string) => {
    const code = generateEmbedCode(projectId)
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  if (!viewingProfile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white/40">
        Loading profile...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Back to app link */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Editor
        </Link>
      </div>

      {/* Profile header */}
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl font-bold shrink-0">
            {viewingProfile.avatarUrl ? (
              <img
                src={viewingProfile.avatarUrl}
                alt={viewingProfile.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              viewingProfile.displayName?.charAt(0)?.toUpperCase() || <User size={32} />
            )}
          </div>

          {/* Profile info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">
              {viewingProfile.displayName || viewingProfile.username}
            </h1>
            <p className="text-white/40 text-sm">@{viewingProfile.username}</p>
            {viewingProfile.bio && (
              <p className="text-white/60 text-sm mt-2 max-w-lg">{viewingProfile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 mt-3 text-sm">
              <div>
                <span className="font-semibold">{viewingProfile.projectCount}</span>{' '}
                <span className="text-white/40">projects</span>
              </div>
              <div>
                <span className="font-semibold">{viewingProfile.totalViews}</span>{' '}
                <span className="text-white/40">views</span>
              </div>
              <div>
                <span className="font-semibold">{viewingProfile.followerCount}</span>{' '}
                <span className="text-white/40">followers</span>
              </div>
            </div>

            {/* Social links */}
            {viewingProfile.socialLinks && Object.keys(viewingProfile.socialLinks).length > 0 && (
              <div className="flex items-center gap-3 mt-3">
                {viewingProfile.socialLinks.website && (
                  <a
                    href={viewingProfile.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white"
                  >
                    <Globe size={16} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects grid */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-lg font-semibold mb-4">Published Works</h2>

        {viewingProjects.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Play size={32} className="mx-auto mb-3" />
            <p>No published projects yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {viewingProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onPlay={() => setSelectedProject(project)}
                onLike={() => likeProject(project.id)}
                onEmbed={() => {
                  setSelectedProject(project)
                  setShowEmbed(true)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video player modal */}
      {selectedProject && !showEmbed && (
        <VideoPlayerModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onEmbed={() => setShowEmbed(true)}
        />
      )}

      {/* Embed modal */}
      {selectedProject && showEmbed && (
        <EmbedModal
          project={selectedProject}
          onClose={() => {
            setShowEmbed(false)
            setSelectedProject(null)
          }}
          onCopy={() => handleCopyEmbed(selectedProject.id)}
          copied={copied}
        />
      )}
    </div>
  )
}

// ── Project Card ──

function ProjectCard({
  project,
  onPlay,
  onLike,
  onEmbed,
}: {
  project: PortfolioProject
  onPlay: () => void
  onLike: () => void
  onEmbed: () => void
}) {
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/8 transition-colors group">
      {/* Thumbnail */}
      <div
        className="relative aspect-video bg-gray-800 cursor-pointer"
        onClick={onPlay}
      >
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={32} className="text-white/20" />
          </div>
        )}
        {/* Duration badge */}
        {project.duration > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px]">
            {Math.floor(project.duration / 60)}:{String(Math.floor(project.duration % 60)).padStart(2, '0')}
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
          <Play size={40} className="text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{project.title}</h3>
        {project.description && (
          <p className="text-xs text-white/40 mt-1 line-clamp-2">{project.description}</p>
        )}

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-white/40"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats & actions */}
        <div className="flex items-center gap-3 mt-2 text-white/40">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLike()
            }}
            className={`flex items-center gap-1 text-xs hover:text-red-400 transition-colors ${
              project.isLiked ? 'text-red-400' : ''
            }`}
          >
            <Heart size={12} fill={project.isLiked ? 'currentColor' : 'none'} />
            {project.likeCount}
          </button>
          <div className="flex items-center gap-1 text-xs">
            <Eye size={12} />
            {project.viewCount}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEmbed()
            }}
            className="ml-auto text-xs hover:text-white transition-colors"
          >
            <Code2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Video Player Modal ──

function VideoPlayerModal({
  project,
  onClose,
  onEmbed,
}: {
  project: PortfolioProject
  onClose: () => void
  onEmbed: () => void
}) {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl max-w-3xl w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video */}
        <div className="aspect-video bg-black">
          <video
            src={project.videoUrl}
            controls
            autoPlay
            className="w-full h-full"
          />
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{project.title}</h2>
              {project.description && (
                <p className="text-sm text-white/50 mt-1">{project.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onEmbed}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-xs hover:bg-white/20"
              >
                <Code2 size={12} />
                Embed
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Embed Modal ──

function EmbedModal({
  project,
  onClose,
  onCopy,
  copied,
}: {
  project: PortfolioProject
  onClose: () => void
  onCopy: () => void
  copied: boolean
}) {
  const [config, setConfig] = useState<EmbedConfig>({ ...DEFAULT_EMBED_CONFIG })
  const embedCode = generateEmbedCode(project.id, config)

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl max-w-md w-full mx-4 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Embed Player</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X size={16} />
          </button>
        </div>

        {/* Embed code */}
        <div className="bg-black/30 rounded-lg p-3 mb-4">
          <code className="text-xs text-green-400 break-all">{embedCode}</code>
        </div>

        {/* Options */}
        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoplay}
              onChange={(e) => setConfig({ ...config, autoplay: e.target.checked })}
            />
            Autoplay
          </label>
          <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={config.loop}
              onChange={(e) => setConfig({ ...config, loop: e.target.checked })}
            />
            Loop
          </label>
          <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={config.controls}
              onChange={(e) => setConfig({ ...config, controls: e.target.checked })}
            />
            Show controls
          </label>
          <div className="grid grid-cols-2 gap-2">
            <PanelSlider
              label="W"
              value={config.width}
              onChange={(v) => setConfig({ ...config, width: v })}
              min={100}
              max={1920}
              step={1}
              suffix="px"
              inline
            />
            <PanelSlider
              label="H"
              value={config.height}
              onChange={(v) => setConfig({ ...config, height: v })}
              min={100}
              max={1920}
              step={1}
              suffix="px"
              inline
            />
          </div>
        </div>

        {/* Copy button */}
        <button
          onClick={onCopy}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-500"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Embed Code'}
        </button>
      </div>
    </div>
  )
}

export default PortfolioPage
