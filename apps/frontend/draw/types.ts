
export type Shape = Rect | Ellipse | Line | Pencil | TextInput | Diamond ;

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



export interface Diamond extends baseShape {
    type: "diamond";
    centerX: number;    
    centerY: number;    
    radiusX: number;    
    radiusY: number;   
}