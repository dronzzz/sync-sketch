
export type Shape = Rect | Ellipse | Line | Pencil ;



export interface Rect {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Ellipse {
    type: "ellipse";
    centerX: number;
    centerY: number;
    radiusX: number;
    radiusY: number;
    // rotation: number;
    // startAngle: number;
    // endAngle: any;
};

export interface Line {
    type : "line";
    startX : number;
    startY : number;
    endX : number;
    endY : number;
}

export interface Pencil{
    type:"pencil",
    points:{x:number , y:number}[]

}

