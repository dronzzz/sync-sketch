import { Shape } from "../types";
import { BaseShape } from "./BaseShape";


export class Line extends BaseShape{
    private startX : number;
    private startY : number;
    private endX : number;
    private endY : number;

    constructor(startX: number , startY:number,endX:number,endY:number,color:string,lineWidth:number, id?: string){
        super(id, color, lineWidth);
        this.startX = startX
        this.startY = startY
        this.endX = endX
        this.endY = endY
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle=this.color;
        ctx.lineWidth=this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();
    }

    drag(dx: number, dy: number): void {
    this.startX += dx
      this.startY += dy
      this.endX += dx
      this.endY += dy
        
    }

    getBoundingBox(): { x: number; y: number; width: number; height: number; } {
        const minX = Math.min(this.startX, this.endX);
        const minY = Math.min(this.startY, this.endY);
        const maxX = Math.max(this.startX, this.endX);
        const maxY = Math.max(this.startY, this.endY);
        
        return {
            x: minX - 10,
            y: minY - 10,
            width: maxX - minX + 20,
            height: maxY - minY + 20
        };
    }

    serialize(): Shape {
        return{
            type:'line',
            startX:this.startX,
            startY:this.startY,
            endX:this.endX,
            endY:this.endY,
            id: this.getShapeId(),
            color:this.getColor(),
            lineWidth:this.getLineWidth()
        }
    }
}