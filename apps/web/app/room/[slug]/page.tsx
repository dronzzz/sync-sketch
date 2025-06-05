import React from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../../config';
import {ChatRoom} from '../../../components/ChatRoom';


const getRoomId = async(slug:string)=>{
  const response = await axios.get(`${BACKEND_URL}/room/${slug}`);

  return response.data.roomId.id;


}
export default async function  ChatRoom1({params}:{params: Promise<{ slug: string }>}){
  const { slug } = await params;

  const roomId = await getRoomId(slug);


 
  return (
   <ChatRoom  id={roomId} />
  )
}
