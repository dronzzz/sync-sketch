
export type Shape = Rect | Ellipse | Line | Pencil | TextInput ;
export type NormalizedShape = NormalizedRect | NormalizedEllipse | NormalizedLine | NormalizedPencil | NormalizedTextInput ;

interface baseShape {
    type: string;
    id? :string;
    color:string;
    lineWidth: number;

}

export interface Rect extends baseShape {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Ellipse extends baseShape {
    type: "ellipse";
    centerX: number;    
    centerY: number;    
    radiusX: number;    
    radiusY: number;   
    // rotation: number;
    // startAngle: number;
    // endAngle: any;
};

export interface Line extends baseShape {
    type : "line";
    startX : number;  
    startY : number;   
    endX : number;
    endY : number;

}

export interface Pencil extends baseShape{
    type:"pencil",
    points:{x:number , y:number}[]


}

export interface TextInput extends baseShape {
    type: "text",
    textContent : string;
    startX : number;   //startX
    startY: number;    //startY
    maxWidth : number;
    font?:number; 
}


export interface NormalizedRect extends Rect{}

export interface NormalizedEllipse extends baseShape {
    type: "ellipse";
    x: number;       // centerX  
    y: number;       // centerY  
    width: number;   // radiusX * 2
    height: number;  // radiusY * 2
}

export interface NormalizedLine extends baseShape {
    type: "line";
    x: number;  // startX  
    y: number;  // startY  
    width: number;    // endX  =  startX+width
    height: number;    // endY = startY + height  
}

export interface NormalizedPencil extends Pencil {}
export interface NormalizedTextInput extends baseShape {
    type: "text";
    textContent: string; 
    x: number;       // startX  
    y: number;       // startY  
    maxWidth: number; 
    font?: number;
}