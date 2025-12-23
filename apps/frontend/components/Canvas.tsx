"use client"

import { useEffect, useState, useRef } from "react";
import { Game } from "@/draw/game";
import { useWindowSize } from "@/hooks/useWindowSize";
import { Color } from "react-color";
import ToolBar from "./ToolBar";
import { useCursorType } from "@/store/useMouseStore";
import { useTheme } from "next-themes";
import MousePositionPointer from "./MousePositionPointer";
import { ToggleTheme } from "./ToggleTheme";
import { ShareButton } from "./ShareButton";
import { UndoRedoButton } from "./UndoRedoButton";
import { ShareDialog } from "./ShareDialog";
import { TEXT_CONFIG } from "@/draw/config/textConfig";


export type Tool = "rect" | "ellipse" | "line" | "pencil" | "pointer" | "panTool" | "text" | "diamond" | "arrow" | "eraser";

export default function Canvas({ roomId, setRoomId, socket, loading, sessionId }: { roomId?: string, setRoomId: (Id: string | undefined) => void, socket: WebSocket | null, loading: boolean, sessionId: string | null }) {
    const [selectedTool, setSelectedTool] = useState<Tool>('pointer');
    const [selectedColor, setSelectedColor] = useState<Color>({ hex: "#d3d3d3" });
    const windowSize = useWindowSize();
    const [game, setGame] = useState<Game | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { resolvedTheme } = useTheme();
    const cursorType = useCursorType((state) => state.cursorType);
    const isOnline = !!(roomId && socket && sessionId);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | undefined>(undefined);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const [textPosition, setTextPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
    const [textShapeId, setTextShapeId] = useState<string | null>(null)
    const [textScale, setTextScale] = useState<number>(1)
    const [textFontSize, setTextFontSize] = useState<number>(TEXT_CONFIG.FONT_SIZE)
    const [textWidth, setTextWidth] = useState<number>(100)

    const handleShare = () => {
        if (!game) {
            alert('Canvas not initialized');
            return;
        }


        if (isOnline && roomId) {
            const currentSlug = window.location.pathname.split('/').pop();
            setShareUrl(`${window.location.origin}/canvas/${currentSlug}`);
            setIsSessionActive(true);
        }

        setShareDialogOpen(true);
    };

    const handleTextEditing = (text: string, x: number, y: number, id: string, scale: number, fontSize: number, textWidth: number) => {
        setTextPosition({ x, y });
        setTextScale(scale);
        setTextFontSize(fontSize);
        setTextWidth(textWidth);
        setIsEditing(true);
        setTimeout(() => {
            if (textInputRef.current) {
                textInputRef.current.value = text;
                textInputRef.current.focus();
                textInputRef.current.select();
                // textInputRef.current.setSelectionRange(text.length, text.length);
            }
        }, 0)
    }
    const handleCanvasDoubleClick = (e: MouseEvent) => {
        if (selectedTool !== 'pointer') return;
        console.log("double click", e.clientX, " ", e.clientY)
        game?.EditingText(e);
    }

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (selectedTool !== 'text') return;
        setTextPosition({ x: e.clientX, y: e.clientY });
        // Set scale and fontSize for new text creation
        setTextScale(game?.getScale() || 1);
        setTextFontSize(TEXT_CONFIG.FONT_SIZE);
        setIsEditing(true);

    }

    const handleTextComplete = () => {
        const text = textInputRef.current?.value;
        if (text && text.trim()) {
            if (textShapeId) {
                game?.UpdateText(textShapeId, text);
            } else {
                game?.createText(textPosition, text);
            }
        }
        setIsEditing(false);
        setTextShapeId(null);
        if (textInputRef.current) {
            textInputRef.current.value = '';
        }
        setSelectedTool('pointer');
    }

    const handleConfirmShare = async () => {
        if (!game) {
            alert('Canvas not initialized');
            return;
        }

        try {
            const shapes = await game?.getAllShapesFromGameState();
            // const shapes = await getAllShapes(game.getDBPromise());
            const resp = await fetch('/api/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ shapes })
            });

            if (!resp.ok) {
                throw new Error('Failed to create room');
            }

            const data = await resp.json();
            const { roomId: newRoomId, slug } = data;

            if (!slug || !newRoomId) {
                throw new Error('No slug or roomId received');
            }

            const url = `${window.location.origin}/canvas/${slug}`;
            setShareUrl(url);
            setIsSessionActive(true);


            window.history.pushState({}, '', `/canvas/${slug}`);


            setRoomId(newRoomId);

        } catch (error) {
            console.error('Share error:', error);
            setShareDialogOpen(false);
            setIsSessionActive(false);
        }
    };

    const handleStopSession = async () => {
        setIsSessionActive(false);
        setShareDialogOpen(false);
        setShareUrl(undefined);
        alert('stopping the sessoin will overwrite previous stored data ')


        await game?.overWriteExistingData()


        setRoomId(undefined)


        window.history.pushState({}, '', '/');
    };

    useEffect(() => {
        if (game) {
            game.clearCanvas()
        }
    }, [windowSize])

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [game, selectedTool]);

    useEffect(() => {
        game?.setColor(selectedColor);
    }, [selectedColor]);

    useEffect(() => {
        if (game) {
            if (resolvedTheme === "dark") {
                game.setTheme("#0d0c09");
            } else {
                game.setTheme("#ffffff");
            }
        }
    }, [resolvedTheme, game]);

    useEffect(() => {
        if (!canvasRef.current) return;


        const isCurrentlyOnline = !!(game?.roomId);
        const shouldBeOnline = !!(roomId && socket && sessionId);


        if (game && isCurrentlyOnline === shouldBeOnline) {    //dnt reinitialise if already in correct state
            return;
        }


        const isOffline = !roomId;
        const isSharingMode = roomId && socket && sessionId;

        if (isOffline || isSharingMode) {

            if (game) {
                game.destroy();
            }

            console.log(isSharingMode ? 'online mode ' : 'offline mode')
            const g = new Game(canvasRef.current, socket, roomId, resolvedTheme === "dark" ? '#0d0c09' : '#ffffff',
                (text: string, x: number, y: number, id: string, scale: number, fontSize: number, textWidth: number) => {
                    handleTextEditing(text, x, y, id, scale, fontSize, textWidth);

                }
            );
            if (sessionId) g.setSessionId(sessionId);
            setGame(g);
        }


    }, [roomId, socket, sessionId, resolvedTheme, windowSize]);

    if (!windowSize.width || !windowSize.height) return null;

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <canvas ref={canvasRef} height={windowSize.height} width={windowSize.width} className={`relative bg-white dark:bg-[#0d0c09] touch-none ${cursorType}`
            }
                onClick={handleCanvasClick}
                onDoubleClick={handleCanvasDoubleClick}
            />

            <ToolBar
                setSelectedTool={setSelectedTool}
                selectedTool={selectedTool}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
            />

            <ToggleTheme />
            <ShareButton onClick={handleShare} isSharing={isOnline} />

            {isEditing && (
                <textarea
                    ref={textInputRef}
                    data-text-input="true"
                    style={{
                        position: 'absolute',
                        left: `${textPosition.x}px`,
                        top: `${textPosition.y}px`,
                        minWidth: `${Math.max(100, textWidth)}px`,
                        maxWidth: `${(windowSize.width || 0) - textPosition.x - 20}px`,
                        background: 'transparent',
                        color: selectedColor.hex || (resolvedTheme === 'dark' ? '#d3d3d3' : 'black'),
                        fontSize: `${textFontSize * textScale}px`,
                        fontFamily: TEXT_CONFIG.FONT_FAMILY,
                        fontWeight: TEXT_CONFIG.FONT_WEIGHT,
                        lineHeight: `${TEXT_CONFIG.LINE_HEIGHT}`,
                        height: 'auto',
                        padding: '0',
                        margin: '0',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        overflow: 'hidden',
                        whiteSpace: 'pre',
                        caretColor: selectedColor.hex || 'currentColor',
                        boxSizing: 'border-box',

                    }}
                    rows={1}
                    onInput={(e) => {
                        const textarea = e.currentTarget;

                        textarea.style.height = 'auto';
                        textarea.style.height = `${textarea.scrollHeight}px`;

                        textarea.style.width = 'auto';
                        const maxWidth = windowSize.width - textPosition.x - 20;
                        const contentWidth = Math.min(textarea.scrollWidth + 2, maxWidth);
                        textarea.style.width = `${Math.max(50, contentWidth)}px`;
                    }}
                    onBlur={handleTextComplete}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            handleTextComplete();
                        }

                    }}
                    autoFocus
                // value={textInputRef.current?.value}
                />
            )}

            <MousePositionPointer />
            {game && (
                <UndoRedoButton game={game} />
            )}

            {loading && roomId && (() => {
                return (
                    <div className="fixed inset-0 flex justify-center items-center text-black dark:text-white z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="text-lg md:text-xl text-black dark:text-white">Connecting...</div>
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Please wait</div>
                        </div>
                    </div>
                );
            })()}

            {shareDialogOpen && (
                <ShareDialog
                    onConfirm={handleConfirmShare}
                    onClose={() => setShareDialogOpen(false)}
                    shareUrl={shareUrl}
                    isActive={isSessionActive}
                    onStopSession={handleStopSession}
                />
            )}
        </div>
    );
}