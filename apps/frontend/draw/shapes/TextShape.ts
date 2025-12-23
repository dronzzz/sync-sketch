import { BaseShape } from "./BaseShape";
import { TEXT_CONFIG } from "../config/textConfig";


export class TextShape extends BaseShape {
  private textContent: string;
  startX: number;
  startY: number;
  private noOfLines: number;
  private lineHeight: number;
  private fontSize: number;

  constructor(
    startX: number,
    startY: number,
    color: string,
    lineWidth: number,
    textContent: string = "",
    fontSize: number = TEXT_CONFIG.FONT_SIZE,
    id?: string
  ) {
    super(id, color, lineWidth);
    this.startX = startX;
    this.startY = startY;
    this.textContent = textContent;
    this.fontSize = fontSize;
    this.noOfLines = (textContent.match(/\n/g) || []).length + 1;
    this.lineHeight = this.fontSize * TEXT_CONFIG.LINE_HEIGHT;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.font = `${TEXT_CONFIG.FONT_WEIGHT} ${this.fontSize}px ${TEXT_CONFIG.FONT_FAMILY}`;
    const lines = this.textContent.split('\n');
    this.noOfLines = lines.length;
    this.lineHeight = this.fontSize * TEXT_CONFIG.LINE_HEIGHT;

    lines.forEach((line, index) => {
      ctx.fillText(line, this.startX, this.startY + this.fontSize + (index * this.lineHeight));
    });
    ctx.restore();
  }

  drag(dx: number, dy: number): void {
    this.startX += dx;
    this.startY += dy;
  }

  getBounds(): { x: number; y: number; width: number; height: number } {

    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = `${TEXT_CONFIG.FONT_WEIGHT} ${this.fontSize}px ${TEXT_CONFIG.FONT_FAMILY}`;

    const lines = this.textContent.split('\n');

    let maxWidth = 100;
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      if (metrics.width > maxWidth) {
        maxWidth = metrics.width;
      }
    });

    return {
      x: this.startX,
      y: this.startY,
      width: maxWidth,
      height: this.noOfLines * this.lineHeight
    };
  }

  serialize(): any {
    return {
      type: "text",
      textContent: this.textContent,
      startX: this.startX,
      startY: this.startY,
      fontSize: this.fontSize,
      color: this.getColor(),
      lineWidth: this.getLineWidth(),
      id: this.getShapeId()
    };
  }

  setText(newText: string) {
    this.textContent = newText;
    this.noOfLines = (newText.match(/\n/g) || []).length + 1;
    this.lineHeight = this.fontSize * TEXT_CONFIG.LINE_HEIGHT;
  }

  getText(): string {
    return this.textContent;
  }

  getTypography() {
    return {
      fontSize: this.fontSize,
      color: this.color,
      fontWeight: TEXT_CONFIG.FONT_WEIGHT,
      fontFamily: TEXT_CONFIG.FONT_FAMILY,
      noOfLines: this.noOfLines,
      lineHeight: this.lineHeight
    };
  }

  resize(x: number, y: number, width: number, height: number): void {

    const originalHeight = this.noOfLines * this.lineHeight;
    if (originalHeight > 0) {
      const scale = height / originalHeight;
      this.fontSize = Math.max(8, Math.min(200, this.fontSize * scale));
      this.lineHeight = this.fontSize * TEXT_CONFIG.LINE_HEIGHT;
    }

    this.startX = x;
    this.startY = y;
  }
} 