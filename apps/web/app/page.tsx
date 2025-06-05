"use client"


import { useRouter } from "next/navigation";
import { useState } from "react";



export default function Home() {
  const [slug ,setSlug] = useState('');
  const router  = useRouter();
  
  return (
    <div className="flex w-screen h-screen justify-center items-center">
      
      <div>
        <input className=" border p-5 bg-slate-800 rounded-sm" type="text" onChange={(e)=> setSlug(e.target.value)} />
      </div>
      <div>
        <button className="border p-5 bg-slate-800" onClick={()=>{

          router.push(`/room/${slug}`)}
        }
        >Join Room </button>
        </div>
        
    </div>
  );
}
