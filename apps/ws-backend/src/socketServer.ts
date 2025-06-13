
import jwt from 'jsonwebtoken';
import { WebSocketServer, WebSocket } from 'ws';
import { handleChat, handleJoinRoom, handleLeaveRoom, handleMouseMovement } from './handlers';
import { parsedData } from './types/types';
import { JWT_SECRET } from '@repo/backend-common/config';


export class SocketServer{
    private static instance: SocketServer;
    private wss:WebSocketServer;


    
    private constructor(){
        this.wss = new WebSocketServer({ port: 8080 });
        this.wss.on('connection',this.handleConnection);
    }

    public static getInstance(){
        if(!SocketServer.instance){
            SocketServer.instance = new SocketServer();
        }
        return SocketServer.instance

    }
    public socketMap:Map<string,WebSocket> = new Map();

    private checkUser = (token:string) =>{
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (typeof decoded == "string") {
            return null
            }
            if (!decoded || !decoded.userId) {
            return null;
            }
            return decoded.userId;
        } catch (error) {
            return null;
        }

    }

    private handleConnection =(ws:WebSocket, request:any)=>{
        const url = request.url;
        if (!url) {
        return
        }

        const queryParam = new URLSearchParams(url.split("?")[1]);
        const token = queryParam.get('token') || "";

        const userId = this.checkUser(token);
        this.socketMap.set(userId,ws);
        if (userId == null) {
        ws.close();
        return;
        }
        ws.on('error', console.error);
        ws.on('message',(data)=> this.handleMessage(data,userId,this.socketMap));
        ws.on('close',(data) =>this.handleClose(ws,userId))

    }

    private handleClose=(ws:WebSocket,userId:string)=>{
        this.socketMap.delete(userId)
        ws.close();
    }

    private handleMessage = (data: any,userId:string,socketMap:Map<string,any>) =>{   //Websocket.Rawdata giving error 
    let parsedData;

    try {
        
        
        if (typeof data !== "string") {
            parsedData = JSON.parse(data.toString())
        } else {
            parsedData = JSON.parse(data); // {type: "join-room", roomId: 1}
        }
        
    } catch (err) {
         console.error("Invalid JSON received:", data, err);
        return;
        
    }


        switch (parsedData.type) {
            case 'join_room':
                handleJoinRoom(userId,parsedData)
                break;
            case 'leave_room':
                handleLeaveRoom(userId,parsedData)
                break;
            case 'chat':
                handleChat(userId,socketMap,parsedData)
                break;
            case 'mouseMovement':
                handleMouseMovement(userId,socketMap,parsedData)
                break;
        
            default:
                break;
        }
    }

}