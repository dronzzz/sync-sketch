import { AvatarCircles } from "./AvatarCircle"
import { useRoomStore } from "@/store/useRoomStore"
import * as Popover from '@radix-ui/react-popover';

export const ActiveUsers = ({ sessionId }: { sessionId: string | null }) => {

    const COLORS = "65c8a7,fd0a54,f57576,febf97,f5ecb7"

    const getBoringAvatarUrl = (sessionId: string, size: number = 40) =>
        `https://hostedboringavatars.vercel.app/api/beam?size=${size}&name=${sessionId}&colors=${COLORS}`;

    const users = useRoomStore((state) => state.users);
    const otherUsers = users.filter(u => u.sessionId !== sessionId);
    const totalUsers = otherUsers.length;

    const allAvatarUrls = otherUsers.map(({ sessionId }) => ({
        imageUrl: getBoringAvatarUrl(sessionId),
        profileUrl: "",
    }));

    const displayAvatars = allAvatarUrls.slice(0, 3);
    const remainingCount = totalUsers > 3 ? totalUsers - 3 : 0;

    if (totalUsers === 0) return null;

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <div className="absolute top-5 right-32 md:right-36 cursor-pointer hover:scale-105 transition-transform">
                    <AvatarCircles
                        numPeople={remainingCount}
                        avatarUrls={displayAvatars}
                    />
                </div>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    className="bg-white/95 dark:bg-[#1a1a1a] backdrop-blur-sm rounded-xl shadow-lg p-3 w-56 z-50 animate-in fade-in-0 zoom-in-95 outline-none focus:outline-none"
                    sideOffset={8}
                    align="center"
                    alignOffset={0}
                    side="bottom"
                    avoidCollisions={true}
                >
                    <div
                        className="space-y-1 max-h-60 overflow-y-auto pr-1"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'transparent transparent'
                        }}
                    >
                        {otherUsers.map(user => (
                            <div
                                key={user.sessionId}
                                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-[#212020]/80 transition-all duration-150"
                            >
                                <img
                                    src={getBoringAvatarUrl(user.sessionId, 28)}
                                    alt={user.username}
                                    className="w-7 h-7 rounded-full ring-1 ring-gray-200 dark:ring-[#212020]"
                                />
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                    {user.username}
                                </span>
                            </div>
                        ))}
                    </div>

                    <Popover.Arrow className="fill-white/95 dark:fill-[#0d0c09]/95" />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}
