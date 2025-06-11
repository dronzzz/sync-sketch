import { ThemeProvider as NextThemesProvider } from 'next-themes'
export function Providers({ children }: { children: React.ReactNode }) {
    return (

        <NextThemesProvider  attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div suppressHydrationWarning>
        {children}
      </div>
       
        </NextThemesProvider>

    )
}