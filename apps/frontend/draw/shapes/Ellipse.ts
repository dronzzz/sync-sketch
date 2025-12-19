import { BaseShape } from "./BaseShape";
import { Shape } from "../types";

export class Ellipse extends BaseShape {
    private x: number;
    private y: number;
    private width: number;
    private height: number;

    constructor(centerX: number, centerY: number, radiusX: number, radiusY: number, color: string, lineWidth: number, id?: string) {
        super(id, color, lineWidth);
        this.x = centerX - radiusX;
        this.y = centerY - radiusY;
        this.width = radiusX * 2;
        this.height = radiusY * 2;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radiusX = Math.abs(this.width / 2);
        const radiusY = Math.abs(this.height / 2);
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
    }

    drag(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
    }

    getBounds(): { x: number; y: number; width: number; height: number; } {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    serialize(): Shape {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radiusX = Math.abs(this.width / 2);
        const radiusY = Math.abs(this.height / 2);
        return {
            type: 'ellipse',
            centerX: centerX,
            centerY: centerY,
            radiusX: radiusX,
            radiusY: radiusY,
            id: this.getShapeId(),
            color: this.getColor(),
            lineWidth: this.getLineWidth()
        }
    }

    resize(x: number, y: number, width: number, height: number): void {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}