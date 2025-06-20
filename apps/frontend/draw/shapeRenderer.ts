import { Diamond, Ellipse, Line, Pencil, Rect } from "./types";


export class ShapeRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    drawRect(shape: Rect) {
        this.ctx.strokeStyle=shape.color;
        this.ctx.lineWidth=shape.lineWidth;
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }

    drawEllipse(shape: Ellipse) {
        this.ctx.strokeStyle=shape.color;
        this.ctx.lineWidth=shape.lineWidth;
        this.ctx.beginPath();
        this.ctx.ellipse(shape.centerX, shape.centerY, shape.radiusX, shape.radiusY, 0, 0, 2 * Math.PI);
        this.ctx.stroke();

    }

    drawLine(shape: Line) {
        this.ctx.strokeStyle=shape.color;
        this.ctx.lineWidth=shape.lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
    }

    drawPencil(shape: Pencil) {
        this.ctx.lineCap = "round"
        this.ctx.strokeStyle=shape.color;
        this.ctx.lineWidth=shape.lineWidth;
        this.ctx.beginPath()
        this.ctx.moveTo(shape.points[0].x, shape.points[0].y)

        shape.points.forEach((pt) => {
            this.ctx.lineTo(pt.x, pt.y);
        });
        this.ctx.stroke();
    }

    drawDiamond(shape:Diamond){
        this.ctx.beginPath();
        this.ctx.strokeStyle=shape.color;
        this.ctx.lineWidth=shape.lineWidth;
        this.ctx.moveTo(shape.centerX, shape.centerY - shape.radiusY);       
        this.ctx.lineTo(shape.centerX + shape.radiusX, shape.centerY);       
        this.ctx.lineTo(shape.centerX, shape.centerY + shape.radiusY);       
        this.ctx.lineTo(shape.centerX - shape.radiusX, shape.centerY);  
        this.ctx.closePath();
        this.ctx.stroke();
    }




}