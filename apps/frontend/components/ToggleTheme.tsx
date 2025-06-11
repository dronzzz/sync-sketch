import { Moon, Sun } from "lucide-react";
import { IconButton } from "./IconButton";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";




export const ToggleTheme = () => {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme, resolvedTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const currentTheme = resolvedTheme || theme;

    return <div className="top-5 right-5 absolute dark:bg-[#1a1a1a] rounded-xl pointer shadow-even">
       {currentTheme === 'dark' ? (
                    <IconButton 
                        icon={<Sun className="w-4 h-4 md:w-6 md:h-6" />} 
                        onClick={() => setTheme('light')}
                        className="p-2 md:p-3"
                    />
                ) : (
                    <IconButton 
                        icon={<Moon className="w-4 h-4 md:w-6 md:h-6" />} 
                        onClick={() => setTheme('dark')}
                        className="p-2 md:p-3"
                    />
                )}

    </div>


}