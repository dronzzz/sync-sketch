import { Moon, Sun } from "lucide-react";
import { IconButton } from "./IconButton";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";




export const ToggleTheme = () => {
    const [mounted, setMounted] = useState(false)
    const { setTheme, resolvedTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null


    const isDark = resolvedTheme === "dark";

    return <div className="top-5 right-5 absolute dark:bg-[#1a1a1a] rounded-xl pointer shadow-even">

        <IconButton
            onClick={() => setTheme(isDark ? "light" : "dark")}
            icon={isDark ? <Sun className="w-4 h-4 " /> : <Moon className="w-4 h-4 " />}
            className="p-2 md:p-3"
        />

    </div>


}