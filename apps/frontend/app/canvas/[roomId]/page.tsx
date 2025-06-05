"use client"
import { useEffect, useRef, useState } from "react"

export default function Canvas (){

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [start, setStart] = useState<{x: number | null, y: number | null}>({
    x: null,
    y: null
});
  
    const [end, setEnd] = useState<{x : number | null, y : number | null}>({
        x:null,
        y:null
    })


    useEffect(()=>{
        if(canvasRef.current){
            const canvas = canvasRef.current;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext('2d')

            if(!ctx) return
            ctx.fillStyle = "#1f1e1a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if(start.x && end.x && end.y && start.y){
                const rectHeight = Number(end.y - start.y)
                const rectWidth = Number(end.x - start.x);
                ctx.strokeRect(start.x,start.y, rectHeight, rectWidth);

            }
            const handleMouseUp = (e:MouseEvent)=>{
               setStart({
                    x:null,
                    y:null
                })
                setEnd({
                    x:null,
                    y:null
                })
               
            }

             const handleMouseDown = (e:MouseEvent)=>{
                setStart({
                    x : e.offsetX,
                    y : e.offsetY

                })
               
            }
             const handleMouseMove = (e:MouseEvent)=>{
                setEnd({
                    x : e.offsetX,
                    y : e.offsetY

                })
               
            }

        



            canvas.addEventListener('mousedown',handleMouseDown)
            canvas.addEventListener('mousemove',handleMouseMove)
            canvas.addEventListener('mouseup',handleMouseUp)
            
            return ()=>{
                canvas.removeEventListener('mousedown',handleMouseDown)
                canvas.removeEventListener('mousemove',handleMouseMove)
                canvas.addEventListener('mouseup',handleMouseUp)
            }

        }
    },[canvasRef])
    
    useEffect(()=>{
          if(canvasRef.current){
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d')

            if(!ctx) return

            if(start.x && end.x && end.y && start.y){
                const rectWidth = Number(end.y - start.y)
                const  rectHeight = Number(end.x - start.x);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "##0d0c09";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "#3d3c3a";
            ctx.lineWidth = 5;
            ctx
                ctx.strokeRect(start.x,start.y, rectHeight, rectWidth);

               

            }
        }
    },[start,end])

    
    return <div>
        <canvas ref={canvasRef} height={1000} width={1000} ></canvas>
    </div>
}