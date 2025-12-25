
const FONT_SIZE = 30;
const FONT_FAMILY = '"JetBrains Mono", "Fira Code", monospace';
const FONT_WEIGHT = 'bold';
const LINE_HEIGHT = 1.2;

export const TEXT_CONFIG = {
    FONT_SIZE,
    FONT_FAMILY,
    FONT_WEIGHT,
    LINE_HEIGHT,
    FONT: `${FONT_WEIGHT} ${FONT_SIZE}px ${FONT_FAMILY}`,
    LINE_HEIGHT_PX: FONT_SIZE * LINE_HEIGHT,
} as const;
