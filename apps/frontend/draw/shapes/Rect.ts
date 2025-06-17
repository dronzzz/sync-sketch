import { BaseShape } from "./BaseShape";

export class Rect extends BaseShape{
    private x : number
    private y : number
    private width : number
    private height : number

    constructor(x: number, y: number, width: number, height: number, color: string, lineWidth: number, id?: string) {
        super(id, color, lineWidth);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
    }

    draw(ctx: CanvasRenderingContext2D): void {

            ctx.strokeStyle= this.color;
            ctx.lineWidth= this.lineWidth;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        
    }

    drag(dx: number, dy: number): void {
        this.x +=dx
        this.y += dy
    }


    getBounds(): { x: number; y: number; width: number; height: number; } {
         return {
            x: this.x ,
            y: this.y ,
            width: this.width,
            height: this.height
        };
    }

    serialize(): any {
        return {
            type: 'rect',
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            color: this.getColor(),
            lineWidth: this.getLineWidth(),
            id: this.getShapeId()
        };
    }

    resize(x: number, y: number, width: number, height: number): void {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}