import { Shape } from "../types";
import { BaseShape } from "./BaseShape";
import { getStroke } from "perfect-freehand";
export class Pencil extends BaseShape {
    private points: { x: number, y: number }[]

    constructor(points: { x: number, y: number }[], color: string, lineWidth: number, id?: string) {
        super(id, color, lineWidth);
        this.points = points;
    }



    draw(ctx: CanvasRenderingContext2D): void {
        const points = this.points.map(p => [p.x, p.y]);


        const stroke = getStroke(points, {
            size: this.lineWidth * 2,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
            easing: t => t
        });

        const path = new Path2D();
        if (stroke.length > 0) {
            path.moveTo(stroke[0][0], stroke[0][1]);
            stroke.forEach(([x, y]) => path.lineTo(x, y));
        }

        ctx.fillStyle = this.color;
        ctx.fill(path);
    }


    addPoint(x: number, y: number): void {
        this.points.push({ x, y });
    }


    drag(dx: number, dy: number): void {
        this.points.forEach(pt => {
            pt.x += dx;
            pt.y += dy;
        });
    }



    getBounds(): { x: number; y: number; width: number; height: number; } {
        const xs = this.points.map(p => p.x);
        const ys = this.points.map(p => p.y);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    serialize(): Shape {
        return {
            type: 'pencil',
            points: this.points,
            id: this.getShapeId(),
            color: this.getColor(),
            lineWidth: this.getLineWidth()
        }
    }

    resize(x: number, y: number, width: number, height: number): void {

    }
}