import { BaseShape } from "../BaseShape";

export class TextShape extends BaseShape {
  private textContent: string;
  private startX: number;
  private startY: number;
  private maxWidth: number;

  constructor(
    startX: number,
    startY: number,
    color: string,
    lineWidth: number,
    textContent: string = "",
    maxWidth: number = 200
  ) {
    super(color, lineWidth);
    this.startX = startX;
    this.startY = startY;
    this.textContent = textContent;
    this.maxWidth = maxWidth;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = this.getColor();
    ctx.lineWidth = this.getLineWidth();
    ctx.font = `${this.getLineWidth() * 2}px Arial`;
    ctx.fillStyle = this.getColor();
    ctx.fillText(this.textContent, this.startX, this.startY);
    ctx.restore();
  }

  isPointInside(x: number, y: number): boolean {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return false;
    
    ctx.font = `${this.getLineWidth() * 2}px Arial`;
    const metrics = ctx.measureText(this.textContent);
    const height = this.getLineWidth() * 2;
    
    return (
      x >= this.startX &&
      x <= this.startX + metrics.width &&
      y >= this.startY - height &&
      y <= this.startY
    );
  }

  drag(dx: number, dy: number): void {
    this.startX += dx;
    this.startY += dy;
  }

  getBoundingBox(): { x: number; y: number; width: number; height: number } {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return { x: 0, y: 0, width: 0, height: 0 };
    
    ctx.font = `${this.getLineWidth() * 2}px Arial`;
    const metrics = ctx.measureText(this.textContent);
    const height = this.getLineWidth() * 2;
    
    return {
      x: this.startX,
      y: this.startY - height,
      width: metrics.width,
      height: height
    };
  }

  serialize(): any {
    return {
      type: "text",
      textContent: this.textContent,
      startX: this.startX,
      startY: this.startY,
      maxWidth: this.maxWidth,
      color: this.getColor(),
      lineWidth: this.getLineWidth(),
      id: this.getShapeId()
    };
  }

  setText(text: string): void {
    this.textContent = text;
  }

  getText(): string {
    return this.textContent;
  }
} 