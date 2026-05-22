# Video Motion Tracking to Character Rig: Research Report

*Generated: 2026-03-21 | Sources: 200+ | Agents: 9 parallel research threads | Tools cataloged: 200+*

## Executive Summary

Extracting body motion from online videos and applying it to 2D/3D character rigs is a well-established pipeline with multiple commercial and open-source solutions at every stage. The pipeline has four stages: **Video Sourcing** → **Pose Estimation** → **Motion Retargeting** → **Rig Application**.

**Key findings:**
- **DeepMotion** and **Move.ai** offer the best cloud APIs for video-to-3D-motion (REST/GraphQL, BVH/FBX/GLB output)
- **MediaPipe** (`@mediapipe/tasks-vision`) is the clear winner for browser-based pose estimation (face + body + hands, 30-60 FPS)
- **KalidoKit** (deprecated but no replacement) + **three-vrm** is the proven browser pipeline for landmarks → character animation
- **retargeting-threejs** (UPF-GTI) is the best Three.js retargeting library
- For video sourcing, **user upload is the safest legal path**; `yt-dlp` via `ytdlp-nodejs` is the most capable but carries legal risk
- No major cloud provider (AWS, Azure, Google Cloud) offers meaningful body motion capture APIs
- Building in-house is viable using MediaPipe (browser) + GVHMR/WHAM (server) + custom retargeting

---

## Table of Contents

1. [The Full Pipeline](#1-the-full-pipeline)
2. [Commercial MoCap APIs](#2-commercial-mocap-apis)
3. [Open-Source Pose Estimation](#3-open-source-pose-estimation)
4. [Browser-Based Solutions](#4-browser-based-solutions)
5. [Motion Retargeting](#5-motion-retargeting)
6. [Video Sourcing](#6-video-sourcing)
7. [Recommended Architecture for ProAnimate](#7-recommended-architecture-for-proanimate)
8. [Sources](#8-sources)

---

## 1. The Full Pipeline

```
┌─────────────┐    ┌──────────────────┐    ┌───────────────┐    ┌──────────────┐
│ Video Source │───▶│ Pose Estimation  │───▶│  Retargeting  │───▶│ Rig Animation│
│             │    │                  │    │               │    │              │
│ - Upload    │    │ - MediaPipe (JS) │    │ - KalidoKit   │    │ - 3D: VRM/   │
│ - URL fetch │    │ - DeepMotion API │    │ - retargeting │    │   Three.js   │
│ - Webcam    │    │ - Move.ai API    │    │   -threejs    │    │ - 2D: Bone   │
│             │    │ - GVHMR (server) │    │ - Custom IK   │    │   rigging    │
└─────────────┘    └──────────────────┘    └───────────────┘    └──────────────┘

Data flow:  Video frames → 2D/3D keypoints → Joint rotations → Bone transforms
Formats:    MP4/WebM     → JSON landmarks  → BVH/Euler/Quat → AnimationClip
```

### Two Architectural Approaches

| Approach | Where Pose Runs | Quality | Latency | Cost |
|----------|----------------|---------|---------|------|
| **Browser-side** | Client (MediaPipe WASM) | Good (33 landmarks, pseudo-3D) | Real-time (30-60 FPS) | Free |
| **Server-side API** | Cloud (DeepMotion/Move.ai) | Excellent (full 3D skeleton, BVH) | Minutes (async processing) | $0.50–$5/min |
| **Server-side OSS** | Your GPU server (GVHMR/WHAM) | Excellent (SMPL 3D, world-grounded) | Seconds–minutes | GPU compute only |

---

## 2. Commercial MoCap APIs

### Tier 1: Best for Integration

#### DeepMotion Animate 3D — BEST API DOCUMENTATION

- **What:** Video → 3D skeletal animation. Body + hands + face (39 ARKit blendshapes). Multi-person (up to 8).
- **API:** REST API. [Well-documented on GitHub](https://github.com/DeepMotion/Animate-3D-REST-API). Python SDK (`pip install dm-animate3d-api`).
- **Workflow:** `GET /session/auth` → `GET /upload` (signed URL) → `POST /process` → `GET /status/{rid}` → `GET /download/{rid}`
- **Output:** BVH, FBX, GLB, MP4
- **CORS:** Supports localhost by default; production origins configurable
- **Pricing:**

| Tier | Cost/mo | Credits/mo (~seconds) | Max Clip | Multi-Person |
|------|---------|----------------------|----------|-------------|
| Free | $0 | 60 (1 min) | 20s | 2 people |
| Starter | $15 | 180 (3 min) | 20s | 3 people |
| Innovator | $48 | 480 (8 min) | 30s | 4 people |
| Professional | $117 | 1,500 (25 min) | 120s | 6 people |
| Studio | Custom | Unlimited | — | — |

- **Cost:** 1 credit = 1 second. Face/hand each add +0.5 credits/sec.
- **Quality:** Good for clear video. Struggles with occlusion, motion blur.
- **Integration complexity:** MODERATE. Clean REST, async polling fits web apps well.

#### Move.ai — HIGHEST QUALITY

- **What:** AI + physics + biomechanics → highest fidelity markerless mocap. Single/multi-cam. Gloveless finger tracking ("Dex"). Gen 2 models (March 2025).
- **API:** GraphQL at `https://api.move.ai/ugc/graphql`. Python SDK (`move_ugc`), Swift SDK.
- **Output:** FBX, BVH, USDC, USDZ, GLB, Blend, C3D, JSON, CSV — widest format support
- **Models:** s1 (Gen 1), s2 (Gen 2, higher quality), m1/m2 (multi-cam), rt1/rt2 (real-time)
- **Pricing:**

| Tier | Cost/mo | Credits/mo | ~Video Seconds |
|------|---------|-----------|---------------|
| Free | $0 | 0 | Explore only |
| Personal | $15 | 2,250 | ~375s |
| Standard | $50 | 7,500 | ~1,250s |
| Advanced | $250 | 37,500 | ~6,250s |

- **Credit costs:** s1 = 6 credits/sec, s2 = 12 credits/sec
- **Quality:** Highest among cloud solutions. Physics + biomechanics post-processing.
- **Integration complexity:** MODERATE-HIGH. GraphQL adds complexity. Needs server-side proxy (no browser CORS).

### Tier 2: Viable Alternatives

#### Plask — BROWSER-NATIVE EDITOR

- **What:** AI mocap from video + browser-based animation editor with retargeting
- **API:** Enterprise-only REST API. SDK access on Pro tier.
- **Output:** GLB, FBX, BVH
- **Pricing:** Free (15s/day), Standard $18/mo, Pro $50/mo, Enterprise custom
- **Quality:** Good for blocking/previs. Lower fidelity than Move.ai/DeepMotion for production.
- **Used by:** Square Enix, Nexon, Activision

#### RADiCAL Motion — REAL-TIME + BATCH

- **What:** AI mocap from consumer camera. Core API for enterprise.
- **API:** Enterprise REST API (contact sales)
- **Output:** JSON (3D coordinates + rotations), FBX
- **Pricing:** Free, Pro $15/mo, Creator ~$45/mo, Core API enterprise
- **Extras:** Live streaming plugins for Unreal, Unity, Maya, Blender

#### Kinetix — GAMING-FOCUSED

- **What:** Video-to-animation for gaming "emotes". REST API + Unity/Unreal SDK.
- **Output:** FBX, GLB
- **Pricing:** 10,000 free emotes, then EUR 0.10–0.15/emote
- **Deployed in:** OVERDARE (KRAFTON), Unity Muse

#### Rokoko Vision — FREE BROWSER MOCAP

- **What:** Browser-based AI mocap from webcam/video
- **Output:** FBX, BVH, CSV
- **Pricing:** Free (15s), Plus $20/mo, Pro $50/mo
- **Limitation:** No cloud REST API. Command API controls desktop app only. NOT viable for automated pipeline.

### Tier 3: Not Viable for Integration

| Service | Why Not |
|---------|---------|
| **Autodesk Flow Studio** (Wonder Studio) | No public API. Standalone VFX web app only. |
| **Meshcapade** | Acquired by Epic Games. Shutting down standalone service ~April 2026. |
| **Cascadeur** | Desktop only, no API. |
| **Movella/Xsens** | Hardware sensors only, not video-based. MotionCloud being discontinued. |
| **AWS Rekognition** | Face pose only (pitch/roll/yaw). No body skeleton. |
| **Azure AI Vision** | Face pose only. No body motion capture. |
| **Google Video Intelligence** | Basic person detection landmarks, not skeleton tracking. |

### Commercial API Comparison

| Service | Body | Hands | Face | API Type | Output | Entry Price | Quality |
|---------|------|-------|------|----------|--------|-------------|---------|
| **DeepMotion** | Yes | Yes | Yes (ARKit) | REST | BVH, FBX, GLB | Free (60s/mo) | Good |
| **Move.ai** | Yes | Yes (Dex) | No | GraphQL | BVH, FBX, GLB, JSON + 7 more | Free | Highest |
| **Plask** | Yes | Yes | No | Enterprise REST | GLB, FBX, BVH | Free (15s/day) | Medium |
| **RADiCAL** | Yes | — | — | Enterprise | JSON, FBX | Free | Medium |
| **Kinetix** | Yes | — | No | REST + SDK | FBX, GLB | Free (10k emotes) | Medium |
| **Rokoko** | Yes | No | Separate | Command API only | FBX, BVH | Free (15s) | Medium |

---

## 3. Open-Source Pose Estimation

### 3A. 2D Pose Estimation

#### Browser-Ready (Production)

| Library | Keypoints | FPS (browser) | License | Package |
|---------|-----------|--------------|---------|---------|
| **MediaPipe PoseLandmarker** | 33 body (2D + pseudo-3D) | 30-60 (GPU) | Apache-2.0 | `@mediapipe/tasks-vision` |
| **MediaPipe HolisticLandmarker** | 33 body + 468 face + 42 hands | 20-40 | Apache-2.0 | `@mediapipe/tasks-vision` |
| **MoveNet Lightning** | 17 COCO | 50+ | Apache-2.0 | `@tensorflow-models/pose-detection` |
| **MoveNet Thunder** | 17 COCO | 30+ | Apache-2.0 | `@tensorflow-models/pose-detection` |
| **BlazePose** | 33 (3D via GHUM) | 25-35 | Apache-2.0 | `@mediapipe/tasks-vision` |

#### Server-Side (Python, GPU)

| Library | Stars | COCO AP | Speed | License | Browser via ONNX? |
|---------|-------|---------|-------|---------|-------------------|
| **RTMPose-m** (MMPose) | 7.4k | 75.8% | 90+ FPS CPU, 430+ GPU | Apache-2.0 | Possible (untested) |
| **ViTPose++** | 2k | 81.1% | GPU only | Apache-2.0 | Emerging (Transformers.js) |
| **YOLO26-Pose** | 54.8k | 57-72% | 1.8-12ms T4 | AGPL-3.0 | Proven (ONNX RT Web) |
| **AlphaPose** | 8.5k | 73.3% | GPU only | Non-commercial | No |
| **HRNet** | 4.5k | 76.3% | Moderate | MIT | No |
| **OpenPose** | 33.9k | ~61-65% | GPU only | Non-commercial ($25k/yr) | No |

**Note:** `@mediapipe/holistic`, `@mediapipe/pose`, `@mediapipe/face_mesh`, `@mediapipe/hands` are ALL DEPRECATED. Use `@mediapipe/tasks-vision` only.

### 3B. 3D Pose Estimation / Monocular MoCap (Server-Side Python)

| Library | Stars | Output | World-Grounded | License | Key Paper |
|---------|-------|--------|---------------|---------|-----------|
| **GVHMR** | 1.5k | SMPL (world-space) | Yes (gravity-view) | TBD | SIGGRAPH Asia 2024 |
| **WHAM** | 1k | SMPL (world-space) | Yes (SLAM-based) | MIT | — |
| **TRAM** | 597 | SMPL + trajectory | Yes | MIT | ECCV 2024 |
| **HMR 2.0 / 4DHumans** | 1.6k | SMPL mesh + joints | No (camera-relative) | MIT | — |
| **MotionBERT** | 1.4k | 3D joints + SMPL | No | Apache-2.0 | ICCV 2023 |
| **EasyMoCap** | — | SMPL/SMPL-X | Partial | Research | Zhejiang Univ |
| **SMPLer-X / SMPLest-X** | — | SMPL-X (body+hands+face) | No | Open | TPAMI 2025 |

**MoCapAnything** (Dec 2025) — Takes monocular video + any rigged 3D asset → BVH for arbitrary skeletons. Works across species. Code availability TBD.

#### SMPL Pipeline: Video → BVH

```
Video → 2D pose (ViTPose/RTMPose) → 3D pose (GVHMR/WHAM) → SMPL params → smpl2bvh → BVH
```

- `smpl2bvh`: [github.com/KosukeFukazawa/smpl2bvh](https://github.com/KosukeFukazawa/smpl2bvh) — converts SMPL parameters to standard BVH
- SMPL uses 24 joints, 72 pose params (24 joints × 3 axis-angle) + 10 shape params
- Commercial SMPL licensing: Max Planck Innovation (non-commercial free, commercial requires license)

---

## 4. Browser-Based Solutions

### 4A. MediaPipe Tasks-Vision (PRIMARY RECOMMENDATION)

**Package:** `@mediapipe/tasks-vision` v0.10.32 (Feb 2026)

**Task classes:**
- `PoseLandmarker` — 33 body landmarks (image + 3D world coords in meters)
- `FaceLandmarker` — 468 face landmarks + 52 ARKit-compatible blendshapes
- `HandLandmarker` — 21 landmarks per hand
- `HolisticLandmarker` — All combined (543 landmarks/frame). Web JS guide not yet published by Google but the class IS exported and functional.

**Processing uploaded video:**
```
1. Create <video>, set src to blob URL from uploaded file
2. Set runningMode: "VIDEO"
3. Use requestVideoFrameCallback() or seek frame-by-frame
4. Call detectForVideo(video, timestampMs) per frame
```

**Performance:**
- CPU-only WASM: 10-15 FPS
- GPU delegate (WebGL): 30-60+ FPS
- 720p @ 30 FPS is the recommended sweet spot
- WebGPU NOT supported for vision tasks (WebGL only)

**Memory warning:** Reports of 30 GB for 1 minute of 1080p@30fps. Process in chunks (cap ~30s segments), release references between frames, use Web Worker.

### 4B. TensorFlow.js Pose Detection

**Package:** `@tensorflow-models/pose-detection`

| Model | Keypoints | FPS | Backend |
|-------|-----------|-----|---------|
| MoveNet Lightning | 17 | 50+ | WebGL, WebGPU, WASM |
| MoveNet Thunder | 17 | 30+ | WebGL, WebGPU, WASM |
| BlazePose | 33 (3D) | 25-35 | WebGL, WebGPU, WASM |

TF.js supports **WebGPU** (3x faster than WebGL). However, TF.js does NOT provide face blendshapes — for that you need MediaPipe directly.

### 4C. KalidoKit (Landmark → Rotation Solver)

**Package:** `kalidokit` v1.1.5 — **DEPRECATED** but no replacement exists yet (~350 lines core)

Converts MediaPipe landmarks to character-ready data:
- `Face.solve(landmarks)` → head euler rotations, eye blinks, mouth shapes (A/E/I/O/U), brow, pupils
- `Pose.solve(world3D, landmarks)` → arm/leg/spine rotations + hip position
- `Hand.solve(landmarks, side)` → wrist + finger joint rotations

All outputs are euler radians, directly applicable to Three.js/VRM bones.

**Known limitations:** Leg calculations are WIP. No maintenance. Recommend forking/vendoring.

### 4D. three-vrm (VRM Avatar Rendering)

**Package:** `@pixiv/three-vrm` v3.5.1 (March 2026) — actively maintained

- VRM 0.0 + VRM 1.0 support
- `VRMHumanoid.setRawPose(pose)` / `setNormalizedPose(pose)` for bone transforms
- Expression/blendshape system for facial animation
- Spring bone physics (hair, clothing)
- WebGPU supported (Three.js r167+)
- Sub-packages: `@pixiv/three-vrm-animation`, `@pixiv/three-vrm-springbone`, `@pixiv/three-vrm-materials-mtoon`

### 4E. The Proven VTuber Pipeline

```
MediaPipe (@mediapipe/tasks-vision)
  → raw landmarks (face 468 + pose 33 + hands 21)
  → KalidoKit (kalidokit)
    → euler rotations + blendshape values
    → Three.js / @pixiv/three-vrm
      → animated character
```

**Reference implementations:**
- [Wawa Sensei VTuber Tutorial](https://wawasensei.dev/tuto/vrm-avatar-with-threejs-react-three-fiber-and-mediapipe) — React Three Fiber + MediaPipe + KalidoKit + three-vrm
- [VRM Studio](https://github.com/vucinatim/vrm-studio) — Next.js + R3F + MediaPipe + Zustand + Web Worker
- [VRM-Motion-Capture-with-MediaPipe](https://github.com/makoto357/VRM-Motion-Capture-with-MediaPipe) — Live at vrm-mocap.vercel.app
- [SysMocap](https://github.com/xianfei/SysMocap) — Electron + MediaPipe + KalidoKit + Three.js
- [Kalidoface 3D](https://3d.kalidoface.com/) — Live demo
- [Thirdrez MoCap Studio](https://thirdrez.com/mocap) — Free browser tool, exports BVH/FBX/GLB

### 4F. Other Relevant npm Packages

| Package | What It Does |
|---------|-------------|
| `@vladmandic/human` | AI body/face/hand tracking (MoveNet, BlazePose, EfficientPose) |
| `pixi-live2d-display` | Live2D model rendering in PixiJS (for 2D characters) |
| `onnxruntime-web` | Run ONNX models in browser (WebGPU, WebGL, WASM) |
| `mind-ar` | Web AR with face tracking (MediaPipe-based) |
| `@davidcks/r3f-vrm` | React Three Fiber VRM integration |

---

## 5. Motion Retargeting

### 5A. Core Concept

Retargeting transfers animation from source skeleton to target skeleton with different proportions. Direct rotation copying breaks because bone lengths differ. Solution: extract animation as "difference from rest pose" in world space, apply that difference to target's rest pose.

**World-space formula (per keyframe):**
```
LocalMatrix = InverseBindMatrix × WorldMatrix(SourceAnimated) × TargetMatrix × InverseParentMatrix
```

### 5B. 3D Retargeting (Three.js)

#### retargeting-threejs (UPF-GTI) — RECOMMENDED

- Purpose-built for Three.js humanoid characters
- `new AnimationRetargeting(srcSkeleton, trgSkeleton, options)` with `.retargetPose()` and `.retargetAnimation(clip)`
- Automatic and manual bone mapping via `boneNameMap`
- T-pose enforcement via `applyTPose()`
- Apache 2.0 license
- [github.com/upf-gti/retargeting-threejs](https://github.com/upf-gti/retargeting-threejs)

#### Three.js SkeletonUtils (Built-in)

- `retarget(target, source, options)` / `retargetClip(target, source, clip, options)`
- Options: `names` (bone mapping), `hip`, `hipInfluence`, `scale`, `preserveBonePositions`
- Known issues with Mixamo rigs (inverted feet/hands). Less reliable than retargeting-threejs.

#### vrm-mixamo-retarget

- Retargets Mixamo FBX animations to VRM avatars
- Includes full `mixamoVRMRigMap` covering body + fingers
- MIT license, `npm install vrm-mixamo-retarget`
- [github.com/saori-eth/vrm-mixamo-retargeter](https://github.com/saori-eth/vrm-mixamo-retargeter)

#### IK Solvers (for foot contact correction)

| Solver | Type | Package |
|--------|------|---------|
| **IK-threejs** (UPF-GTI) | CCD + FABRIK + hybrid, ball-socket + hinge constraints | [github.com/upf-gti/IK-threejs](https://github.com/upf-gti/IK-threejs) v2.0.0 (Dec 2025) |
| **THREE.IK** | FABRIK | `three-ik` npm |
| **CCDIKSolver** (Three.js) | CCD, works with SkinnedMesh | Built-in |

### 5C. 2D Retargeting

#### Pose Animator (Google) — SVG Characters from Webcam

- PoseNet (17 body) + FaceMesh (73 facial) = 90 keypoints, 78 bones
- SVG characters with embedded skeleton
- Linear Blend Skinning adapted for 2D Bezier curves
- Runs in browser (Chrome, iOS Safari)
- [github.com/yemount/pose-animator](https://github.com/yemount/pose-animator)

#### Live2D + KalidoKit Pipeline

```
MediaPipe FaceMesh → KalidoKit Face.solve() → pixi-live2d-display → Live2D model
```

- `pixi-live2d-display` renders Live2D Cubism models in PixiJS
- [Kalidoface Live2D demo](https://2d.kalidoface.com/)

#### Custom 2D Bone Rig (ProAnimate's approach)

Map MediaPipe body keypoints to 2D bone positions:
1. Extract shoulder/elbow/wrist/hip/knee/ankle positions from landmarks
2. Compute 2D angles via `atan2(dy, dx)` for each bone pair
3. Apply as bone rotations to ProAnimate's existing `vendor/bonerigging/` system
4. Smooth with low-pass filter for jitter reduction

### 5D. Data Format Pipeline

```
MediaPipe 33 landmarks (positions) → Kinematic solver → Euler/Quaternion rotations → Skeleton bones
```

**Key conversion:** MediaPipe outputs **positions**, not rotations. Converting requires computing vectors between connected joints, deriving rotation quaternions, and transforming from MediaPipe's coordinate system to Three.js.

**mediapipe-pose2bvh:** Browser-based tool converting MediaPipe Holistic output to BVH. GPL-3.0. [github.com/tejaswigowda/mediapipe-pose2bvh](https://github.com/tejaswigowda/mediapipe-pose2bvh)

**Format comparison:**

| Format | Type | Strengths | Weaknesses |
|--------|------|-----------|------------|
| **BVH** | Text, skeleton + rotations | Universal, simple, human-readable | No mesh, no blendshapes |
| **FBX** | Binary, full scene | Industry standard, Mixamo native | Proprietary, complex in JS |
| **glTF/GLB** | JSON/binary | Web-native, Three.js native | No standard humanoid mapping |
| **VRM** | glTF extension | Standardized humanoid bones + expressions | Humanoid only |

### 5E. AI-Based Retargeting (Research, 2024-2026)

| Method | Conference | Key Innovation |
|--------|-----------|---------------|
| **Skeleton-Aware Networks** | SIGGRAPH 2020 | Skeletal pooling to shared latent space |
| **MoMa** | CVIU 2024 | Cross-topology (non-homeomorphic), transformer-based |
| **STaR** | ICCV 2025 | Penetration correction + temporal consistency |
| **ReConForM** | CGF 2025 | Contact-preserving across diverse morphologies |
| **GMR** | ICRA 2026 | Real-time retargeting to robots on CPU |

---

## 6. Video Sourcing

### 6A. Tools and Libraries

#### yt-dlp (The Standard, 1800+ sites)

| Node.js Wrapper | npm | Key Traits |
|-----------------|-----|-----------|
| **ytdlp-nodejs** | `ytdlp-nodejs` | Full TypeScript, fluent API, auto binary management, streaming |
| **yt-dlp-wrap** | `yt-dlp-wrap` | EventEmitter, streaming. BYO binary. |
| **yt-dlp-exec** | `yt-dlp-exec` | Simplest, auto-installs binary. Requires Python 3.9+. |

**Critical:** Since yt-dlp 2025.11.12, an external JS runtime (Deno, Node.js 20+, Bun) is required for YouTube support due to proof-of-origin tokens.

#### Cobalt (cobalt.tools) — Open Source Downloader

- AGPL-3.0, self-hostable via Docker
- Single `POST /` endpoint: `{ "url": "...", "videoQuality": "1080" }` → download stream
- Supports TikTok, Instagram, Twitter/X, Reddit, Vimeo, SoundCloud, 15+ others
- **YouTube currently broken** on public instance (Google enforcement). Self-hosted may work.
- [github.com/imputnet/cobalt](https://github.com/imputnet/cobalt)

#### RapidAPI / video-download-api.com

- Third-party REST APIs for social media video download
- Pricing: $0.0002–$0.0005 per download
- Easiest integration (HTTP calls, no binary) but third-party dependency

### 6B. Official Platform APIs

| Platform | Can You Download Others' Videos? | What You Get |
|----------|--------------------------------|-------------|
| **YouTube Data API v3** | NO. Metadata only. | Titles, stats, captions. Downloading violates ToS. |
| **TikTok API** | NO. | Analytics, ads, research. No download endpoint. |
| **Instagram Graph API** | Partially (your own content only) | `video_url` for content you own/manage |
| **Twitter/X API v2** | NO. | Media keys, no streaming URLs |
| **Facebook Graph API** | Limited (pages you admin) | `source` field for your page videos |

**No major platform provides an official API for downloading other users' video content.**

### 6C. Legal Considerations

- **All platforms prohibit** automated downloading of others' content in ToS
- **DMCA §1201** (anti-circumvention) is the primary legal risk. Statutory damages $200–$2,500 per act.
- **Active litigation:** TED/MrShortGame v. Snap (2026, using yt-dlp for AI training), Yout v. RIAA (5 years ongoing)
- **Fair use argument for motion extraction:** Highly transformative (video → keypoints), different nature of output, no market substitution. But fair use is an affirmative defense, not permission.

### 6D. Safest Legal Path: User Upload

User uploads the video themselves. This completely sidesteps all downloading, ToS, and DMCA concerns. This is how **Plask, Rokoko Vision, DeepMotion, and Krikey** all work.

### 6E. Video Processing Pipeline

```
Video (MP4/WebM/MOV) → ffmpeg (extract frames @ 15-30 FPS) → Pose estimation → JSON keypoints
```

- **720p minimum** for reliable joint detection; **1080p sweet spot**
- Modern pose models internally resize to 256×256 or 512×512
- `fluent-ffmpeg` for Node.js, `ffmpeg.wasm` for browser (3-10x slower, entire video in memory)
- `ffmpeg.wasm` requires SharedArrayBuffer (HTTPS + COOP/COEP headers)

---

## 7. Recommended Architecture for ProAnimate

### Phase 1: Browser-Side MoCap (Ship First)

**User uploads video or uses webcam → browser processes → drives character in real-time**

```
package.json:
  @mediapipe/tasks-vision    (v0.10.x)
  @pixiv/three-vrm           (v3.5.x)
  kalidokit                  (v1.1.5, fork recommended)
```

**Pipeline:**
1. User uploads video or enables webcam
2. `PoseLandmarker` + `FaceLandmarker` + `HandLandmarker` extract landmarks in Web Worker
3. KalidoKit (forked) converts landmarks → euler rotations + blendshapes
4. **3D characters:** Apply rotations to VRM humanoid bones via `three-vrm`
5. **2D characters:** Project 3D pose to 2D, compute bone angles via `atan2`, apply to `vendor/bonerigging/`
6. Export as animation clip (VRM animation / BVH via `mediapipe-pose2bvh`)

**Pros:** Free, no server cost, real-time, privacy-first (all local)
**Cons:** Pseudo-3D only (no true depth), memory issues for long videos, no hands/face on 2D

### Phase 2: Cloud API for High-Quality (Premium Feature)

**User uploads video → server sends to DeepMotion/Move.ai → receives BVH/GLB → retargets to character**

```
Server-side:
  DeepMotion REST API or Move.ai GraphQL API

Client-side:
  retargeting-threejs        (UPF-GTI, for 3D)
  IK-threejs                 (UPF-GTI, for foot contact)
```

**Pipeline:**
1. User uploads video in editor
2. Express backend proxies video to DeepMotion API
3. Polls for completion, downloads BVH/GLB result
4. Client loads BVH/GLB, uses `retargeting-threejs` to map onto user's character rig
5. `IK-threejs` corrects foot sliding

**Pros:** True 3D, professional quality, face + hands + body
**Cons:** API cost (~$0.50–$5/min), processing latency (minutes), requires server

### Phase 3: In-House Server Pipeline (Scale)

**Your GPU server runs GVHMR/WHAM for highest quality without per-second API costs**

```
Server (Python + GPU):
  GVHMR or WHAM             (MIT license, world-grounded SMPL)
  RTMPose or ViTPose         (2D detection frontend)
  smpl2bvh                   (SMPL → BVH conversion)

Client:
  Same as Phase 2
```

**Pipeline:**
1. User uploads video
2. Server runs RTMPose (2D detection) → GVHMR (3D SMPL estimation) → smpl2bvh (BVH export)
3. Returns BVH to client
4. Client retargets to character using `retargeting-threejs`

**Pros:** No per-minute API cost, highest quality, full control
**Cons:** GPU server cost, Python infrastructure, SMPL commercial licensing needed

### Phase 4: URL Import (Optional, Higher Risk)

**User pastes video URL → server downloads via yt-dlp → processes → discards video**

```
Server:
  ytdlp-nodejs              (TypeScript, managed binary)
  fluent-ffmpeg              (frame extraction)
```

- Add behind explicit user acknowledgment dialog
- Never store the video permanently
- Extract motion data only, delete source video
- Consider self-hosted Cobalt for non-YouTube platforms

### Summary: What to Build When

| Phase | Effort | Cost Model | Quality | Legal Risk |
|-------|--------|-----------|---------|-----------|
| **Phase 1: Browser MediaPipe** | 2-3 weeks | Free | Good (pseudo-3D) | None |
| **Phase 2: Cloud API** | 1-2 weeks | Per-minute API | Excellent | None |
| **Phase 3: In-House GPU** | 4-6 weeks | GPU compute | Excellent | SMPL license |
| **Phase 4: URL Import** | 1 week | Minimal | N/A (sourcing only) | Moderate |

### Key npm Dependencies

```json
{
  "@mediapipe/tasks-vision": "^0.10.32",
  "@pixiv/three-vrm": "^3.5.1",
  "@pixiv/three-vrm-animation": "^3.5.1",
  "kalidokit": "^1.1.5",
  "three": "existing"
}
```

For server-side (Phase 2+):
```json
{
  "ytdlp-nodejs": "^3.4.0",
  "fluent-ffmpeg": "^2.1.3"
}
```

---

## 8. Sources

### Commercial APIs
- [DeepMotion Animate 3D](https://www.deepmotion.com/animate-3d) | [REST API (GitHub)](https://github.com/DeepMotion/Animate-3D-REST-API) | [Pricing](https://www.deepmotion.com/pricing)
- [Move.ai](https://www.move.ai/developers) | [API Docs](https://developers.move.ai/docs/intro/) | [Pricing](https://docs.move.ai/knowledge/move-ai-pricing-plans-credits)
- [Plask Motion](https://plask.ai/en-US) | [Pricing](https://plask.ai/en-US/pricing)
- [RADiCAL Motion](https://radicalmotion.com/) | [Core API](https://radicalmotion.com/api-product/) | [Pricing](https://radicalmotion.com/pricing)
- [Rokoko Vision](https://www.rokoko.com/products/vision) | [Pricing](https://www.rokoko.com/pricing)
- [Kinetix](https://kinetix.tech/) | [API Docs](https://docs.kinetix.tech/integration/kinetix-api) | [Pricing](https://www.kinetix.tech/pricing)
- [Autodesk Flow Studio](https://www.autodesk.com/products/flow-studio/overview) | [Pricing](https://wonderdynamics.com/pricing/)
- [Meshcapade](https://meshcapade.com/) | [Epic Games Acquisition](https://80.lv/articles/ai-motion-capture-startup-meshcapade-now-part-of-epic-games)
- [QuickMagic](https://www.quickmagic.ai/)

### Open-Source Libraries
- [MediaPipe](https://github.com/google-ai-edge/mediapipe) | [Pose Web JS Guide](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js) | [Tasks-Vision API](https://ai.google.dev/edge/api/mediapipe/js/tasks-vision)
- [MMPose / RTMPose](https://github.com/open-mmlab/mmpose) | [RTMPose Paper](https://arxiv.org/abs/2303.07399)
- [ViTPose](https://github.com/ViTAE-Transformer/ViTPose) | [ONNX on HuggingFace](https://huggingface.co/onnx-community/vitpose-base-simple)
- [GVHMR](https://github.com/zju3dv/GVHMR) | [WHAM](https://github.com/yohanshin/WHAM) | [TRAM](https://github.com/yufu-wang/tram)
- [HMR 2.0 / 4DHumans](https://github.com/shubham-goel/4D-Humans) | [MotionBERT](https://github.com/Walter0807/MotionBERT)
- [SMPLer-X](https://github.com/SMPLCap/SMPLer-X) | [SMPLest-X](https://github.com/SMPLCap/SMPLest-X) | [PromptHMR](https://github.com/yufu-wang/PromptHMR)
- [EasyMoCap](https://github.com/zju3dv/EasyMocap) | [FreeMoCap](https://github.com/freemocap/freemocap)
- [smpl2bvh](https://github.com/KosukeFukazawa/smpl2bvh) | [SMPL-X](https://smpl-x.is.tue.mpg.de/)
- [MoCapAnything](https://animotionlab.github.io/MoCapAnything/)
- [OpenPose](https://github.com/CMU-Perceptual-Computing-Lab/openpose) | [AlphaPose](https://github.com/MVIG-SJTU/AlphaPose) | [HRNet](https://github.com/leoxiaobin/deep-high-resolution-net.pytorch)
- [Ultralytics YOLO](https://github.com/ultralytics/ultralytics)
- [TensorFlow.js Pose Detection](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection)

### Browser / Retargeting Libraries
- [KalidoKit](https://github.com/yeemachine/kalidokit) | [three-vrm](https://github.com/pixiv/three-vrm)
- [retargeting-threejs](https://github.com/upf-gti/retargeting-threejs) | [IK-threejs](https://github.com/upf-gti/IK-threejs)
- [vrm-mixamo-retargeter](https://github.com/saori-eth/vrm-mixamo-retargeter) | [human-three-vrm](https://github.com/vladmandic/human-three-vrm)
- [Pose Animator](https://github.com/yemount/pose-animator) | [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)
- [mediapipe-pose2bvh](https://github.com/tejaswigowda/mediapipe-pose2bvh)
- [Three.js CCDIKSolver](https://threejs.org/docs/#examples/en/animations/CCDIKSolver) | [THREE.IK](https://github.com/jsantell/THREE.IK)
- [SkeletonUtils](https://threejs.org/docs/pages/module-SkeletonUtils.html) | [Wicked Engine Retargeting](https://wickedengine.net/2022/09/animation-retargeting/)

### Video Sourcing
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) | [ytdlp-nodejs](https://github.com/iqbal-rashed/ytdlp-nodejs) | [yt-dlp-exec](https://github.com/Marinos33/yt-dlp-exec)
- [Cobalt](https://github.com/imputnet/cobalt) | [API docs](https://github.com/imputnet/cobalt/blob/main/docs/api.md)
- [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) | [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)

### Tutorials & Demos
- [Wawa Sensei VTuber Tutorial](https://wawasensei.dev/tuto/vrm-avatar-with-threejs-react-three-fiber-and-mediapipe)
- [VRM Studio](https://github.com/vucinatim/vrm-studio) | [VRM MoCap](https://github.com/makoto357/VRM-Motion-Capture-with-MediaPipe)
- [Kalidoface 3D](https://3d.kalidoface.com/) | [Kalidoface Live2D](https://2d.kalidoface.com/)
- [Thirdrez MoCap Studio](https://thirdrez.com/mocap)
- [SysMocap](https://github.com/xianfei/SysMocap)
- [MediaPipe Pose CodePen](https://codepen.io/mediapipe-preview/pen/abRLMxN)

### Research Papers
- [Skeleton-Aware Networks (SIGGRAPH 2020)](https://deepmotionediting.github.io/retargeting) | [arXiv 2005.05732](https://arxiv.org/abs/2005.05732)
- [MoMa (CVIU 2024)](https://github.com/mmlab-cv/MoMa) | [STaR (ICCV 2025)](https://github.com/XiaohangYang829/STaR)
- [ReConForM (CGF 2025)](https://onlinelibrary.wiley.com/doi/10.1111/cgf.70028)
- [2D Motion Retargeting (SIGGRAPH 2019)](https://motionretargeting2d.github.io/)
- [Footskate Reduction (WACV 2020)](https://openaccess.thecvf.com/content_WACV_2020/papers/Zou_Reducing_Footskate_in_Human_Motion_Reconstruction_with_Ground_Contact_Constraints_WACV_2020_paper.pdf)
- [UnderPressure (CGF 2022)](https://onlinelibrary.wiley.com/doi/abs/10.1111/cgf.14635)

### Legal
- [EFF on youtube-dl takedown](https://www.eff.org/deeplinks/2020/11/riaa-abuses-dmca-take-down-popular-tool-downloading-online-video)
- [Fair Use FAQ (U.S. Copyright Office)](https://www.copyright.gov/help/faq/faq-fairuse.html)
- [Snap AI scraping lawsuit (2026)](https://www.aicerts.ai/news/ai-content-scraping-lawsuit-youtubers-sue-snap/)

---

## 9. Full Tool Catalog (200+ Tools)

### 9A. AI Video-to-MoCap Cloud Services (22)

| # | Name | URL | API | Output | Pricing | Notes |
|---|------|-----|-----|--------|---------|-------|
| 1 | DeepMotion Animate 3D | [deepmotion.com](https://www.deepmotion.com/animate-3d) | REST API ([GitHub](https://github.com/DeepMotion/Animate-3D-REST-API)) | FBX, BVH, GLB, MP4 | Free 60s/mo, from $15/mo | Body+hands+face, multi-person |
| 2 | Move.ai | [move.ai](https://www.move.ai/developers) | GraphQL API, Python/Swift SDK | FBX, BVH, USDC, USDZ, GLB, JSON, CSV, Blend, C3D | Free, from $15/mo | Highest quality, Gen 2 models |
| 3 | Plask AI | [plask.ai](https://plask.ai/en-US) | Enterprise REST API, SDK | FBX, BVH, GLB, VMD | Free 15s/day, from $18/mo | Browser editor, retargeting |
| 4 | RADiCAL Motion | [radicalmotion.com](https://radicalmotion.com/) | Enterprise API | FBX, BVH, JSON | Free, from $15/mo | Real-time + batch, Autodesk-backed |
| 5 | Rokoko Vision | [rokoko.com/vision](https://www.rokoko.com/products/vision) | Command API (Pro) | FBX, BVH, CSV | Free 15s, from $20/mo | Browser-based, no cloud REST API |
| 6 | Autodesk Flow Studio | [autodesk.com](https://www.autodesk.com/products/flow-studio/overview) | No public API | FBX, USD | Free, from $10/mo | VFX pipeline, body+hand+face |
| 7 | Meshcapade | [meshcapade.com](https://meshcapade.com/) | REST API | FBX, GLB, SMPL | Free, from EUR 10/mo | SMPL-based, acquired by Epic |
| 8 | Kinetix | [kinetix.tech](https://kinetix.tech/) | REST API + Unity/UE SDK | FBX, GLB | 10k free emotes | Gaming emotes, Unity Muse |
| 9 | QuickMagic | [quickmagic.ai](https://www.quickmagic.ai/) | No | FBX, VMD, BIP | Free 50s/mo, from $9.90/mo | Auto keyframe detection |
| 10 | Krikey AI | [krikey.ai](https://www.krikey.ai) | No | FBX, GLB | Free tier | Auto-rigging, lip sync |
| 11 | Cartwheel | [getcartwheel.com](https://getcartwheel.com/) | No (beta) | FBX, GLTF | Waitlist | Generative motion platform |
| 12 | Uthana | [uthana.com](https://uthana.com/) | No | FBX, GLB | Free early access | Text-to-motion + video-to-motion |
| 13 | Cyan Puppets | [cyanpuppets.com](https://cyanpuppets.com/) | No | BVH, FBX | Free Blender plugin | 1B-param AI, 0.1s latency |
| 14 | Marionette Mocap | [marionettemocap.com](https://marionettemocap.com/) | No | FBX, GLTF, GLB | Free tier (3s) | Streams to Maya/Blender/Unity |
| 15 | 3motionAI | [3motionai.com](https://3motionai.com/) | SDK/API | JSON, CSV | Enterprise | Biomechanics/sports analysis |
| 16 | Viggle AI | [viggle.ai](https://viggle.ai/) | No | MP4 video | Free 5/day | Motion transfer, JST-1 model |
| 17 | SnapMeasureAI | [snapmeasureai.com](https://snapmeasureai.com/) | Yes | 3D motion data | Enterprise | 500+ anatomical landmarks |
| 18 | Cascadeur | [cascadeur.com](https://cascadeur.com) | No | FBX, DAE, BVH | Free tier | AI-assisted keyframe + video mocap |
| 19 | Pixcap | [pixcap.com](https://pixcap.com/) | No | FBX, GLTF | Free tier | Browser 3D animation + AI mocap |
| 20 | Whythetrick | [whythetrick.io](https://whythetrick.io) | Unknown | 3D animation | Unknown | AI video-to-3D |
| 21 | iClone Video Mocap | [reallusion.com](https://www.reallusion.com/iclone/video-mocap/) | No | FBX, BVH | Pay-per-use (~$2.50/60s) | Powered by QuickMagic |
| 22 | Monet.vision | [monet.vision](https://monet.vision/) | No | Video | Free tier | Motion transfer to images |

### 9B. Phone / Mobile MoCap Apps (11)

| # | Name | Platform | URL | Output | Pricing |
|---|------|----------|-----|--------|---------|
| 1 | Modif (Plask) | iOS/Android | [App Store](https://apps.apple.com/us/app/modif/id1611313983) | FBX | Free 60min/mo |
| 2 | MoCap App | iOS | [App Store](https://apps.apple.com/us/app/moc%C3%A1p/id1489748818) | BVH | Paid |
| 3 | Move One | iOS | [App Store](https://apps.apple.com/us/app/move-ai-3d-motion/id6448635527) | FBX, BVH | Subscription |
| 4 | Face Cap | iOS | [App Store](https://apps.apple.com/us/app/face-cap-motion-capture/id1373155478) | FBX, TXT | Paid |
| 5 | MocapX | iOS | [mocapx.com](https://www.mocapx.com/) | FBX, Live stream | Paid |
| 6 | Facemotion3D | iOS | [facemotion3d.com](https://www.facemotion3d.com/) | FBX | Paid |
| 7 | Sony Mocopi | iOS/Android | [sony.net/mocopi](https://www.sony.net/mocopi-dev) | BVH, real-time | ~$400 (hardware) |
| 8 | MobilePoser | iOS | [Northwestern](https://news.northwestern.edu/stories/2024/10/) | Pose data | Research |
| 9 | MocApp | Android | [Google Play](https://play.google.com/store/apps/details?id=tech.sportvision.mocapp) | BVH | Free/Paid |
| 10 | Waidayo | iOS | App Store | VMC protocol | Free |
| 11 | iFacialMocap | iOS | App Store | Blendshape data | $5.99 |

### 9C. Mobile SDKs & AR Frameworks (8)

| # | Name | URL | Tracking | Platform |
|---|------|-----|----------|----------|
| 1 | Apple ARKit Body Tracking | [developer.apple.com](https://developer.apple.com/documentation/arkit/arbodytrackingconfiguration) | 91 body joints, 60 FPS | iOS |
| 2 | Apple Vision Framework | [developer.apple.com](https://developer.apple.com/documentation/vision) | 19 joints (2D), 17 joints (3D) | iOS/macOS |
| 3 | Google ML Kit Pose | [developers.google.com](https://developers.google.com/ml-kit/vision/pose-detection) | Body skeleton | iOS/Android |
| 4 | Snapchat Lens Studio | [developers.snap.com](https://developers.snap.com/lens-studio/features/ar-tracking/body/body-templates/3d-body-tracking) | 18 attachment points, 3D skeleton | Snapchat |
| 5 | Banuba SDK | [banuba.com](https://www.banuba.com) | Face/body segmentation | iOS/Android |
| 6 | LightBuzz SDK | [lightbuzz.com](https://lightbuzz.com/) | ML body tracking, 360-degree | Cross-platform |
| 7 | Nuitrack SDK | [nuitrack.com](https://nuitrack.com/) | 19-joint skeleton (depth cameras) | Cross-platform |
| 8 | QuickPose.ai | [quickpose.ai](https://quickpose.ai/) | 33-point skeleton, fitness | iOS SDK + REST |

### 9D. Desktop MoCap Software (15)

| # | Name | URL | Method | Output | Pricing |
|---|------|-----|--------|--------|---------|
| 1 | iPi Soft | [ipisoft.com](https://ipisoft.com/) | 1-4 depth sensors / 3-16 RGB cameras | FBX, BVH, COLLADA | $295-$895 |
| 2 | Brekel Pro Body | brekel.com | Depth sensors | BVH, FBX | Paid |
| 3 | MocapForAll | [Steam](https://store.steampowered.com/app/1759710/) | Multiple webcams AI | BVH, FBX, VMC/OSC | Paid |
| 4 | ThreeDPoseTracker | [digital-standard.com](https://digital-standard.com/tdpt_lp/en/) | Webcam/iPhone ML | VMC protocol | Free (non-commercial) |
| 5 | Webcam Motion Capture | [webcammotioncapture.info](https://webcammotioncapture.info/) | Webcam AI | VMC, FBX, BVH | $1.99/mo |
| 6 | Dollars MONO | [dollarsmocap.com](https://www.dollarsmocap.com/) | Single webcam | BVH, Live stream | $99 one-time |
| 7 | Remocapp | [remocapp.com](https://remocapp.com/) | 2 webcams AI | FBX, BVH | Free trial |
| 8 | Adobe Character Animator | [adobe.com](https://www.adobe.com/products/character-animator.html) | Webcam + mic | Video, PNG seq | CC subscription |
| 9 | Cartoon Animator 5 | [reallusion.com](https://www.reallusion.com/cartoon-animator/) | Webcam facial + Motion LIVE 2D | PSD, Video | ~$149 |
| 10 | iClone 8 + Motion LIVE | [reallusion.com](https://www.reallusion.com/iclone/) | Supports Vicon/OptiTrack/Rokoko/Xsens | FBX, BVH | ~$299+ |
| 11 | Autodesk MotionBuilder | [autodesk.com](https://www.autodesk.com/products/motionbuilder) | Industry standard mocap editing | FBX, BVH | Subscription |
| 12 | FreeMoCap | [freemocap.org](https://freemocap.org/) | 2+ cameras, open source | C3D, CSV, Blender | Free/OSS |
| 13 | SysMocap | [GitHub](https://github.com/xianfei/SysMocap) | Webcam, MediaPipe, cross-platform | VRM, FBX, GLB | Free/OSS |
| 14 | AccuRIG 2 | [reallusion.com](https://www.reallusion.com/) | Auto-rigging | FBX | Free |
| 15 | Mixamo | [mixamo.com](https://www.mixamo.com/) | Auto-rigging + animation library | FBX | Free |

### 9E. VTuber / Virtual Avatar Software (22)

| # | Name | URL | Tracking | Price | Platform |
|---|------|-----|----------|-------|----------|
| 1 | VSeeFace | [vseeface.icu](https://www.vseeface.icu/) | OpenSeeFace, Leap Motion, VMC | Free | Windows |
| 2 | VTube Studio | [denchisoft.com](https://denchisoft.com/) | OpenSeeFace, ARKit, ARCore | Free (watermark) / EUR 12.49 | Multi |
| 3 | VMagicMirror | [GitHub](https://malaybaku.github.io/VMagicMirror/en/) | Webcam, keyboard/mouse, VMC | Free | Windows |
| 4 | Warudo | [Steam](https://store.steampowered.com/app/2079120/Warudo/) | MediaPipe, OpenSeeFace, VMC, VR | Free | Windows |
| 5 | VNyan | [itch.io](https://suvidriel.itch.io/vnyan) | Camera, ARKit, Leap, SteamVR, VMC | Free | Windows |
| 6 | 3tene | Steam | Webcam, Leap Motion | Free / 2000 JPY | Win/Mac |
| 7 | Luppet | Booth.pm | Webcam, Leap Motion, VMC | 6000+ JPY | Windows |
| 8 | Wakaru | Steam | Webcam | Free | Windows |
| 9 | Animaze (FaceRig) | [animaze.us](https://www.animaze.us) | VisageTech, Leap Motion, VMC, ARKit | Free / paid | Windows |
| 10 | VKatsu | Steam | Webcam, VR | Free | Windows |
| 11 | Virtual Motion Capture | [vmc.info](https://vmc.info/) | VR, Tobii, VMC | Free / 300 JPY | Windows |
| 12 | XR Animator | [GitHub](https://github.com/ButzYung/SystemAnimatorOnline) | Webcam AI, VMC | Free | Windows |
| 13 | VUP (VTuber Maker) | Steam | Face + body, VMC | Paid | Multi |
| 14 | Live3D | Steam | Webcam | Free / paid | Windows |
| 15 | Kalidoface 3D | [3d.kalidoface.com](https://3d.kalidoface.com/) | MediaPipe | Free | Browser |
| 16 | Kalidoface 2D | [2d.kalidoface.com](https://2d.kalidoface.com/) | MediaPipe | Free | Browser |
| 17 | OpenSeeFace | [GitHub](https://github.com/emilianavt/OpenSeeFace) | Webcam, MobileNetV3 | Free/OSS | Cross-platform |
| 18 | Inochi2D | [inochi2d.com](https://inochi2d.com/) | Open source 2D VTuber | Free/OSS | Multi |
| 19 | MeowFace | Google Play | ARCore | Free | Android |
| 20 | nizima LIVE | [nizimalive.com](https://nizimalive.com/) | Webcam/iPhone + Sony Mocopi | Paid | Multi |
| 21 | Brioche Puppet | Steam/GitHub | MediaPipe, VMC | Free/OSS | Multi |
| 22 | Thirdrez MoCap Studio | [thirdrez.com/mocap](https://thirdrez.com/mocap) | Webcam/video, browser | Free (capture) | Browser |

### 9F. Hardware MoCap Systems (16)

| # | Name | URL | Type | SDK/API | Output |
|---|------|-----|------|---------|--------|
| 1 | Xsens MVN (Movella) | [movella.com](https://www.movella.com/) | IMU suit | XDA SDK, DOT SDK, MVN SDK | FBX, BVH, MVNX |
| 2 | Rokoko Smartsuit Pro II | [rokoko.com](https://www.rokoko.com/) | IMU suit | Rokoko Studio API | FBX, BVH |
| 3 | Perception Neuron 3 (Noitom) | [neuronmocap.com](https://neuronmocap.com/) | IMU suit | MocapApi SDK, Unity/UE | BVH, FBX |
| 4 | OptiTrack (Motive) | [optitrack.com](https://optitrack.com/) | Optical markers | NatNet SDK, Camera SDK | FBX, BVH, C3D |
| 5 | Vicon (Shogun) | [vicon.com](https://www.vicon.com/) | Optical markers + markerless | DataStream SDK (C++/.NET/Python) | C3D, FBX, BVH |
| 6 | Captury (CapturyLive) | [captury.com](https://captury.com/) | Markerless multi-cam | SDK, plugins | FBX, BVH, C3D |
| 7 | Sony Mocopi | [sony.net/mocopi](https://www.sony.net/mocopi-dev) | 6-12 IMU sensors | Mobile SDK, Unity | BVH |
| 8 | NANSENSE | [nansense.com](https://www.nansense.com/) | IMU suit + gloves | Broadcasting SDK, plugins | FBX |
| 9 | Manus (Meta-Gloves) | [manus-meta.com](https://www.manus-meta.com/) | Hand tracking gloves | Manus Core SDK | FBX, CSV |
| 10 | StretchSense | [stretchsense.com](https://stretchsense.com/) | Capacitive hand gloves | Open SDK (OSC) | Rotation data |
| 11 | SlimeVR | [slimevr.dev](https://slimevr.dev/) | Open-source IMU trackers | SteamVR, VMC | Real-time |
| 12 | PhaseSpace | [phasespace.com](https://www.phasespace.com/) | Active LED optical | C++/Python API | Real-time |
| 13 | Qualisys | [qualisys.com](https://www.qualisys.com/) | Optical markers | QTM SDK | C3D, FBX |
| 14 | Notch | [wearnotch.com](https://wearnotch.com/) | 6 wireless IMU | Smartphone app | Pose data |
| 15 | Antilatency | [antilatency.com](https://antilatency.com/) | IR position tracking | SDK (C++, Unity/UE) | 6DOF |
| 16 | Virdyn VDSuit | [virdynm.com](https://www.virdynm.com/) | IMU suit (27 sensors) | Plugins for all DCCs | FBX, BVH |

### 9G. DCC Plugins — Blender (12)

| # | Name | URL | Description |
|---|------|-----|-------------|
| 1 | Open Mocap | [Blender Artists](https://blenderartists.org/t/open-mocap-addon-for-blender-4-0/1621443) | AI offline full-body+hand tracking |
| 2 | BlendArMocap | [GitHub](https://github.com/cgtinker/BlendArMocap) | Webcam hand+face+body via MediaPipe |
| 3 | VIPER | [GitHub](https://github.com/Daniel-W-Blender-Python/VIPER-Blender-Facial-Motion-Capture) | MediaPipe face to 3D expressions |
| 4 | Cyan Puppets Plugin | [cyanpuppets.com](https://cyanpuppets.com/) | Free AI mocap, local processing |
| 5 | FreeMoCap Addon | [GitHub](https://github.com/freemocap/freemocap_blender_addon) | Load FreeMoCap data |
| 6 | Rokoko Plugin | [rokoko.com](https://www.rokoko.com/integrations/blender) | Stream Rokoko data |
| 7 | Meshcapade SMPL Addon | [GitHub](https://github.com/Meshcapade/SMPL_blender_addon) | Edit SMPL-H/SMPL-X/SUPR bodies |
| 8 | Remocapp Plugin | [remocapp.com](https://remocapp.com/) | Import + stream mocap |
| 9 | Mocap Blender | [Superhive](https://superhivemarket.com/products/mocap-blender) | Blend multiple mocap files |
| 10 | DEMoCap Tools | [Blender Extensions](https://extensions.blender.org/add-ons/democap-tools/) | Import DEMoCap animations |
| 11 | BlendArTrack | [GitHub](https://github.com/cgtinker/blendartrack) | AR camera + facial mocap import |
| 12 | Maya-Mocap | [GitHub](https://github.com/davidpagnon/Maya-Mocap) | OSS mocap tools for Maya |

### 9H. DCC Plugins — Maya, After Effects, Daz (10)

| # | Name | DCC | URL | Description |
|---|------|-----|-----|-------------|
| 1 | MotionMaker | Maya 2026.1+ | [Autodesk](https://blogs.autodesk.com/media-and-entertainment/2025/06/04/meet-motionmaker/) | Built-in AI locomotion generation |
| 2 | Marionette Plugin | Maya | [marionettemocap.com](https://marionettemocap.com/) | Real-time AI mocap streaming |
| 3 | Rokoko Plugin | Maya | [rokoko.com](https://www.rokoko.com/integrations/maya) | Stream Rokoko data |
| 4 | MocapX Plugin | Maya | [mocapx.com](https://www.mocapx.com/) | iPhone facial to Maya |
| 5 | Movella Plugin | Maya/MotionBuilder | [movella.com](https://base.movella.com/) | Xsens live plugin |
| 6 | Mocha AE | After Effects | [borisfx.com](https://borisfx.com/) | Planar motion tracking |
| 7 | Mocap Live (Rokoko) | Daz Studio | [daz3d.com](https://www.daz3d.com/mocap-live) | Connect Rokoko to Daz |
| 8 | Face Mojo | Daz Studio | Daz marketplace | iOS facial to Daz |
| 9 | RR Mocap Utility | Daz Studio | [liberty3d.com](https://www.liberty3d.com/) | BVH/FBX import + retarget |
| 10 | AccuPOSE | iClone | [reallusion.com](https://www.reallusion.com/accupose/) | AI keyframe posing |

### 9I. Game Engine Plugins (12)

| # | Name | Engine | URL | Description |
|---|------|--------|-----|-------------|
| 1 | Rokoko Plugin | Unity | [rokoko.com](https://www.rokoko.com/integrations/unity) | Stream mocap to Unity |
| 2 | Rokoko Plugin | Unreal | [rokoko.com](https://www.rokoko.com/integrations/unreal) | Stream mocap to UE |
| 3 | ReMoCapp Plugin | Unreal | [UE Marketplace](https://www.unrealengine.com/marketplace/) | AI markerless in UE |
| 4 | APS MoCap Fusion | Unreal | UE Marketplace | VR avatar motion sync |
| 5 | R1Tools OpenXR MoCap | Unity | [Asset Store](https://assetstore.unity.com/) | VR motion capture |
| 6 | GodotXR VMC Tracker | Godot | [GitHub](https://github.com/Malcolmnixon/GodotXRVmcTracker) | VMC protocol receiver |
| 7 | GodotXR Rokoko | Godot | [Asset Library](https://godotengine.org/asset-library/asset/3194) | Rokoko data receiver |
| 8 | GodotXR MVN | Godot | [GitHub](https://github.com/Malcolmnixon/GodotXRMvnTracker) | Xsens data receiver |
| 9 | PipeDoll | Godot | [GitHub](https://github.com/ectucker1/pipedoll) | 2D MediaPipe mocap |
| 10 | Mixamo Retargeter | Godot | [Asset Library](https://godotengine.org/asset-library/asset/3429) | Mixamo animation import |
| 11 | UniVRM | Unity | [univrm.com](https://univrm.com/) | VRM import/edit/animate |
| 12 | HolisticMotionCapture | Unity | [GitHub](https://github.com/creativeIKEP/HolisticMotionCapture) | MediaPipe to VRM |

### 9J. 2D Pose Estimation — Browser-Ready (7)

| # | Name | Package | Keypoints | FPS (browser) | License |
|---|------|---------|-----------|--------------|---------|
| 1 | MediaPipe PoseLandmarker | `@mediapipe/tasks-vision` | 33 body (2D+3D) | 30-60 | Apache-2.0 |
| 2 | MediaPipe HolisticLandmarker | `@mediapipe/tasks-vision` | 543 (body+face+hands) | 20-40 | Apache-2.0 |
| 3 | MediaPipe FaceLandmarker | `@mediapipe/tasks-vision` | 468 face + 52 blendshapes | 30-60 | Apache-2.0 |
| 4 | MoveNet Lightning | `@tensorflow-models/pose-detection` | 17 COCO | 50+ | Apache-2.0 |
| 5 | MoveNet Thunder | `@tensorflow-models/pose-detection` | 17 COCO | 30+ | Apache-2.0 |
| 6 | BlazePose (via TF.js) | `@tensorflow-models/pose-detection` | 33 (3D via GHUM) | 25-35 | Apache-2.0 |
| 7 | PoseNet (legacy) | `@tensorflow-models/pose-detection` | 17 COCO | 20-30 | Apache-2.0 |

### 9K. 2D Pose Estimation — Server-Side Python (12)

| # | Name | URL | COCO AP | Speed | License | Browser via ONNX? |
|---|------|-----|---------|-------|---------|-------------------|
| 1 | RTMPose-m (MMPose) | [GitHub](https://github.com/open-mmlab/mmpose) | 75.8% | 90+ FPS CPU | Apache-2.0 | Possible |
| 2 | ViTPose++ | [GitHub](https://github.com/ViTAE-Transformer/ViTPose) | 81.1% | GPU only | Apache-2.0 | Emerging |
| 3 | YOLO26-Pose | [GitHub](https://github.com/ultralytics/ultralytics) | 57-72% | 1.8-12ms T4 | AGPL-3.0 | Proven |
| 4 | DWPose | [GitHub](https://github.com/IDEA-Research/DWPose) | Whole-body | Fast | Apache-2.0 | Via rtmlib |
| 5 | RTMO | In MMPose | 74.8% | 141 FPS GPU | Apache-2.0 | No |
| 6 | RTMW (3D whole-body) | In MMPose | Whole-body 2D+3D | Fast | Apache-2.0 | No |
| 7 | Sapiens (Meta) | [GitHub](https://github.com/facebookresearch/sapiens) | 308 keypoints | 0.3-2B params | Open | No |
| 8 | AlphaPose | [GitHub](https://github.com/MVIG-SJTU/AlphaPose) | 73.3% | GPU | Non-commercial | No |
| 9 | HRNet | [GitHub](https://github.com/leoxiaobin/deep-high-resolution-net.pytorch) | 76.3% | Moderate | MIT | No |
| 10 | OpenPose | [GitHub](https://github.com/CMU-Perceptual-Computing-Lab/openpose) | ~61-65% | GPU | Non-commercial ($25k/yr) | No |
| 11 | DETRPose | [GitHub](https://github.com/SebastianJanampa/DETRPose) | 73.3% | Real-time | Apache-2.0 | No |
| 12 | YOLO-NAS-Pose | [GitHub](https://github.com/Deci-AI/super-gradients) | SOTA speed | Very fast | Apache-2.0 | Possible |

### 9L. 3D Pose / Human Mesh Recovery — Research (30+)

| # | Name | Year | URL | Output | Key Innovation |
|---|------|------|-----|--------|---------------|
| 1 | GVHMR | 2024 | [GitHub](https://github.com/zju3dv/GVHMR) | SMPL world-space | Gravity-view coords, SIGGRAPH Asia |
| 2 | WHAM | 2024 | [GitHub](https://github.com/yohanshin/WHAM) | SMPL world-space | SLAM + motion fusion, CVPR |
| 3 | TRAM | 2024 | [GitHub](https://github.com/yufu-wang/tram) | SMPL + trajectory | Global trajectory, ECCV |
| 4 | HMR 2.0 / 4DHumans | 2024 | [GitHub](https://github.com/shubham-goel/4D-Humans) | SMPL mesh | Transformer-based, CVPR |
| 5 | TokenHMR | 2024 | [GitHub](https://github.com/saidwivedi/TokenHMR) | SMPL | Tokenized pose, CVPR |
| 6 | ScoreHMR | 2024 | [GitHub](https://github.com/statho/ScoreHMR) | SMPL | Score-guided diffusion, CVPR |
| 7 | Multi-HMR | 2024 | [GitHub](https://github.com/naver/multi-hmr) | SMPL-X multi-person | Single-shot whole-body, ECCV |
| 8 | MotionBERT | 2023 | [GitHub](https://github.com/Walter0807/MotionBERT) | 3D joints + SMPL | Unified pretraining, ICCV |
| 9 | OSX | 2023 | [GitHub](https://github.com/IDEA-Research/OSX) | SMPL-X whole-body | One-stage, CVPR |
| 10 | ReFit | 2023 | [Project](https://yufu-wang.github.io/refit_humans/) | SMPL | Recurrent fitting, ICCV |
| 11 | PLIKS | 2023 | [GitHub](https://github.com/karShetty/PLIKS) | SMPL | Pseudo-linear IK, CVPR |
| 12 | CLIFF | 2022 | [GitHub](https://github.com/haofanwang/CLIFF) | SMPL | Location-aware, ECCV |
| 13 | FastMETRO | 2022 | [GitHub](https://github.com/kaist-ami/FastMETRO) | 3D mesh | 10x smaller than METRO, ECCV |
| 14 | GLAMR | 2022 | [GitHub](https://github.com/NVlabs/GLAMR) | SMPL global | Occlusion-aware, NVIDIA, CVPR |
| 15 | PyMAF / PyMAF-X | 2021/23 | [GitHub](https://github.com/HongwenZhang/PyMAF-X) | SMPL-X | Mesh alignment feedback |
| 16 | HybrIK / HybrIK-X | 2021/25 | [GitHub](https://github.com/jeffffffli/HybrIK) | SMPL(-X) | Hybrid IK, twist-swing |
| 17 | FrankMocap | 2021 | [GitHub](https://github.com/facebookresearch/frankmocap) | SMPL-H/X | Hand+body, Meta |
| 18 | METRO | 2021 | [GitHub](https://github.com/microsoft/MeshTransformer) | 3D mesh | Transformer, Microsoft |
| 19 | Mesh Graphormer | 2021 | [GitHub](https://github.com/microsoft/MeshGraphormer) | 3D mesh | Graph-conv + self-attention |
| 20 | ROMP | 2021 | [GitHub](https://github.com/Arthur151/ROMP) | SMPL multi-person | One-stage, real-time |
| 21 | ProHMR | 2021 | [GitHub](https://github.com/nkolot/ProHMR) | SMPL | Probabilistic, normalizing flows |
| 22 | ExPose | 2020 | [GitHub](https://github.com/vchoutas/expose) | SMPL-X | Body+face+hands |
| 23 | VIBE | 2020 | [GitHub](https://github.com/mkocabas/VIBE) | SMPL | Video-based, CVPR |
| 24 | VideoPose3D | 2019 | [GitHub](https://github.com/facebookresearch/VideoPose3D) | 3D joints | Temporal convolutions, Meta |
| 25 | SPIN | 2019 | [GitHub](https://github.com/nkolot/SPIN) | SMPL | Self-improving loop |
| 26 | SMPLify-X | 2019 | [GitHub](https://github.com/vchoutas/smplify-x) | SMPL-X | Optimization-based fitting |
| 27 | SMPLer-X / SMPLest-X | 2023/25 | [GitHub](https://github.com/MotrixLab/SMPLest-X) | SMPL-X | Scaling laws, ViT-Huge |
| 28 | PIXIE | 2021 | [GitHub](https://github.com/yfeng95/PIXIE) | SMPL-X | Face detail + wrinkles |
| 29 | Hand4Whole | 2022 | [GitHub](https://github.com/mks0601/Hand4Whole_RELEASE) | SMPL-X | Body+hand+face modular |
| 30 | BEV | 2022 | [Project](https://www.yusun.work/BEV/BEV.html) | SMPL multi-person | Bird's-eye-view depth |
| 31 | BLADE (NVIDIA) | 2025 | [GitHub](https://github.com/NVlabs/blade) | SMPL-X | Accurate depth, CVPR |
| 32 | PromptHMR | 2025 | [GitHub](https://github.com/yufu-wang/PromptHMR) | SMPL | Spatial/semantic prompting |
| 33 | GenHMR | 2025 | [GitHub](https://github.com/m-usamasaleem/GenHMR) | SMPL | Generative pose uncertainty |
| 34 | MoCapAnything | 2025 | [Project](https://animotionlab.github.io/MoCapAnything/) | BVH | Any skeleton, any species |

### 9M. Browser / npm Packages (20)

| # | Package | npm | What It Does |
|---|---------|-----|-------------|
| 1 | `@mediapipe/tasks-vision` | [npm](https://www.npmjs.com/package/@mediapipe/tasks-vision) | Official MediaPipe pose/face/hand |
| 2 | `@tensorflow-models/pose-detection` | [npm](https://www.npmjs.com/package/@tensorflow-models/pose-detection) | MoveNet, BlazePose, PoseNet |
| 3 | `@tensorflow-models/hand-pose-detection` | [npm](https://www.npmjs.com/package/@tensorflow-models/handpose) | 21 hand landmarks |
| 4 | `@tensorflow-models/face-landmarks-detection` | [npm](https://www.npmjs.com/package/@tensorflow-models/face-landmarks-detection) | 478 face keypoints |
| 5 | `@tensorflow-models/body-segmentation` | [npm](https://www.npmjs.com/package/@tensorflow-models/body-segmentation) | Person/body-part segmentation |
| 6 | `kalidokit` | [npm](https://www.npmjs.com/package/kalidokit) | Landmark → rotation solver (deprecated) |
| 7 | `@pixiv/three-vrm` | [npm](https://www.npmjs.com/package/@pixiv/three-vrm) | VRM model loader for Three.js |
| 8 | `@pixiv/three-vrm-animation` | [npm](https://www.npmjs.com/package/@pixiv/three-vrm-animation) | VRM animation clips |
| 9 | `@vladmandic/human` | [npm](https://www.npmjs.com/package/@vladmandic/human) | All-in-one: face, body, hand, gesture |
| 10 | `onnxruntime-web` | [npm](https://www.npmjs.com/package/onnxruntime-web) | Run ONNX models (WebGPU/WebGL/WASM) |
| 11 | `pixi-live2d-display` | [npm](https://www.npmjs.com/package/pixi-live2d-display) | Live2D rendering in PixiJS |
| 12 | `vrm-mixamo-retarget` | [npm](https://www.npmjs.com/package/vrm-mixamo-retarget) | Mixamo FBX → VRM retarget |
| 13 | `@davidcks/r3f-vrm` | [npm](https://www.npmjs.com/package/@davidcks/r3f-vrm) | React Three Fiber VRM |
| 14 | `three-ik` | [npm](https://www.npmjs.com/package/three-ik) | FABRIK IK solver for Three.js |
| 15 | `mind-ar` | [npm](https://www.npmjs.com/package/mind-ar) | Web AR face/image tracking |
| 16 | `js-ai-body-tracker` | [GitHub](https://github.com/szczyglis-dev/js-ai-body-tracker) | Wraps MoveNet/PoseNet/BlazePose |
| 17 | `skeleton-tracing-js` | [npm](https://www.npmjs.com/package/skeleton-tracing-js) | Skeleton from binary images |
| 18 | `@wentzien/motion-capture` | [npm](https://www.npmjs.com/package/@wentzien/motion-capture) | Webcam motion capture |
| 19 | `@gymbrosinc/react-native-mediapipe-pose` | npm | React Native BlazePose |
| 20 | `aframe-motion-capture-components` | npm | A-Frame VR motion recording |

### 9N. Python / PyPI Packages (14)

| # | Package | PyPI | What It Does |
|---|---------|------|-------------|
| 1 | `mediapipe` | [pypi](https://pypi.org/project/mediapipe/) | Google ML: pose, face, hands |
| 2 | `mmpose` | [pypi](https://pypi.org/project/mmpose/) | OpenMMLab toolbox |
| 3 | `ultralytics` | [pypi](https://pypi.org/project/ultralytics/) | YOLO pose + detection |
| 4 | `rtmlib` | [pypi](https://pypi.org/project/rtmlib/) | RTMPose/DWPose zero-dep |
| 5 | `pose2sim` | [pypi](https://pypi.org/project/pose2sim/) | 2D → 3D → OpenSim |
| 6 | `freemocap` | [pypi](https://pypi.org/project/freemocap/) | Research-grade markerless |
| 7 | `openpifpaf` | [pypi](https://pypi.org/project/openpifpaf/) | Composite fields keypoints |
| 8 | `smplx` | [pypi](https://pypi.org/project/smplx/) | Official SMPL-X model |
| 9 | `human-body-prior` | [pypi](https://pypi.org/project/human-body-prior/) | VPoser pose prior |
| 10 | `deeplabcut` | [pypi](https://pypi.org/project/deeplabcut/) | Markerless pose (animals + humans) |
| 11 | `PyBodyTrack` | [pypi](https://pypi.org/project/PyBodyTrack/) | Multi-algorithm motion quantification |
| 12 | `posecamera` | [pypi](https://pypi.org/project/posecamera/) | Multi-human pose SDK |
| 13 | `pyxy3d` | [pypi](https://pypi.org/project/pyxy3d/) | Multi-webcam 3D tracking |
| 14 | `mpose` | [pypi](https://pypi.org/project/mpose/) | Action recognition from pose |

### 9O. Video-to-BVH Converters (7)

| # | Name | URL | Method |
|---|------|-----|--------|
| 1 | VideoTo3dPoseAndBvh | [GitHub](https://github.com/HW140701/VideoTo3dPoseAndBvh) | AlphaPose/HRNet → VideoPose3D → BVH |
| 2 | video2bvh | [GitHub](https://github.com/KevinLTT/video2bvh) | 3-module: 2D → 3D → BVH |
| 3 | video_to_bvh | [GitHub](https://github.com/Dene33/video_to_bvh) | CSV → BVH via Blender |
| 4 | mediapipe-pose2bvh | [GitHub](https://github.com/tejaswigowda/mediapipe-pose2bvh) | MediaPipe → BVH (browser) |
| 5 | MotioNet | [GitHub](https://github.com/Shimingyi/MotioNet) | Direct video → BVH neural net |
| 6 | smpl2bvh | [GitHub](https://github.com/KosukeFukazawa/smpl2bvh) | SMPL params → BVH |
| 7 | BVH2SMPL | [GitHub](https://github.com/EmptyBlueBox/BVH2SMPL) | BVH → SMPL (reverse) |

### 9P. Retargeting & IK Libraries (8)

| # | Name | URL | What It Does | License |
|---|------|-----|-------------|---------|
| 1 | retargeting-threejs | [GitHub](https://github.com/upf-gti/retargeting-threejs) | Three.js humanoid retargeting | Apache-2.0 |
| 2 | IK-threejs | [GitHub](https://github.com/upf-gti/IK-threejs) | CCD + FABRIK IK for Three.js | Apache-2.0 |
| 3 | vrm-mixamo-retarget | [npm](https://www.npmjs.com/package/vrm-mixamo-retarget) | Mixamo FBX → VRM | MIT |
| 4 | Three.js SkeletonUtils | [Three.js](https://threejs.org/docs/pages/module-SkeletonUtils.html) | Built-in retarget/retargetClip | MIT |
| 5 | THREE.IK | [GitHub](https://github.com/jsantell/THREE.IK) | FABRIK solver | MIT |
| 6 | Pose Animator | [GitHub](https://github.com/yemount/pose-animator) | SVG 2D character from webcam | Apache-2.0 |
| 7 | Anything World | [everythinguniver.se](https://everythinguniver.se/) | AI auto-rigging + animation | Commercial |
| 8 | Motorica | [motorica.com](https://www.motorica.com/) | AI motion generation, 150+ styles | Commercial |

### 9Q. Text-to-Motion / AI Motion Generation (10)

| # | Name | URL | Description | Code |
|---|------|-----|-------------|------|
| 1 | MDM (Motion Diffusion Model) | [GitHub](https://github.com/GuyTevet/motion-diffusion-model) | Diffusion-based, ICLR 2023 | Yes |
| 2 | MotionDiffuse | [GitHub](https://github.com/mingyuan-zhang/MotionDiffuse) | Text-driven diffusion | Yes |
| 3 | MotionGPT | [GitHub](https://github.com/OpenMotionLab/MotionGPT) | LLM-based, NeurIPS 2023 | Yes |
| 4 | T2M-GPT | [GitHub](https://github.com/Mael-zys/T2M-GPT) | GPT-based, CVPR 2023 | Yes |
| 5 | MoMask | [Project](https://ericguo5513.github.io/momask/) | Masked modeling, CVPR 2024 SOTA | Yes |
| 6 | MotionMaker (Maya) | [Autodesk](https://blogs.autodesk.com/media-and-entertainment/2025/06/04/meet-motionmaker/) | Built-in Maya AI locomotion | Maya 2026.1+ |
| 7 | Cartwheel | [getcartwheel.com](https://getcartwheel.com/) | Generative motion platform | Beta |
| 8 | Uthana | [uthana.com](https://uthana.com/) | Text + video to motion | Free |
| 9 | AccuPOSE | [reallusion.com](https://www.reallusion.com/accupose/) | AI keyframe posing | iClone |
| 10 | Motorica Motion Factory | [motorica.com](https://www.motorica.com/) | AI motion datasets, 150+ styles | Plugin API |

### 9R. AI Video Generation with Motion Features (10)

| # | Name | URL | Motion Features | API |
|---|------|-----|----------------|-----|
| 1 | Viggle AI | [viggle.ai](https://viggle.ai/) | Motion transfer from video, 1000+ templates | No |
| 2 | Kling AI | [klingai.com](https://klingai.com/) | Motion Brush, Motion Control, lip-sync | REST API |
| 3 | Runway | [runwayml.com](https://runwayml.com/) | Motion Brush, Gen-3, video agent | REST API |
| 4 | Pika | [pika.art](https://pika.art/) | Pikaffects, Pikaframes, lip sync | API via fal.ai |
| 5 | Synthesia | [synthesia.io](https://www.synthesia.io/) | AI avatars, 140+ languages | REST API |
| 6 | HeyGen | [heygen.com](https://www.heygen.com/) | Mocap-based avatars, gestures | REST API |
| 7 | D-ID | [d-id.com](https://www.d-id.com/) | Photo-to-talking-head | REST API |
| 8 | Sora (OpenAI) | [openai.com/sora](https://openai.com/sora/) | Physics simulation, anatomy | API |
| 9 | Open-Sora | [GitHub](https://github.com/hpcaitech/Open-Sora) | Open-source video generation | Free/OSS |
| 10 | Pollo Mimic Motion | [pollo.ai](https://pollo.ai/mimic-motion) | Motion transfer from reference | Free tier |

### 9S. Body Models & Datasets (10)

| # | Name | URL | Description |
|---|------|-----|-------------|
| 1 | SMPL / SMPL-X / SMPL+H | [smpl-x.is.tue.mpg.de](https://smpl-x.is.tue.mpg.de/) | Industry standard body model |
| 2 | STAR | [GitHub](https://github.com/ahmedosman/STAR) | Sparse SMPL replacement, open source |
| 3 | MANO | [mano.is.tue.mpg.de](https://mano.is.tue.mpg.de/) | Hand body model |
| 4 | AMASS | [amass.is.tue.mpg.de](https://amass.is.tue.mpg.de/) | 40+ hours unified SMPL mocap |
| 5 | BEDLAM / BEDLAM 2.0 | [bedlam.is.tue.mpg.de](https://bedlam.is.tue.mpg.de/) | 8M+ synthetic images, SMPL-X GT |
| 6 | Human3.6M | [vision.imar.ro](http://vision.imar.ro/human3.6m/) | 3.6M frames multi-view |
| 7 | COCO Keypoints | [cocodataset.org](http://cocodataset.org/) | 200K+ images, 17 keypoints |
| 8 | CMU MoCap | [mocap.cs.cmu.edu](http://mocap.cs.cmu.edu/) | Large BVH/C3D database |
| 9 | HumanML3D | — | Text + motion pairs |
| 10 | InterWild | [GitHub](https://github.com/facebookresearch/InterWild) | 3D interacting hands in the wild |

### 9T. Protocols & Middleware (4)

| # | Name | URL | Description |
|---|------|-----|-------------|
| 1 | VMC Protocol | [protocol.vmc.info](https://protocol.vmc.info/english.html) | Open mocap data streaming (OSC/UDP), MIT |
| 2 | EVMC4U | [GitHub](https://github.com/gpsnmeajp/EasyVirtualMotionCaptureForUnity) | Unity VMC receiver |
| 3 | libmotioncapture | [GitHub](https://github.com/IMRCLab/libmotioncapture) | C++/Python abstraction over Vicon/OptiTrack/Qualisys/Nokov |
| 4 | NatNet SDK | [optitrack.com](https://optitrack.com/) | OptiTrack streaming protocol |

### 9U. Biomechanics & Sports (5)

| # | Name | URL | Description |
|---|------|-----|-------------|
| 1 | Theia3D | [theiamarkerless.com](https://www.theiamarkerless.com/) | 124 keypoints, <1cm precision |
| 2 | OpenCap (Stanford) | [opencap.ai](https://www.opencap.ai/) | Smartphone → joint angles + muscle forces |
| 3 | Pose2Sim | [GitHub](https://github.com/perfanalytics/pose2sim) | 2D → 3D → OpenSim pipeline |
| 4 | KinaTrax | [kinatrax.com](https://www.kinatrax.com/) | Markerless for baseball/sports |
| 5 | DARI Motion | [darimotion.com](https://darimotion.com/) | FDA-cleared motion analysis |

### 9V. ControlNet / Stable Diffusion Ecosystem (4)

| # | Name | URL | Description |
|---|------|-----|-------------|
| 1 | ControlNet | [GitHub](https://github.com/lllyasviel/ControlNet) | Pose/depth/edge control for diffusion |
| 2 | DWPose (for ControlNet) | [GitHub](https://github.com/IDEA-Research/DWPose) | Whole-body, replaces OpenPose |
| 3 | easy_dwpose | [GitHub](https://github.com/reallyigor/easy_dwpose) | Simple DWPose preprocessor |
| 4 | comfyui_controlnet_aux | [GitHub](https://github.com/Fannovel16/comfyui_controlnet_aux) | ComfyUI preprocessors |

### 9W. Awesome Lists & Curated Resources (8)

| # | Name | URL |
|---|------|-----|
| 1 | awesome-human-pose-estimation (cbsudux) | [GitHub](https://github.com/cbsudux/awesome-human-pose-estimation) |
| 2 | awesome-human-pose-estimation (wangzheallen) | [GitHub](https://github.com/wangzheallen/awesome-human-pose-estimation) |
| 3 | awesome-human-motion | [GitHub](https://github.com/derikon/awesome-human-motion) |
| 4 | awesome-hand-pose-estimation | [GitHub](https://xinghaochen.github.io/awesome-hand-pose-estimation/) |
| 5 | awesome-3d-human-reconstruction | [GitHub](https://github.com/rlczddl/awesome-3d-human-reconstruction) |
| 6 | awesome-text-to-motion | [GitHub](https://github.com/Zilize/awesome-text-to-motion) |
| 7 | VTuber Software List (emilianavt) | [Gist](https://gist.github.com/emilianavt/cbf4d6de6f7fb01a42d4cce922795794) |
| 8 | awesome-biomechanics | [GitHub](https://github.com/modenaxe/awesome-biomechanics) |
