import { Shape } from "../types";
import { BaseShape } from "./BaseShape";

export class Arrow extends BaseShape {
    private startX: number;
    private startY: number;
    private endX: number;
    private endY: number;

    constructor(startX: number, startY: number, endX: number, endY: number, color: string, lineWidth: number, id?: string) {
        super(id, color, lineWidth);
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();

        // Draw only the two lines for the arrowhead
        const headlen = 15;
        const dx = this.endX - this.startX;
        const dy = this.endY - this.startY;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(this.endX, this.endY);
        ctx.lineTo(
            this.endX - headlen * Math.cos(angle - Math.PI / 6),
            this.endY - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(this.endX, this.endY);
        ctx.lineTo(
            this.endX - headlen * Math.cos(angle + Math.PI / 6),
            this.endY - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        ctx.restore();
    }

    drag(dx: number, dy: number): void {
        this.startX += dx;
        this.startY += dy;
        this.endX += dx;
        this.endY += dy;
    }

    getBounds(): { x: number; y: number; width: number; height: number; } {
        return {
            x: this.startX,
            y: this.startY,
            width: this.endX - this.startX,
            height: this.endY - this.startY
        };
    }

    resize(x: number, y: number, width: number, height: number): void {
        this.startX = x;
        this.startY = y;
        this.endX = x + width;
        this.endY = y + height;
    }

    serialize() {
        return {
            type: 'arrow',
            startX: this.startX,
            startY: this.startY,
            endX: this.endX,
            endY: this.endY,
            ...this.getMetadata()
        };
    }
}