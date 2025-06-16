
import jwt from 'jsonwebtoken';
import { WebSocketServer, WebSocket } from 'ws';
import { handleChat, handleJoinRoom, handleLeaveRoom, handleMouseMovement, handleShapePreview, handleShapeUpdate, removeUserFromRoom } from './handlers';
import { JWT_SECRET } from '@repo/backend-common/config';


export interface ClientSession{
    sessionId : string;
    userId : string;
    ws : WebSocket;
}

export class SocketServer{
    private static instance: SocketServer;
    private wss:WebSocketServer;
    public socketMap:Map<string,WebSocket> = new Map();
    private sessions: Map<string,ClientSession> = new Map();
    private userSessions: Map<string,Set<string>> = new Map();


    
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
    private cleanUpSession = (sessionId:string) =>{
        const session = this.sessions.get(sessionId)
        if(!session) return;

        this.sessions.delete(sessionId)
        const userSessions = this.userSessions.get(session.userId);
        if(userSessions){
            userSessions.delete(sessionId)
            if (userSessions.size === 0) {
                this.userSessions.delete(session.userId);
                removeUserFromRoom(session.userId,sessionId)
            }

        }
    }

    private heartBeat = (sessionId:string) =>{
        const session = this.sessions.get(sessionId);
        if(!session) return;

        const pingInterval = setInterval(()=>{
            if(session?.ws.readyState === WebSocket.OPEN){
                session.ws.ping();
            }else{
                this.cleanUpSession(sessionId);
                clearInterval(pingInterval)

            }

        },30000)
        session.ws.on('pong', () => {
            
        });
    }

    private handleConnection =(ws:WebSocket, request:any)=>{
        const url = request.url;
        if (!url) {
        return
        }

        const queryParam = new URLSearchParams(url.split("?")[1]);
        const token = queryParam.get('token') || "";

        const userId = this.checkUser(token);
        if (userId == null) {
        ws.close();
        return;
        }

        const sessionId = crypto.randomUUID();
        const session : ClientSession = {
            sessionId,
            userId,
            ws
        }
        this.sessions.set(sessionId,session)

        if(!this.userSessions.has(userId)){
            this.userSessions.set(userId,new Set())
        }
        this.userSessions.get(userId)?.add(sessionId);

        ws.send(JSON.stringify({
            type: "session-init",
            sessionId
        }));

        this.heartBeat(sessionId)
        console.log('setting sesssion id as -----------------------------',sessionId)
        
        ws.on('error', console.error);
        ws.on('message',(data)=> this.handleMessage(data,userId,sessionId));
        ws.on('close',(data) =>this.handleClose(ws,userId))

    }

    private handleClose=(ws:WebSocket,userId:string)=>{
        this.socketMap.delete(userId)
        ws.close();
    }

    private handleMessage = (data: any,userId:string,sessionId:string)=>{   //Websocket.Rawdata giving error 
    let parsedData;
    const session = this.sessions.get(sessionId);
    if(!session)return

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
    if(parsedData.type !== "mouseMovement"){
        console.log('handlemessage" ' , parsedData)

    }


        switch (parsedData.type) {
            case 'join_room':
                handleJoinRoom(userId,parsedData)
                break;
            case 'leave_room':
                handleLeaveRoom(userId,parsedData)
                break;
            case 'chat':
                handleChat(userId,this.sessions,this.userSessions,parsedData,sessionId)
                break;
            case 'mouseMovement':
                handleMouseMovement(userId,this.sessions,this.userSessions,parsedData,sessionId)
                break;
            case 'shapeUpdate':
                handleShapeUpdate(userId,this.sessions,this.userSessions,parsedData,sessionId)
                break;
            case 'shapePreview':
                handleShapePreview(userId,this.sessions,this.userSessions,parsedData,sessionId)
                break;
        
            default:
                break;
        }
    }

}