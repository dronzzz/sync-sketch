import { Shape } from "../types";
import { BaseShape } from "./BaseShape";

export class Pencil extends BaseShape{
    private points:{x:number,y:number}[]

    constructor(points: {x: number, y: number}[], color: string, lineWidth: number, id?: string) {
        super(id, color, lineWidth);
        this.points = points;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath()
        ctx.moveTo(this.points[0].x,this.points[0].y)
        this.points.forEach(pt => {
            ctx.lineTo(pt.x , pt.y)
            
        });
        ctx.stroke();
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
            width: maxX - minX ,
            height: maxY - minY 
        };
    }

    serialize(): Shape {
        return{
            type:'pencil',
            points:this.points,
            id: this.getShapeId(),
            color:this.getColor(),
            lineWidth:this.getLineWidth()
        }
    }

    resize(x: number, y: number, width: number, height: number): void {
        
    }
}