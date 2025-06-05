"use client";

import { useEffect, useState } from "react";
import useSocket from "../hooks/useSocket";

export default function ChatRoomClient({roomId,messages}:{
    roomId:string,
    messages:{message:string}[];
}) {
    const [chats , setChats] = useState(messages);
    const {socket,loading} = useSocket();
    const [currentMessage, setCurrentMessage] = useState('')

    useEffect(()=>{
        if(socket && !loading){
            socket.send(JSON.stringify({
                type : "join_room",
                roomId,
             
            }))
console.log(chats)
            socket.onmessage = (event) =>{
                const parsedData = JSON.parse(event.data);

                if(parsedData.type === "chat"){
                    setChats(c=> [...c,{message: parsedData.message}])
                }
            }



        }
    },[socket,loading])
  return (


    <div>
        {chats.map(m => <div key={crypto.randomUUID()}>{m.message}</div>)}

        <div>
            <input type="text" value={currentMessage} onChange={(e) => {
                setCurrentMessage(e.target.value);
            }} />
            <button onClick={()=>{
                socket?.send(JSON.stringify({
                    type:"chat",
                    message : currentMessage,
                    roomId,
                     
                }))
                setCurrentMessage("");}
            }>send message</button>
        </div>
      
    </div>
  )
}
