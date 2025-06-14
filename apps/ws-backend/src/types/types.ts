

export interface User{
    rooms:string[],
    userId:string
}
enum reqTypes {
    join_room,
    leave_room,
    chat,
    mouseMovement,
}

export interface parsedData {
    type:reqTypes;
    userId : string;
    roomId:string;
    shapeId:string;
    shapeType?:string
    message?:string;
    
}

export interface mouseMovement{
    type:reqTypes;
    userId : string;
    roomId:string;
    x:number;
    y:number;

}


export interface previewShape extends parsedData{
    previewType : string;
}
