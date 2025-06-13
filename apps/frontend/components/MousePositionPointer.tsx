import { useMouseStore } from "@/store/useMouseStore";
import { MousePointer2 } from "lucide-react";


export default function MousePositionPointer() {
    const MousePositions = useMouseStore((state) => state.mousePositions)
    return (
        <div>


            {Object.entries(MousePositions).map(([userId, { x: width, y: height }]) => {
                return <div
                    key={userId}
                    className="absolute z-40 pointer-events-none flex flex-col items-center"
                    style={{
                        top: height,
                        left: width,
                        
                    }}
                >
                    <MousePointer2
                        className=" text-blue-500"
                        style={{
                            height: "20px",
                            width: "20px",
                        }}
                    />
                    <div 
                            className="bg-blue-500 text-white text-xs px-1 rounded absolute top-5 left-5 whitespace-nowrap"
                        >
                            Anonymous
                        </div>
                </div>


            })
            }

        </div>

    );
}
