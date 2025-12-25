import { Shape } from "../types";

export abstract class BaseShape {
    protected id: string;
    protected color: string;
    protected lineWidth: number;
    protected version: number;
    protected editedAt: number;

    constructor(id: string | undefined, color: string, lineWidth: number) {
        this.id = id ?? crypto.randomUUID();
        this.color = color;
        this.lineWidth = lineWidth;
        this.version = 0;
        this.editedAt = Date.now();
    }
    getShapeId(): string {
        return this.id;
    }

    getColor(): string {
        return this.color;
    }

    setColor(color: string) {
        this.color = color;
    }

    getLineWidth(): number {
        return this.lineWidth;
    }
    abstract drag(dx: number, dy: number): void;
    abstract getBounds(): { x: number, y: number, width: number, height: number };
    abstract draw(ctx: CanvasRenderingContext2D): void;
    abstract serialize(): Shape
    abstract resize(x: number, y: number, width: number, height: number): void

    incrementVersion(): void {
        this.version++;
        this.editedAt = Date.now();
    }
}