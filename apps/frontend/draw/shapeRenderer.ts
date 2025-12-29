import { Diamond, Ellipse, Line, Pencil, Rect, Arrow } from "./types";
import { TEXT_CONFIG } from "./config/textConfig";


export class ShapeRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    drawRect(shape: Rect) {
        this.ctx.strokeStyle = shape.color;
        this.ctx.lineWidth = shape.lineWidth;
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }

    drawEllipse(shape: Ellipse) {
        this.ctx.strokeStyle = shape.color;
        this.ctx.lineWidth = shape.lineWidth;
        this.ctx.beginPath();
        this.ctx.ellipse(shape.centerX, shape.centerY, shape.radiusX, shape.radiusY, 0, 0, 2 * Math.PI);
        this.ctx.stroke();

    }

    drawLine(shape: Line) {
        this.ctx.strokeStyle = shape.color;
        this.ctx.lineWidth = shape.lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
    }

    drawPencil(shape: Pencil) {
        this.ctx.lineCap = "round"
        this.ctx.strokeStyle = shape.color;
        this.ctx.lineWidth = shape.lineWidth;
        this.ctx.beginPath()
        this.ctx.moveTo(shape.points[0].x, shape.points[0].y)

        shape.points.forEach((pt) => {
            this.ctx.lineTo(pt.x, pt.y);
        });
        this.ctx.stroke();
    }

    drawDiamond(shape: Diamond) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = shape.color;
        this.ctx.lineWidth = shape.lineWidth;
        this.ctx.moveTo(shape.centerX, shape.centerY - shape.radiusY);
        this.ctx.lineTo(shape.centerX + shape.radiusX, shape.centerY);
        this.ctx.lineTo(shape.centerX, shape.centerY + shape.radiusY);
        this.ctx.lineTo(shape.centerX - shape.radiusX, shape.centerY);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    drawArrow(shape: Arrow) {
        this.ctx.strokeStyle = shape.color;
        this.ctx.lineWidth = shape.lineWidth;
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();


    }

    drawText(shape: any) {
        this.ctx.save();
        this.ctx.fillStyle = shape.color;
        const fontSize = shape.fontSize || TEXT_CONFIG.FONT_SIZE;
        this.ctx.font = `${TEXT_CONFIG.FONT_WEIGHT} ${fontSize}px ${TEXT_CONFIG.FONT_FAMILY}`;
        (this.ctx as any).letterSpacing = TEXT_CONFIG.LETTER_SPACING;
        const lines = shape.textContent.split('\n');
        const lineHeight = fontSize * TEXT_CONFIG.LINE_HEIGHT;

        lines.forEach((line: string, index: number) => {
            this.ctx.fillText(line, shape.startX, shape.startY + fontSize + (index * lineHeight));
        });
        this.ctx.restore();
    }



}