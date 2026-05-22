# UX Action Flow Audit

Complete map of every user action in ProAnimate, organized by area. Each entry documents: what the user clicks, what should happen, and potential issues to investigate.

**Legend:** `[OK]` verified working | `[?]` needs manual testing | `[!]` known or suspected issue

---

## 1. LANDING PAGE (`/`)

### Navbar
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 1.1 | Click logo | Scroll to top / stay on `/` | [?] |
| 1.2 | Click "Features" | Smooth scroll to `#features` | [?] |
| 1.3 | Click "How It Works" | Smooth scroll to `#how-it-works` | [?] |
| 1.4 | Click "Pricing" | Smooth scroll to `#pricing` | [?] |
| 1.5 | Click "Sign In" | Navigate to `/dashboard` | [?] |
| 1.6 | Click "Try for free" | Navigate to `/dashboard` | [?] |
| 1.7 | Click mobile hamburger | Opens mobile overlay menu | [?] |
| 1.8 | Click mobile nav links | Smooth scroll + close overlay | [?] |

### Hero Section
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 1.9 | Click hero CTA button | Navigate to `/dashboard` | [?] |

### Pricing Section
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 1.10 | Click plan CTA button | Navigate to `/dashboard` or `/billing` | [?] |

### FAQ Section
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 1.11 | Click FAQ question | Expand/collapse answer | [?] |

### Footer
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 1.12 | Click social links (Twitter, YouTube, TikTok) | Open external URLs in new tab | [?] |
| 1.13 | Click "Privacy Policy" | Navigate to `/privacy` | [?] |
| 1.14 | Click "Terms of Service" | Navigate to `/terms` | [?] |
| 1.15 | Click footer product links (Features, Pricing, etc.) | Smooth scroll to sections | [?] |
| 1.16 | Click footer resource links (Docs, API, Templates) | Navigate or open external | [?] |

---

## 2. AUTH FLOW

### Login Page (`/login`)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 2.1 | Type email + password, click "Sign In" | Auth success → redirect to `/dashboard` | [?] |
| 2.2 | Click "Continue with Google" | Google OAuth popup → redirect to `/dashboard` | [?] |
| 2.3 | Click "Don't have an account? Sign up" | Switch form to signup mode | [?] |
| 2.4 | Type email + password, click "Create Account" | Account created → redirect to `/dashboard` | [?] |
| 2.5 | Click "Forgot password?" | Switch to reset form | [?] |
| 2.6 | Type email, click "Send Reset Email" | Sends reset link, shows confirmation | [?] |
| 2.7 | Click "Back to sign in" | Returns to login form | [?] |
| 2.8 | Submit with invalid email | Show validation error | [?] |
| 2.9 | Submit with wrong password | Show auth error | [?] |
| 2.10 | Submit signup with mismatched passwords | Show validation error | [?] |
| 2.11 | Submit signup with <6 char password | Show validation error | [?] |

### Reset Password (`/reset-password`)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 2.12 | Type new password + confirm, click "Update Password" | Password updated → redirect to `/dashboard` | [?] |
| 2.13 | Visit without valid token in URL | Show error or redirect | [?] |

### Sign In Modal (from editor/dashboard)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 2.14 | Open sign in modal | Modal appears with auth form | [?] |
| 2.15 | Sign in successfully | Modal auto-closes, UI updates | [?] |
| 2.16 | Click backdrop | Modal closes | [?] |
| 2.17 | Press Escape | Modal closes | [?] |

---

## 3. DASHBOARD (`/dashboard`)

### Dashboard Header
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 3.1 | Click "Sign In" button (logged out) | Opens SignInModal | [?] |
| 3.2 | Click "Sign Out" (logged in) | Signs out, redirects to login | [?] |
| 3.3 | Click credit badge | Navigate to `/billing` | [?] |
| 3.4 | Click "Brand Intel" | Navigate to `/brand` | [?] |
| 3.5 | Click "Open Editor" | Navigate to `/editor` | [?] |

### Tab Navigation
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 3.6 | Click "Clips" tab | Shows clip grid | [?] |
| 3.7 | Click "Templates" tab | Shows all templates | [?] |
| 3.8 | Click "My Templates" tab | Shows user's saved templates | [?] |

### Welcome Screen (first visit, no clips)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 3.9 | Type prompt, click "Generate Video" | Navigate to `/editor` with prompt in state | [?] |
| 3.10 | Press Cmd+Enter in prompt textarea | Same as "Generate Video" | [?] |
| 3.11 | Click "Open blank project" | Navigate to `/editor` without prompt | [?] |

### Clip List - Search & Filter
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 3.12 | Type in search box | Filters clips by prompt text | [?] |
| 3.13 | Click sort dropdown (Newest/Oldest/A-Z) | Re-sorts clip grid | [?] |
| 3.14 | Click status filter pill (All/Draft/Planning/Ready/Executing/Complete/Error) | Filters by status | [?] |

### Clip List - Action Buttons
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 3.15 | Click "Execute All" | Queues all ready clips for execution | [?] |
| 3.16 | Click "Batch" | Toggles batch create panel | [?] |
| 3.17 | Click "New Clip" | Adds empty clip to grid | [?] |

### Batch Create Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 3.18 | Enter prompts (one per line) | Parses multiple prompts | [?] |
| 3.19 | Configure settings (aspect ratio, duration, character, etc.) | Settings applied to all clips | [?] |
| 3.20 | Click "Create & Plan" | Creates all clips, shows success/failure count | [?] |
| 3.21 | Click "Cancel" | Closes panel | [?] |

### Clip Card
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 3.22 | Click expand chevron | Expands to show orchestrator panel | [?] |
| 3.23 | Click "Open in Editor" | Navigate to `/editor` with clip plan | [?] |
| 3.24 | Click "Delete" | Confirmation dialog → delete on confirm | [?] |
| 3.25 | Cancel delete confirmation | Dialog closes, clip preserved | [?] |

### Expanded Clip - Prompt Phase (Draft/Error, no plan)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 3.26 | Edit prompt textarea | Updates clip prompt | [?] |
| 3.27 | Click "Generate Plan" | Generates AI plan, shows spinner | [?] |

### Expanded Clip - Review Phase (plan ready)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 3.28 | Click "Execute" | Queues clip for execution | [?] |
| 3.29 | Click "Regenerate" | Re-generates plan | [?] |
| 3.30 | Click "Reset" | Returns to prompt phase | [?] |

### Expanded Clip - Execution Phase
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 3.31 | Click "Retry" on failed step | Retries from that step | [?] |
| 3.32 | Click "Skip" on failed step | Skips step, continues | [?] |
| 3.33 | Click "Reset" | Returns to prompt phase | [?] |

### Expanded Clip - Done Phase
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 3.34 | Click "Play" | Opens video preview modal | [?] |
| 3.35 | Click "Download" | Downloads exported video file | [?] |
| 3.36 | Click "Publish" | Opens share modal | [?] |
| 3.37 | Click "Insights" | Opens analytics modal | [?] |

### Dashboard Modals
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 3.38 | Close video preview modal (X/backdrop/Escape) | Modal closes | [?] |
| 3.39 | Close share modal | Modal closes | [?] |
| 3.40 | Close analytics modal | Modal closes | [?] |

---

## 4. EDITOR - TOP MENU BAR

### File Menu
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 4.1 | Click "Projects" | Opens projects modal | [?] |
| 4.2 | Click "Save" (Cmd+S) | Saves current project | [?] |
| 4.3 | Click "Export" | Opens export modal | [?] |
| 4.4 | Click "Save as Template" | Saves current project as template | [?] |

### View Menu
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 4.5 | Click "Classic" | Switches to classic editor view | [?] |
| 4.6 | Click "Node View" | Switches to node-based editor | [?] |

### Direct Buttons
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 4.7 | Click "Settings" | Opens settings modal | [?] |
| 4.8 | Click "Marketplace" | Opens library modal | [?] |
| 4.9 | Click "Recordings" | Opens recordings modal | [?] |
| 4.10 | Click "Dashboard" | Navigates to `/dashboard` | [?] |
| 4.11 | Click "Dev Mode" (admin only) | Toggles dev features | [?] |

### Right Side
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 4.12 | Click "Sign In" / "Sign Out" | Auth action | [?] |
| 4.13 | Click notification bell | Opens notification dropdown | [?] |
| 4.14 | Click credit badge | Shows credits / opens upgrade | [?] |
| 4.15 | Click "Render" (green button) | Opens export modal | [?] |
| 4.16 | View save status indicator | Shows Saving/Saved/Unsaved/Error | [?] |

---

## 5. EDITOR - LEFT PANEL TAB NAVIGATION

### Tab Groups (11 groups, ~33 sub-tabs)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 5.1 | Click "Characters" group → character tab | Opens character creation panel | [?] |
| 5.2 | Click "Library" group → media tab | Opens media asset browser | [?] |
| 5.3 | Click "Image" group → assets tab | Opens AI image generation | [?] |
| 5.4 | Click "Image" group → memes tab | Opens meme generator | [?] |
| 5.5 | Click "Video" group → image-to-video tab | Opens video generation | [?] |
| 5.6 | Click "Video" group → cinema-studio tab | Opens cinema studio | [?] |
| 5.7 | Click "Video" group → crowd tab | Opens crowd generator | [?] |
| 5.8 | Click "Video" group → broll-suggest tab | Opens B-roll suggestions | [?] |
| 5.9 | Click "Audio" group → voice-clone tab | Opens voice cloning | [?] |
| 5.10 | Click "Audio" group → singing tab | Opens singing lip sync | [?] |
| 5.11 | Click "Audio" group → adaptive-music tab | Opens adaptive music | [?] |
| 5.12 | Click "Audio" group → audio-enhancement tab | Opens audio FX | [?] |
| 5.13 | Click "Audio" group → beat-sync tab | Opens beat sync | [?] |
| 5.14 | Click "Edit" group → mixed-media tab | Opens overlays & effects | [?] |
| 5.15 | Click "Edit" group → animStyle tab | Opens animation style transfer | [?] |
| 5.16 | Click "Script" group → scripts tab | Opens script generator | [?] |
| 5.17 | Click "Script" group → dialogue tab | Opens dialogue editor | [?] |
| 5.18 | Click "Script" group → transcript tab | Opens transcript editor | [?] |
| 5.19 | Click "Script" group → captions tab | Opens caption designer | [?] |
| 5.20 | Click "Design" group → text tab | Opens text overlay panel | [?] |
| 5.21 | Click "Design" group → transitions tab | Opens transition picker | [?] |
| 5.22 | Click "Design" group → camera tab | Opens camera controls | [?] |
| 5.23 | Click "Design" group → brand-kit tab | Opens brand kit | [?] |
| 5.24 | Click "Design" group → schema tab | Opens schema bindings | [?] |
| 5.25 | Click "Publish" group → auto-publish tab | Opens scheduling | [?] |
| 5.26 | Click "Publish" group → series tab | Opens series manager | [?] |
| 5.27 | Click "Publish" group → trends tab | Opens trend analysis | [?] |
| 5.28 | Click "Publish" group → virality tab | Opens virality scorer | [?] |
| 5.29 | Click "Publish" group → repurpose tab | Opens repurpose panel | [?] |
| 5.30 | Click "Layers" (direct) | Opens layer hierarchy | [?] |

---

## 6. EDITOR - LEFT PANEL CONTENT (per panel)

### 6A. Character Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6A.1 | Click "Create Character" | Starts character generation flow | [?] |
| 6A.2 | Click saved character thumbnail | Loads character to canvas | [?] |
| 6A.3 | Drag character to canvas | Drops character on stage | [?] |
| 6A.4 | Click "Delete" on character | Confirmation → removes character | [?] |
| 6A.5 | Click "Edit" on character | Opens character editor | [?] |
| 6A.6 | Click "Sync from Cloud" | Syncs cloud characters | [?] |
| 6A.7 | Click "Push to Cloud" | Uploads local characters | [?] |

### 6B. Media Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6B.1 | Search media assets | Filters asset list | [?] |
| 6B.2 | Click/drag media to canvas | Adds media to stage | [?] |
| 6B.3 | Upload media file | Adds to asset library | [?] |
| 6B.4 | Delete media asset | Removes from library | [?] |

### 6C. Voice Clone Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6C.1 | Upload voice sample | Starts clone process | [?] |
| 6C.2 | Click "Clone Voice" | Submits to ElevenLabs | [?] |
| 6C.3 | Select cloned voice | Sets as active voice | [?] |
| 6C.4 | Delete cloned voice | Removes voice | [?] |

### 6D. Script Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6D.1 | Type script prompt | Input captured | [?] |
| 6D.2 | Click "Generate Script" | AI generates script | [?] |
| 6D.3 | Edit generated script | Text editable | [?] |
| 6D.4 | Click "Use Script" | Applies to project | [?] |

### 6E. Dialogue Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6E.1 | Click "Add Character" | Adds dialogue character | [?] |
| 6E.2 | Edit character name/voice | Updates character config | [?] |
| 6E.3 | Click "Add Line" | Adds dialogue line | [?] |
| 6E.4 | Edit line text/emotion | Updates dialogue | [?] |
| 6E.5 | Reorder lines (drag) | Changes dialogue order | [?] |
| 6E.6 | Delete line | Removes from dialogue | [?] |
| 6E.7 | Click "Clear All" | Resets all dialogue | [?] |
| 6E.8 | Click "Generate Voice" | TTS for all lines | [?] |

### 6F. Text Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6F.1 | Click text preset | Adds text overlay to canvas | [?] |
| 6F.2 | Click "Add Text" | Adds blank text to canvas | [?] |

### 6G. Transition Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6G.1 | Browse transition presets | Shows preview thumbnails | [?] |
| 6G.2 | Drag transition to timeline clip | Applies transition | [?] |
| 6G.3 | Click transition preset | Preview animation | [?] |

### 6H. Caption Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6H.1 | Click "Generate Captions" | Auto-generates from audio | [?] |
| 6H.2 | Edit caption text | Updates subtitle text | [?] |
| 6H.3 | Adjust timing | Changes start/end | [?] |
| 6H.4 | Select caption style | Applies visual style | [?] |

### 6I. Brand Kit Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6I.1 | Set brand name | Saves brand identity | [?] |
| 6I.2 | Upload logo | Sets brand logo | [?] |
| 6I.3 | Pick brand colors | Updates color palette | [?] |
| 6I.4 | Select brand fonts | Updates typography | [?] |

### 6J. Publish Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6J.1 | Connect social account | OAuth flow for platform | [?] |
| 6J.2 | Click "Schedule" | Opens schedule picker | [?] |
| 6J.3 | Click "Publish Now" | Publishes to selected platforms | [?] |
| 6J.4 | Edit post caption/metadata | Updates publish config | [?] |

### 6K. Assets Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6K.1 | Browse animations | Shows animation library | [?] |
| 6K.2 | Click animation preset | Adds to canvas | [?] |
| 6K.3 | Browse SVG art | Shows SVG library | [?] |
| 6K.4 | Browse motion designs | Shows motion graphics | [?] |
| 6K.5 | Browse components | Shows component creator | [?] |

### 6L. Rig Editor Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6L.1 | Click "Back" button | Returns to previous panel | [?] |
| 6L.2 | Select mode dropdown (2D/3D) | Switches rig editor mode | [?] |
| 6L.3 | Click "RIG" tab | Shows bone/rig tools | [?] |
| 6L.4 | Click "ANIMATION" tab | Shows animation tools | [?] |
| 6L.5 | Expand AI Animation section | Shows rig animation generator | [?] |
| 6L.6 | Expand Perform/Live Avatar | Shows motion tracking | [?] |
| 6L.7 | Expand Motion Capture | Shows mocap tools | [?] |
| 6L.8 | Expand DeepMotion | Shows cloud mocap upload | [?] |

### 6M. DeepMotion Panel
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 6M.1 | Drag video file to upload area | Starts upload | [?] |
| 6M.2 | Select FPS (24/30/60) | Sets capture framerate | [?] |
| 6M.3 | Toggle face tracking | Enables/disables | [?] |
| 6M.4 | Toggle hand tracking | Enables/disables | [?] |
| 6M.5 | Click "Process" after upload | Sends to DeepMotion API | [?] |
| 6M.6 | Download GLB result | Auto-remaps to animation library | [?] |

---

## 7. EDITOR - CANVAS INTERACTIONS

### Canvas Area
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 7.1 | Click empty canvas | Deselects all elements | [?] |
| 7.2 | Click on element (text/shape/character/media) | Selects element, shows transform handles | [?] |
| 7.3 | Right-click canvas | Opens context menu | [?] |
| 7.4 | Right-click on element | Opens element-specific context menu | [?] |
| 7.5 | Drag from panel to canvas | Drop-adds element | [?] |
| 7.6 | Ctrl/Cmd + scroll | Zoom in/out | [?] |
| 7.7 | Middle-mouse drag | Pan canvas | [?] |
| 7.8 | Shift + scroll | Pan horizontally | [?] |
| 7.9 | Click-drag on empty area | Marquee selection | [?] |

### Context Menu Actions
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 7.10 | Context menu → "Duplicate" | Duplicates selected element | [?] |
| 7.11 | Context menu → "Delete" | Removes element | [?] |
| 7.12 | Context menu → "Show/Hide" | Toggles visibility | [?] |
| 7.13 | Context menu → "Flip Horizontal" (character) | Mirrors character | [?] |
| 7.14 | Context menu → "Reset Position" (character) | Resets transform | [?] |
| 7.15 | Context menu → "Paste" (empty canvas) | Pastes copied element | [?] |
| 7.16 | Context menu → "Reset View" | Resets zoom/pan | [?] |
| 7.17 | Click outside context menu / Escape | Closes menu | [?] |

### Transform Handles (SelectionTransformBox)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 7.18 | Drag corner handle | Resizes element from corner | [?] |
| 7.19 | Drag edge handle | Resizes from edge | [?] |
| 7.20 | Drag rotation handle | Rotates element | [?] |
| 7.21 | Drag center | Moves element | [?] |

### Canvas Toolbar
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 7.22 | Click aspect ratio dropdown | Opens ratio options | [?] |
| 7.23 | Select ratio (16:9, 9:16, 1:1, 4:3, 21:9) | Resizes canvas | [?] |
| 7.24 | Click AI Director button | Toggles AI director overlay | [?] |
| 7.25 | Click Copilot button | Opens AI copilot, shows pulse | [?] |
| 7.26 | Click Zoom Out (-) | Decreases zoom by 0.1 | [?] |
| 7.27 | Click zoom percentage | Resets zoom to 100% | [?] |
| 7.28 | Click Zoom In (+) | Increases zoom by 0.1 | [?] |
| 7.29 | Click 3D Layer View toggle | Switches 2D/3D perspective | [?] |
| 7.30 | Click Whiteboard toggle | Activates drawing tools | [?] |
| 7.31 | Click Reset (3D only) | Resets orbit rotation | [?] |
| 7.32 | Click Fit to View | Resets zoom to 1.0 and pan to (0,0) | [?] |
| 7.33 | Click Fullscreen | Enters fullscreen mode | [?] |

### Whiteboard Tools
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 7.34 | Click cursor tool | Switches to selection mode | [?] |
| 7.35 | Click hand tool | Switches to pan mode | [?] |
| 7.36 | Click pen tool group | Opens pen flyout (pen, chalk, marker, brush, fine pen) | [?] |
| 7.37 | Select pen variant | Sets active drawing tool | [?] |
| 7.38 | Click shape tool group | Opens shape flyout (line, rect, circle) | [?] |
| 7.39 | Select shape variant | Sets active shape tool | [?] |
| 7.40 | Click text tool | Activates text placement mode | [?] |
| 7.41 | Click eraser tool group | Opens eraser flyout (standard, precision) | [?] |
| 7.42 | Draw freehand stroke | Creates smooth curve path | [?] |
| 7.43 | Draw shape (drag) | Creates shape on release | [?] |
| 7.44 | Use eraser on strokes | Removes strokes/pixels | [?] |
| 7.45 | Drag whiteboard toolbar handle | Repositions toolbar | [?] |
| 7.46 | Click outside flyout | Closes flyout menu | [?] |

### Bone Overlay (Rig Editor on canvas)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 7.47 | Click on bone joint | Selects joint | [?] |
| 7.48 | Drag bone joint | Adjusts bone position/rotation | [?] |
| 7.49 | Release bone joint | Finalizes pose | [?] |

### 3D Gizmo
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 7.50 | Drag X/Y/Z arrow | Translates along axis | [?] |
| 7.51 | Drag plane handle (XY/YZ/ZX) | Translates on plane | [?] |
| 7.52 | Drag rotation ring | Rotates around axis | [?] |
| 7.53 | Hover gizmo handle | Highlights handle | [?] |

---

## 8. EDITOR - RIGHT PANEL (Property Editors)

### 8A. Shape Properties
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8A.1 | Drag X/Y position slider | Moves shape | [?] |
| 8A.2 | Drag width/height slider | Resizes shape | [?] |
| 8A.3 | Drag rotation slider | Rotates shape | [?] |
| 8A.4 | Drag opacity slider | Changes transparency | [?] |
| 8A.5 | Drag z-index slider | Changes stacking order | [?] |
| 8A.6 | Toggle visibility (eye icon) | Shows/hides shape | [?] |
| 8A.7 | Click reset button | Resets transform | [?] |
| 8A.8 | Open fill color picker | Sets fill color | [?] |
| 8A.9 | Open stroke color picker | Sets stroke color | [?] |
| 8A.10 | Drag stroke width slider | Changes stroke width | [?] |
| 8A.11 | Drag corner radius (rectangle) | Rounds corners | [?] |
| 8A.12 | Drag star points slider | Changes point count | [?] |
| 8A.13 | Drag inner radius slider (star) | Changes star inner radius | [?] |
| 8A.14 | Select blend mode | Changes blending | [?] |
| 8A.15 | Drag blur amount | Adds blur effect | [?] |
| 8A.16 | Select blur type | Changes blur method | [?] |
| 8A.17 | Click "Duplicate" | Duplicates shape | [?] |
| 8A.18 | Click "Remove" | Deletes shape | [?] |

### 8B. Text Properties
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8B.1 | Select font family | Changes font | [?] |
| 8B.2 | Select font weight | Changes weight | [?] |
| 8B.3 | Drag font size slider | Changes text size | [?] |
| 8B.4 | Drag line height slider | Changes line spacing | [?] |
| 8B.5 | Drag letter spacing slider | Changes letter spacing | [?] |
| 8B.6 | Click alignment button (L/C/R/J) | Sets horizontal align | [?] |
| 8B.7 | Click vertical align (T/M/B) | Sets vertical align | [?] |
| 8B.8 | Click text case (As/UPPER/lower) | Changes casing | [?] |
| 8B.9 | Open text color picker | Sets text color | [?] |
| 8B.10 | Open outline color picker | Sets outline color | [?] |
| 8B.11 | Drag outline width | Sets outline width | [?] |
| 8B.12 | Open shadow color picker | Sets shadow color | [?] |
| 8B.13 | Drag shadow offset X/Y | Moves shadow | [?] |
| 8B.14 | Drag shadow blur | Sets shadow softness | [?] |
| 8B.15 | Click text style preset | Applies preset style | [?] |
| 8B.16 | Click "Duplicate" | Duplicates text | [?] |
| 8B.17 | Click "Remove" | Deletes text | [?] |

### 8C. Video Properties
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8C.1 | Drag position/rotation/scale sliders | Transforms video | [?] |
| 8C.2 | Drag opacity slider | Changes transparency | [?] |
| 8C.3 | Toggle loop | Loops video playback | [?] |
| 8C.4 | Toggle visible | Shows/hides video | [?] |
| 8C.5 | Click "Remove Video" | Deletes video layer | [?] |

### 8D. Camera Properties
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8D.1 | Drag zoom slider | Changes camera zoom | [?] |
| 8D.2 | Drag pan X/Y sliders | Pans camera | [?] |
| 8D.3 | Drag rotation slider | Rotates camera | [?] |
| 8D.4 | Select easing (on keyframe) | Changes interpolation | [?] |
| 8D.5 | Click "Add Keyframe" | Adds camera keyframe | [?] |
| 8D.6 | Click "Reset Camera" | Resets all camera values | [?] |
| 8D.7 | Select camera body | Changes sensor/crop | [?] |
| 8D.8 | Select lens | Changes focal length | [?] |
| 8D.9 | Drag aperture slider | Changes DOF | [?] |
| 8D.10 | Drag focus distance | Changes focus plane | [?] |
| 8D.11 | Drag ISO slider | Changes exposure | [?] |
| 8D.12 | Toggle optical effects (DOF, Bokeh, etc.) | Enables/disables effects | [?] |
| 8D.13 | Toggle camera shake | Enables/disables shake | [?] |
| 8D.14 | Drag shake intensity/frequency/decay | Adjusts shake params | [?] |
| 8D.15 | Toggle focus pull | Enables/disables focus pull | [?] |
| 8D.16 | Drag focus pull params | Adjusts focus pull | [?] |

### 8E. 3D Character Properties
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8E.1 | Drag position X/Y/Z | Moves 3D character | [?] |
| 8E.2 | Drag rotation X/Y/Z | Rotates 3D character | [?] |
| 8E.3 | Drag scale | Resizes 3D character | [?] |
| 8E.4 | Drag animation speed | Changes playback speed | [?] |
| 8E.5 | Select active animation | Changes animation | [?] |
| 8E.6 | Toggle face lip sync | Enables lip sync | [?] |
| 8E.7 | Select viseme source | Changes viseme mapping | [?] |
| 8E.8 | Drag lip sync offset/size/rotation | Adjusts lip placement | [?] |
| 8E.9 | Click "Place on Face" | Auto-positions lip sync | [?] |
| 8E.10 | Toggle face expressions | Enables expressions | [?] |
| 8E.11 | Toggle eye/eyebrow overlays | Enables facial overlays | [?] |
| 8E.12 | Click "Place Eyes" / "Place Eyebrows" | Auto-positions | [?] |
| 8E.13 | Click "Visible/Hidden" toggle | Shows/hides character | [?] |
| 8E.14 | Click "Remove" | Deletes 3D character | [?] |

### 8F. Avatar Character Properties
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8F.1 | Drag position/scale/opacity sliders | Transforms avatar | [?] |
| 8F.2 | Select video generation model | Changes AI model | [?] |
| 8F.3 | Type video prompt | Sets generation prompt | [?] |
| 8F.4 | Click "Generate Video" | Generates avatar video | [?] |
| 8F.5 | Select lip sync model | Changes lip sync AI | [?] |
| 8F.6 | Toggle audio source (voice/upload) | Switches audio input | [?] |
| 8F.7 | Select voice | Sets TTS voice | [?] |
| 8F.8 | Upload audio file | Sets custom audio | [?] |
| 8F.9 | Click "Generate Lip Sync" | Generates lip animation | [?] |

### 8G. Pixel Art Character Properties
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8G.1 | Drag position/scale/opacity | Transforms pixel character | [?] |
| 8G.2 | Adjust direction slider | Changes facing direction | [?] |
| 8G.3 | Toggle visibility | Shows/hides character | [?] |
| 8G.4 | Click "Remove" | Deletes pixel character | [?] |
| 8G.5 | Select active animation | Changes animation | [?] |
| 8G.6 | Drag animation speed | Changes speed | [?] |
| 8G.7 | Click "Generate New Animation" | AI generates animation | [?] |

### 8H. Group Transform (Multi-part Character)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8H.1 | Drag group position X/Y | Moves entire character | [?] |
| 8H.2 | Drag group scale X/Y | Resizes character | [?] |
| 8H.3 | Toggle scale lock | Links X/Y scaling | [?] |
| 8H.4 | Drag group rotation | Rotates character | [?] |
| 8H.5 | Drag group z-index | Changes stacking | [?] |
| 8H.6 | Click "Reset All" | Resets group transform | [?] |
| 8H.7 | Expand/collapse part layer | Shows/hides part controls | [?] |
| 8H.8 | Toggle part visibility | Shows/hides individual part | [?] |
| 8H.9 | Drag part position/scale/rotation | Transforms individual part | [?] |
| 8H.10 | Drag part reorder handle | Reorders part layers | [?] |

### 8I. Whiteboard Properties
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8I.1 | Open color picker | Sets drawing color | [?] |
| 8I.2 | Click quick color preset | Sets color instantly | [?] |
| 8I.3 | Select pen preset | Changes pen style | [?] |
| 8I.4 | Drag pen size slider | Changes brush size | [?] |
| 8I.5 | Drag thinning/smoothing/streamline sliders | Adjusts stroke params | [?] |
| 8I.6 | Select line cap/join | Changes stroke endpoints | [?] |

### 8J. Stroke Animation Properties
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8J.1 | Select easing preset | Changes animation easing | [?] |
| 8J.2 | Drag bezier control points | Custom easing curve | [?] |
| 8J.3 | Drag duration slider | Sets animation duration | [?] |
| 8J.4 | Open stroke color picker | Changes stroke color | [?] |
| 8J.5 | Drag stroke width slider | Changes line width | [?] |

### 8K. Style Panel (Artistic Effects)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8K.1 | Select boiling line preset | Applies sketch effect | [?] |
| 8K.2 | Drag intensity slider | Adjusts effect strength | [?] |
| 8K.3 | Click detail level (Low/Med/High) | Changes detail | [?] |
| 8K.4 | Toggle roughen edges | Adds edge roughness | [?] |
| 8K.5 | Toggle pixel art mode | Pixelizes canvas | [?] |
| 8K.6 | Drag pixel size/color levels | Adjusts pixel effect | [?] |
| 8K.7 | Click style effect button (grid) | Applies style | [?] |
| 8K.8 | Click "Reset" | Removes all effects | [?] |

### 8L. HTML Template Properties
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8L.1 | Toggle visibility | Shows/hides template | [?] |
| 8L.2 | Select aspect ratio preset | Resizes template | [?] |
| 8L.3 | Drag position/rotation/scale | Transforms template | [?] |
| 8L.4 | Edit dynamic config properties | Updates template data | [?] |
| 8L.5 | Click "Remove Template" | Deletes template | [?] |

### 8M. Brand Kit Properties
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 8M.1 | Edit brand name | Updates identity | [?] |
| 8M.2 | Upload logo/watermark | Sets brand assets | [?] |
| 8M.3 | Pick primary/secondary/accent colors | Updates palette | [?] |
| 8M.4 | Select heading/body fonts | Updates typography | [?] |
| 8M.5 | Select brand voice | Updates voice settings | [?] |

---

## 9. EDITOR - TIMELINE

### Playback Controls
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 9.1 | Click Play/Pause | Toggles playback | [?] |
| 9.2 | Click Restart (SkipBack) | Seeks to in-point or frame 0 | [?] |
| 9.3 | Click Skip to End | Seeks to out-point or last frame | [?] |
| 9.4 | Click Loop toggle | Cycles loop mode | [?] |
| 9.5 | Click Undo | Reverts last action | [?] |
| 9.6 | Click Redo | Restores undone action | [?] |
| 9.7 | Click Record toggle | Starts/stops keyframe recording | [?] |
| 9.8 | Click Volume mute | Toggles audio mute | [?] |
| 9.9 | Click In-Point bracket `[` | Sets/clears in-point | [?] |
| 9.10 | Click Out-Point bracket `]` | Sets/clears out-point | [?] |
| 9.11 | Click SEC/FRM toggle | Switches time display mode | [?] |
| 9.12 | Click Beat Detection button | Analyzes audio for beats | [?] |
| 9.13 | Click Beat Markers toggle | Shows/hides beat lines | [?] |
| 9.14 | Click Beat Snap toggle | Enables/disables beat snapping | [?] |
| 9.15 | Click Add Marker (Flag) | Creates marker at playhead | [?] |

### Playhead & Ruler
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 9.16 | Drag playhead | Scrubs through timeline | [?] |
| 9.17 | Click on ruler | Seeks to clicked position | [?] |
| 9.18 | Drag on ruler | Scrubs through timeline | [?] |

### Zoom Controls
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 9.19 | Click Zoom In | Increases timeline scale | [?] |
| 9.20 | Click Zoom Out | Decreases timeline scale | [?] |

### Track Management
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 9.21 | Click track visibility toggle (eye) | Shows/hides track | [?] |
| 9.22 | Click track lock toggle | Locks/unlocks track | [?] |
| 9.23 | Click track mute toggle (audio) | Mutes/unmutes track | [?] |
| 9.24 | Drag track header to reorder | Reorders tracks | [?] |
| 9.25 | Click "Add Track" | Creates new track | [?] |
| 9.26 | Drag track bottom edge | Resizes track height | [?] |

### Clip Interactions
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 9.27 | Click clip bar | Selects clip | [?] |
| 9.28 | Drag clip left edge | Trims start (with snapping) | [?] |
| 9.29 | Drag clip right edge | Trims end (with snapping) | [?] |
| 9.30 | Drag clip center | Moves clip (with snapping) | [?] |
| 9.31 | Shift+drag clip | Moves without snapping | [?] |
| 9.32 | Drag clip across tracks | Cross-track move | [?] |
| 9.33 | Right-click clip → Delete | Removes clip | [?] |
| 9.34 | Right-click clip → Duplicate | Copies clip | [?] |
| 9.35 | Right-click clip → Split at Playhead | Splits clip in two | [?] |
| 9.36 | Right-click clip → Lock/Unlock | Toggles clip lock | [?] |
| 9.37 | Right-click clip → Sync to Beats | Opens beat sync popover | [?] |
| 9.38 | Drag transition preset onto clip | Applies transition | [?] |

### Keyframe Interactions
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 9.39 | Click keyframe diamond | Selects keyframe, seeks to frame | [?] |
| 9.40 | Shift+click keyframe | Multi-select | [?] |
| 9.41 | Right-click keyframe → Delete | Removes keyframe | [?] |
| 9.42 | Right-click keyframe → Delete All | Removes all keyframes | [?] |
| 9.43 | Right-click keyframe → Copy | Copies keyframe | [?] |
| 9.44 | Right-click keyframe → Set Easing | Changes interpolation | [?] |
| 9.45 | Click expand/collapse chevron | Shows/hides property sub-tracks | [?] |

### Dialogue Track
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 9.46 | Click dialogue line segment | Selects for editing | [?] |
| 9.47 | Click viseme bar | Shows viseme in right panel | [?] |
| 9.48 | Click emotion segment | Shows emotion in right panel | [?] |
| 9.49 | Expand dialogue sub-tracks | Shows eye/viseme/body/hair tracks | [?] |

### Media Track
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 9.50 | Click media bar | Selects, opens properties | [?] |
| 9.51 | Drag media left/right edges | Trims media timing | [?] |
| 9.52 | Drag media center | Moves media timing | [?] |

---

## 10. EDITOR - MODALS

### ModalShell (shared behavior for all modals below)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 10.1 | Click X button | Closes modal | [?] |
| 10.2 | Click backdrop | Closes modal | [?] |
| 10.3 | Press Escape | Closes modal | [?] |
| 10.4 | Tab through modal content | Focus stays trapped in modal | [?] |

### Export Modal
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 10.5 | Select export format (MP4/WebM/GIF/etc.) | Sets format | [?] |
| 10.6 | Select resolution | Sets output resolution | [?] |
| 10.7 | Select quality level | Sets encoding quality | [?] |
| 10.8 | Click "Export" / "Render" | Starts export process | [?] |
| 10.9 | View export progress bar | Shows encoding progress | [?] |
| 10.10 | Download completed export | Saves file to disk | [?] |

### Projects Modal
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 10.11 | Click project card | Loads project | [?] |
| 10.12 | Click "Create New" | Creates blank project | [?] |
| 10.13 | Click delete on project | Confirmation → delete | [?] |

### Settings Modal
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 10.14 | Toggle dark/light theme | Changes appearance | [?] |
| 10.15 | Select aspect ratio | Changes canvas size | [?] |
| 10.16 | Select default FPS | Changes framerate | [?] |
| 10.17 | Pick background color | Changes canvas background | [?] |
| 10.18 | Toggle GPU renderer | Switches render engine | [?] |
| 10.19 | Toggle reduced motion | Disables animations | [?] |
| 10.20 | Toggle auto-save | Enables/disables auto-save | [?] |
| 10.21 | Adjust auto-save interval | Changes save frequency | [?] |
| 10.22 | Edit creator profile fields | Updates profile | [?] |
| 10.23 | Click "Suggest Tags" | AI suggests niche tags | [?] |
| 10.24 | Toggle marketplace opt-in | Opts in/out | [?] |
| 10.25 | Click "Sign Out" | Signs out | [?] |

### Library/Marketplace Modal
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 10.26 | Click category tab (All/AI Animations/Templates/etc.) | Filters items | [?] |
| 10.27 | Search items | Filters by query | [?] |
| 10.28 | Click "Import" on item | Imports to project | [?] |
| 10.29 | Click "Delete" on item | Confirmation → removes | [?] |
| 10.30 | Click project item → "Open" | Opens project | [?] |

### Share Modal
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 10.31 | Select platform(s) to publish | Toggles platforms | [?] |
| 10.32 | Edit caption/metadata | Updates post content | [?] |
| 10.33 | Click "Publish" | Publishes to platforms | [?] |

### Recordings Modal
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 10.34 | Click recording to preview | Opens video player | [?] |
| 10.35 | Download recording | Saves file | [?] |
| 10.36 | Delete recording | Removes recording | [?] |

### Shortcuts Modal
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 10.37 | Open shortcuts modal | Shows all keyboard shortcuts | [?] |
| 10.38 | Close (X/backdrop/Escape) | Closes modal | [?] |

### Upgrade Modal
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 10.39 | View plan comparison cards | Shows feature comparison | [?] |
| 10.40 | Click "Upgrade" on plan | Starts Stripe checkout | [?] |
| 10.41 | Close upgrade modal | Returns to editor | [?] |

### Confirm Dialog (global)
| # | Action | Expected Result | Status |
|---|--------|----------------|--------|
| 10.42 | Click confirm (destructive) | Executes action | [?] |
| 10.43 | Click cancel | Cancels action | [?] |
| 10.44 | Press Escape | Cancels (same as cancel) | [?] |
| 10.45 | Click backdrop | Cancels | [?] |

---

## 11. KEYBOARD SHORTCUTS

| # | Shortcut | Action | Status |
|---|---------|--------|--------|
| 11.1 | Space | Play/Pause | [?] |
| 11.2 | Left Arrow | Step back 1 frame | [?] |
| 11.3 | Right Arrow | Step forward 1 frame | [?] |
| 11.4 | Shift+Left | Step back 10 frames | [?] |
| 11.5 | Shift+Right | Step forward 10 frames | [?] |
| 11.6 | Home | Go to frame 0 | [?] |
| 11.7 | End | Go to last frame | [?] |
| 11.8 | Cmd+Z | Undo | [?] |
| 11.9 | Cmd+Shift+Z | Redo | [?] |
| 11.10 | Cmd+S | Save project | [?] |
| 11.11 | Delete/Backspace | Delete selected | [?] |
| 11.12 | Escape | Clear selection | [?] |
| 11.13 | K | Toggle record mode | [?] |
| 11.14 | Cmd+K | Toggle AI Copilot | [?] |
| 11.15 | `[` | Set/clear in-point | [?] |
| 11.16 | `]` | Set/clear out-point | [?] |
| 11.17 | M | Add marker | [?] |
| 11.18 | Cmd+= | Zoom in timeline | [?] |
| 11.19 | Cmd+- | Zoom out timeline | [?] |
| 11.20 | 3 | Toggle 3D layer view | [?] |
| 11.21 | Cmd+Shift+T | Toggle motion tracking | [?] |
| 11.22 | Cmd+Shift+C | Calibrate motion tracking | [?] |
| 11.23 | Cmd+Shift+R | Start/stop recording take | [?] |

---

## 12. CANVAS OVERLAYS (19 total)

Each overlay is toggled via `toggleCanvasOverlay(name)`:

| # | Overlay | Trigger | Status |
|---|---------|---------|--------|
| 12.1 | Script Generator | Script panel action | [?] |
| 12.2 | Text Creator | Text panel action | [?] |
| 12.3 | Media Browser | Media panel action | [?] |
| 12.4 | Template Browser | Design panel action | [?] |
| 12.5 | Content Calendar | Publish panel action | [?] |
| 12.6 | AI Director | Canvas toolbar button | [?] |
| 12.7 | Animation Browser | Assets panel action | [?] |
| 12.8 | SVG Art Generator | Assets panel action | [?] |
| 12.9 | Character 3D Import | Character panel action | [?] |
| 12.10 | Template Rater | Dev mode action | [?] |
| 12.11 | Character Generator | Character panel action | [?] |
| 12.12 | Voice Generator | Audio panel action | [?] |
| 12.13 | Transition Picker | Transition panel action | [?] |
| 12.14 | Dialogue Editor | Dialogue panel action | [?] |
| 12.15 | Video Browser | Video panel action | [?] |
| 12.16 | Screen Recorder | Recording action | [?] |
| 12.17 | Caption Designer | Caption panel action | [?] |
| 12.18 | Audio Studio | Audio panel action | [?] |
| 12.19 | Background Browser | Design panel action | [?] |

---

## 13. OTHER ROUTES

| # | Route | Page | Key Actions | Status |
|---|-------|------|-------------|--------|
| 13.1 | `/billing` | Billing/Pricing page | View plans, upgrade, manage subscription | [?] |
| 13.2 | `/brand` | Brand Intel page | Brand analysis tools | [?] |
| 13.3 | `/portfolio/:username` | Public portfolio | View user's videos | [?] |
| 13.4 | `/privacy` | Privacy policy | Read-only content | [?] |
| 13.5 | `/terms` | Terms of service | Read-only content | [?] |
| 13.6 | `/rig/:rigId?` | Rig editor | Character rigging | [?] |

---

## SUMMARY

| Area | Action Count |
|------|-------------|
| Landing Page | 16 |
| Auth Flow | 17 |
| Dashboard | 40 |
| Editor Top Menu | 16 |
| Left Panel Tabs | 30 |
| Left Panel Content | ~60 |
| Canvas Interactions | 53 |
| Right Panel Properties | ~130 |
| Timeline | 52 |
| Modals | 45 |
| Keyboard Shortcuts | 23 |
| Overlays | 19 |
| Other Routes | 6 |
| **TOTAL** | **~507** |

---

## NEXT STEPS

1. **Manual testing sweep** - Go through each `[?]` item and mark as `[OK]` or `[!]`
2. **Priority issues** - Focus on critical flows first:
   - Auth (sign in/up/out)
   - Project save/load
   - Export pipeline
   - Character creation → lip sync → export
3. **Dead buttons** - Identify buttons that do nothing or lead nowhere
4. **Error states** - Test what happens when operations fail
5. **Edge cases** - Empty states, max limits, concurrent operations
