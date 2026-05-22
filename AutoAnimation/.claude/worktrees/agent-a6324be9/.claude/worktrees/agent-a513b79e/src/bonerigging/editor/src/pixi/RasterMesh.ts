import { Container, MeshSimple, Texture } from 'pixi.js';
import type { MeshData } from '@bonerigging/core';
import type { Transform, Vec2 } from '@bonerigging/core';

export class RasterMesh {
  private container: Container;
  private mesh: MeshSimple | null = null;
  private texture: Texture | null = null;
  private positionBuffer: Float32Array = new Float32Array(0);
  private uvBuffer: Float32Array = new Float32Array(0);
  private indexBuffer: Uint32Array = new Uint32Array(0);
  private currentImage: HTMLImageElement | null = null;
  /** When true, a composited texture from updateTextureFromSource is active.
   *  ensureTexture must NOT overwrite it with the original image. */
  private hasCompositedTexture = false;

  constructor(parent: Container) {
    this.container = parent;
  }

  private ensureTexture(image: HTMLImageElement): void {
    // Skip if a composited texture (from updateTextureFromSource) is active —
    // renderFrame passes the original image which would overwrite the composite.
    if (this.hasCompositedTexture && this.texture) return;
    if (this.currentImage === image && this.texture) return;
    if (this.texture) this.texture.destroy(true);
    this.texture = Texture.from(image);
    this.currentImage = image;
    this.hasCompositedTexture = false;
    // Rebuild mesh if buffers exist
    if (this.positionBuffer.length > 0) {
      this.rebuildMesh();
    }
  }

  uploadMesh(meshData: MeshData): void {
    const nVerts = meshData.vertices.length;
    const nTris = meshData.triangles.length;

    // UV buffer (static)
    this.uvBuffer = new Float32Array(nVerts * 2);
    for (let i = 0; i < nVerts; i++) {
      this.uvBuffer[i * 2] = meshData.uvs[i].u;
      this.uvBuffer[i * 2 + 1] = meshData.uvs[i].v;
    }

    // Index buffer (static)
    this.indexBuffer = new Uint32Array(nTris * 3);
    for (let i = 0; i < nTris; i++) {
      this.indexBuffer[i * 3] = meshData.triangles[i].v0;
      this.indexBuffer[i * 3 + 1] = meshData.triangles[i].v1;
      this.indexBuffer[i * 3 + 2] = meshData.triangles[i].v2;
    }

    // Position buffer (dynamic, updated each frame)
    this.positionBuffer = new Float32Array(nVerts * 2);

    this.rebuildMesh();
  }

  private rebuildMesh(): void {
    // Remove old mesh
    if (this.mesh) {
      this.container.removeChild(this.mesh);
      this.mesh.destroy();
      this.mesh = null;
    }

    if (!this.texture || this.positionBuffer.length === 0) return;

    this.mesh = new MeshSimple({
      texture: this.texture,
      vertices: this.positionBuffer,
      uvs: this.uvBuffer,
      indices: this.indexBuffer,
    });
    this.container.addChild(this.mesh);
  }

  updatePositions(deformedPositions: Vec2[], transform: Transform): void {
    const s = transform.scale;
    const ox = transform.offsetX;
    const oy = transform.offsetY;
    const n = Math.min(deformedPositions.length, this.positionBuffer.length / 2);

    for (let i = 0; i < n; i++) {
      this.positionBuffer[i * 2] = deformedPositions[i].x * s + ox;
      this.positionBuffer[i * 2 + 1] = deformedPositions[i].y * s + oy;
    }
  }

  render(meshData: MeshData, deformedPositions: Vec2[], transform: Transform, image: HTMLImageElement): void {
    this.ensureTexture(image);

    // Re-upload mesh if vertex count changed
    if (this.positionBuffer.length !== meshData.vertices.length * 2) {
      this.uploadMesh(meshData);
    }

    this.updatePositions(deformedPositions, transform);
  }

  /**
   * Replace the mesh texture from an arbitrary image source (canvas, img, video).
   * Used for dynamic face re-compositing on the main canvas.
   */
  updateTextureFromSource(source: TexImageSource): void {
    // Draw source onto a temporary canvas so PixiJS can create a texture from it
    const sw = (source as HTMLCanvasElement).width
      ?? (source as HTMLImageElement).naturalWidth
      ?? (source as HTMLVideoElement).videoWidth
      ?? 256;
    const sh = (source as HTMLCanvasElement).height
      ?? (source as HTMLImageElement).naturalHeight
      ?? (source as HTMLVideoElement).videoHeight
      ?? 256;
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = sw;
    tmpCanvas.height = sh;
    const ctx = tmpCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(source as CanvasImageSource, 0, 0);

    // Destroy old texture and create new one
    if (this.texture) this.texture.destroy(true);
    this.texture = Texture.from(tmpCanvas);
    this.currentImage = null; // invalidate cache since source is not an HTMLImageElement
    this.hasCompositedTexture = true;

    // Rebuild mesh with new texture
    if (this.positionBuffer.length > 0) {
      this.rebuildMesh();
    }
  }

  destroy(): void {
    if (this.mesh) {
      this.mesh.destroy();
    }
    if (this.texture) {
      this.texture.destroy(true);
    }
  }
}
