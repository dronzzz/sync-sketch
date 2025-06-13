

export interface User{
    rooms:string[],
    userId:string
}
enum reqTypes {
    join_room,
    leave_room,
    chat,
    mouseMovement
}

export interface parsedData {
    type:reqTypes;
    userId : string;
    roomId:string;
    message?:string;
    
}

export interface mouseMovement{
    type:reqTypes;
    userId : string;
    roomId:string;
    x:number;
    y:number;

}