import { TextInput } from "./types";


export class TextRenderer {
    private ctx: CanvasRenderingContext2D;
    private textContent: string;
    private fontSize: number = 50;



    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.textContent = ""
    }

    startTextInput(shape: TextInput) {
        const fontSize = 50;
        const fontFamily = 'Arial';
        const color = 'white';
        const textAlign = 'left';


        this.ctx.fillStyle = color;
        this.ctx.font = `${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = textAlign;
        this.textContent += shape.textContent;
        this.drawWrappedText(shape)

    }

    drawWrappedText(shape: TextInput) {
        const words = this.textContent.split(' ')
        let line = '';
       let currentY = shape.startY

        for (let i = 0; i < words.length; i++) {
            line = line + words[i] + ' ';
            const { width } = this.ctx.measureText(line);

            if (width > shape.maxWidth) {
                // line = line.trim().replace(/\s[^ ]+$/, '');   //remove last word

                this.ctx.fillText(line, shape.startX,currentY)
                line = words[i] + " ";
               currentY += this.fontSize * 1.2

            }

        }
        if (line.trim()) {
            this.ctx.fillText(line, shape.startX,currentY)
        }

    }


    stopTextInput() {
        this.textContent = "";
    }

    deleteLetter(){
        this.textContent = this.textContent.slice(0,-1)
    }
}