
export type Shape = Rect | Ellipse | Line | Pencil  ;



export interface Rect {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    color:string;
    lineWidth?: number
    id? :string;
}

export interface Ellipse {
    type: "ellipse";
    centerX: number;
    centerY: number;
    radiusX: number;
    radiusY: number;
    color:string;
    lineWidth?: number

    id?:string;

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
    color:string;
    id? :string;
    lineWidth?: number



}

export interface Pencil{
    type:"pencil",
    points:{x:number , y:number}[]
    color:string;
    id? :string;
    lineWidth?: number


}

export interface TextInput {
    type: "text",
    textContent : string;
    startX : number;
    startY: number;
    maxWidth : number;
    font?:number;
    color?:number;
    lineWidth?: number
    
}