import { Shape } from "../types";
import { BaseShape } from "./BaseShape";

export class Diamond extends BaseShape{
    private centerX:number;
    private centerY:number;
    private radiusX:number;
    private radiusY:number;




    constructor(centerX:number,centerY:number,radiusX:number,radiusY:number,color:string,lineWidth:number,id?:string){
        super(id,color,lineWidth)
        this.centerX = centerX;
        this.centerY = centerY;
        this.radiusX = radiusX;
        this.radiusY = radiusY;
        
    }

    draw(ctx:CanvasRenderingContext2D):void{

        ctx.beginPath();
        ctx.strokeStyle=this.color;
        ctx.lineWidth=this.lineWidth;
        ctx.moveTo(this.centerX, this.centerY);       
        ctx.lineTo(this.centerX + this.radiusX, this.centerY + this.radiusY);       
        ctx.lineTo(this.centerX , this.centerY + 2 * this.radiusY);       
        ctx.lineTo(this.centerX - this.radiusX, this.centerY + this.radiusY);  
        ctx.closePath();
        ctx.stroke();
    }

    drag(dx:number,dy:number):void{
        this.centerX += dx;
        this.centerY += dy;
    }

    getBounds(): { x: number; y: number; width: number; height: number; } {
        return{
            x:Math.abs(this.radiusX- this.centerX),
            y:this.centerY,
            width:this.radiusX * 2,
            height:this.radiusY * 2
        }
        
    }

    resize(x: number, y: number, width: number, height: number): void {
        this.centerX = x + width/2;
        this.centerY = y + height/2;
        this.radiusX = width/2;
        this.radiusY= height/2;
    }

    serialize(): Shape {
        return{
            type:'diamond',
            centerX:this.centerX,
            centerY:this.centerY,
            radiusX:this.radiusX,
            radiusY:this.radiusY,
            id: this.getShapeId(),
            color:this.getColor(),
            lineWidth:this.getLineWidth()
        }
    }


    
}