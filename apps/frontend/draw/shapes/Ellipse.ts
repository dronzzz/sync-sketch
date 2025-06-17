import { randomUUID } from "crypto";
import { BaseShape } from "./BaseShape";
import { Shape } from "../types";

export class Ellipse extends BaseShape{
    private centerX : number;
    private centerY : number;
    private radiusX : number;
    private radiusY : number;

    constructor(centerX:number,centerY:number,radiusX:number,radiusY:number,color:string,lineWidth:number, id?: string){
        super(id, color, lineWidth);
        this.centerX = centerX;
        this.centerY =centerY;
        this.radiusX = radiusX;
        this.radiusY = radiusY;
    }

    draw(ctx: CanvasRenderingContext2D): void {
          ctx.strokeStyle=this.color;
        ctx.lineWidth=this.lineWidth;
        ctx.beginPath();
        ctx.ellipse(this.centerX, this.centerY, this.radiusX, this.radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
    }

    drag(dx: number, dy: number): void {
        this.centerX += dx;
        this.centerY += dy;
    }

    getBounds(): { x: number; y: number; width: number; height: number; } {
          return {
            x: this.centerX - this.radiusX ,
            y: this.centerY - this.radiusY ,
            width: this.radiusX * 2,
            height: this.radiusY * 2
        };
    }
    serialize(): Shape {
        return{
            type:'ellipse',
            centerX:this.centerX,
            centerY:this.centerY,
            radiusX:this.radiusX,
            radiusY:this.radiusY,
            id: this.getShapeId(),
            color:this.getColor(),
            lineWidth:this.getLineWidth()
        }
    }

    resize(x: number, y: number, width: number, height: number): void {
        this.centerX = x + (width / 2);
        this.centerY = y + (height / 2);
        this.radiusX = Math.abs(width) / 2;
        this.radiusY = Math.abs(height) / 2;
    }
}