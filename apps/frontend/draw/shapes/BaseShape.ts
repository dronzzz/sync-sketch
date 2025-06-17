import { Shape } from "../types";

export abstract class BaseShape {
    protected id: string;
    protected color: string;
    protected lineWidth: number;

    constructor(id: string | undefined, color: string, lineWidth: number) {
        this.id = id ?? crypto.randomUUID();
        this.color = color;
        this.lineWidth = lineWidth;
    }
    getShapeId():string{
        return this.id;
    }

    getColor():string{
        return this.color;
    }

    getLineWidth():number{
        return this.lineWidth;
    }
    abstract drag(dx: number, dy: number): void;
    abstract getBounds(): { x: number, y: number, width: number, height: number };
    abstract draw(ctx: CanvasRenderingContext2D): void;
    abstract serialize() : Shape
    abstract resize(x:number, y: number,width:number,height:number):void
}