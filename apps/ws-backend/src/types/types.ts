

export interface User{
    rooms:string[],
    userId:string
}
enum reqTypes {
    join_room,
    leave_room,
    chat
}

export interface parsedData {
    type:reqTypes;
    userId : string;
    roomId:string;
    message?:string;
    
}