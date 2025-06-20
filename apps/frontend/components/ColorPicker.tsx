"use client"
export type Color = {
    hex: string;

};
const colors = [
    { hex: "#4A4A4A" },
    { hex: "#ef9292" },
    { hex: "#92ee92" },
    { hex: "#9b9bfd" },
    { hex: "#fefe9c" },
    { hex: "#fd9bfc" },
    { hex: "#9cfefe" },
    { hex: "#fefefe" },
]
export default function ColorPicker({
    setSelectedColor,
}: {

    setSelectedColor: (color: Color) => void;
}) {
    return (
      
        <div
            className="flex flex-row cursor-pointer absolute bottom-18 right-29.5 sm:bottom-18 sm:right-15 rounded-md dark:bg-[#1a1a1a] shadow-even"
>
            {colors.map((color) => (
                <div
                    key={color.hex}
                    className="w-4 h-4 m-2 rounded-full hover:scale-120 "
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setSelectedColor(color)}
                />
            ))}
        </div>
    );
}

