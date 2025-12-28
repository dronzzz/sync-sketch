import { Shape } from "../types";

export abstract class BaseShape {
    protected id: string;
    protected color: string;
    protected lineWidth: number;
    protected version: number;
    protected editedAt: number;
    protected isDeleted: boolean = false;

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

    getIsDeleted(): boolean {
        return this.isDeleted;
    }

    getVersion(): number {
        return this.version;
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

    markAsDeleted(): void {
        this.isDeleted = true;
        this.incrementVersion();
    }

    restore(): void {
        this.isDeleted = false;
        this.incrementVersion();
    }

    setMetadata(version?: number, editedAt?: number, isDeleted?: boolean) {
        if (version !== undefined) this.version = version;
        if (editedAt !== undefined) this.editedAt = editedAt;
        if (isDeleted !== undefined) this.isDeleted = isDeleted;
    }

    protected getMetadata() {
        return {
            id: this.id,
            color: this.color,
            lineWidth: this.lineWidth,
            version: this.version,
            editedAt: this.editedAt,
            isDeleted: this.isDeleted
        };
    }
}