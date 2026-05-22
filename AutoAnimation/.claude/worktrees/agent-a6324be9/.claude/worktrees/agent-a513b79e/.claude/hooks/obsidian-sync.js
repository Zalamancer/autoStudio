#!/usr/bin/env node

/**
 * Claude Code PostToolUse hook: syncs .md files to Obsidian vault
 * after Write/Edit tool calls that modify markdown files.
 *
 * Vault: /Users/ihsanduru/Desktop/Manim/AutoAnimation/
 * Preserves directory structure relative to project root.
 */

const fs = require('node:fs')
const path = require('node:path')

const OBSIDIAN_VAULT = '/Users/ihsanduru/Desktop/Manim'
const OBSIDIAN_TARGET = path.join(OBSIDIAN_VAULT, 'AutoAnimation')
const PROJECT_ROOT = '/Users/ihsanduru/autoStudio/AutoAnimation'

// Read hook input from stdin (Claude Code pipes JSON on stdin)
let data = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => { data += chunk })
process.stdin.on('end', () => {
  try {
    const hookInput = JSON.parse(data)
    const toolName = hookInput.tool_name || ''
    const toolInput = hookInput.tool_input || {}

    // Only care about Write and Edit tool calls
    if (toolName !== 'Write' && toolName !== 'Edit') {
      console.log(data)
      return
    }

    const filePath = toolInput.file_path || ''

    // Only sync .md files within our project
    if (!filePath.endsWith('.md') || !filePath.startsWith(PROJECT_ROOT)) {
      console.log(data)
      return
    }

    // Skip node_modules and .claude internal files
    if (filePath.includes('node_modules') || filePath.includes('/.claude/')) {
      console.log(data)
      return
    }

    const relativePath = path.relative(PROJECT_ROOT, filePath)
    const targetPath = path.join(OBSIDIAN_TARGET, relativePath)
    const targetDir = path.dirname(targetPath)

    // Create target directory if needed
    fs.mkdirSync(targetDir, { recursive: true })

    // Copy the file
    fs.copyFileSync(filePath, targetPath)
  } catch (err) {
    // Silent fail — don't block Claude Code if Obsidian vault is unavailable
  }

  // Always pass through the original data
  console.log(data)
})
