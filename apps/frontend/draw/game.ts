import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import { Shape } from "./types";
import { ShapeRenderer } from "./shapeRenderer";
import throttle from 'lodash.throttle';
import { TextRenderer } from "./textRenderer";

const sendMousePosition = throttle((socket: WebSocket, x: number, y: number, roomId: string) => {
  socket.send(JSON.stringify({
    type: "mouseMovement",
    x,
    y,
    roomId
  }

  ))
}, 50)

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D
  private existingShapes: Shape[];
  private roomId: string;
  private clicked: boolean;
  private startX: number = 0;
  private startY: number = 0;
  private socket: WebSocket;
  private selectedTool: Tool = "panTool";
  private shapeRenderer: ShapeRenderer;
  private textRenderer: TextRenderer;
  private scale: number = 1;
  private panX: number = 0;
  private panY: number = 0;
  private textContent: string;
  private isTyping: boolean;




  constructor(canvas: HTMLCanvasElement, socket: WebSocket, roomId: string) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d")!;
    this.existingShapes = [];
    this.shapeRenderer = new ShapeRenderer(this.ctx);
    this.textRenderer = new TextRenderer(this.ctx)
    this.clicked = false;
    this.isTyping = false;
    this.textContent = "";
    this.socket = socket;
    this.roomId = roomId;
    this.init();
    this.initHandlers();
    this.mouseHandlers();
    this.clearCanvas();
  }


  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.clearCanvas();
  }



  setTool(tool: Tool) {
    this.selectedTool = tool;
  }
  // private onMouseMoveCallback: ((x: number, y: number) => void) | null = null;
  // setOnMouseMoveCallback(callback: (x: number, y: number) => void) {
  //   this.onMouseMoveCallback = callback;
  // }

  initHandlers() {

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "chat") {
        this.existingShapes.push(JSON.parse(message.message));
        this.clearCanvas();
      }
      if (message.type === "mouseMovement") {
        // this.onMouseMoveCallback?.(message.x, message.y);

      }
    };
  }

  mouseHandlers() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener('wheel', this.handleMouseWheel)
    document.addEventListener("keydown", this.handleKeys)
  }



  destroy() {

    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener('wheel', this.handleMouseWheel)
    document.removeEventListener("keydown", this.handleKeys)


  }

  getUpdatedMouseCoords = (clientX: number, clientY: number) => {

    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left - this.panX) / this.scale
    const y = (clientY - rect.top - this.panY) / this.scale

    return { x, y }

  }

  isWritableKey(key: string): boolean {
    return key.length === 1 || key === " "

  }
  handleKeys = (e: KeyboardEvent) => {

    if (this.selectedTool === "text" && this.isTyping === true) {
      e.preventDefault();

      if (e.key === "Enter" || e.key === "Escape") {
        this.isTyping = false;
        this.textRenderer.stopTextInput();
      }

      if (e.key === "Backspace") {
        this.textRenderer.deleteLetter();
        this.clearCanvas();
      } else
        //@ts-ignore
        if (this.isWritableKey(e.key)) {
          this.clearCanvas();


          this.textRenderer.startTextInput({

            type: "text",
            textContent: e.key,
            startX: this.startX,
            startY: this.startY,
            maxWidth: Math.abs(2 * this.startX - this.canvas.width)
          })
        }


    }


    if (e.ctrlKey && e.key === "z") {

      //undo


    }
    if (e.ctrlKey && e.key === "y") {

      //redo 

    }
  }

  handleMouseDown = (e: MouseEvent) => {
    this.clicked = true;
    const { x, y } = this.getUpdatedMouseCoords(e.clientX, e.clientY)
    this.startX = x;
    this.startY = y;
    if (this.selectedTool === "pencil" && this.clicked === true) {
      const shape: Shape = {
        type: "pencil",
        points: [{ x: this.startX, y: this.startY }]
      }
      this.existingShapes.push(shape)


    }


    if (this.selectedTool === "text" && this.clicked === true) {
      this.isTyping = true;

      console.log('the current tool selsected is ', this.selectedTool)
    }


  };

  handleMouseUp = (e: MouseEvent) => {
    this.clicked = false;
    let inputShape: Shape | null = null;
    const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY);



    if (this.selectedTool === "rect") {

      const rectHeight = Number(canvasCoords.y - this.startY);
      const rectWidth = Number(canvasCoords.x - this.startX);

      inputShape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        width: rectWidth,
        height: rectHeight,
      };

      this.existingShapes.push(inputShape);
    } else if (this.selectedTool === "ellipse") {
      const width = canvasCoords.x - this.startX;
      const height = canvasCoords.y - this.startY;
      const radiusX = Math.abs(width / 2)
      const radiusY = Math.abs(height / 2)

      inputShape = {
        type: "ellipse",
        centerX: this.startX + width / 2,
        centerY: this.startY + height / 2,
        radiusX,
        radiusY
      };

      this.existingShapes.push(inputShape);
    } else if (this.selectedTool === "line") {
      inputShape = {
        type: "line",
        startX: this.startX,
        startY: this.startY,
        endX: canvasCoords.x,
        endY: canvasCoords.y
      }
      this.existingShapes.push(inputShape);
    }
    if (this.selectedTool === "pencil") {
      inputShape = this.existingShapes[this.existingShapes.length - 1]  //last shape

    }

    if (this.selectedTool !== "panTool") {

      // this.socket.send(
      //   JSON.stringify({
      //     type: "chat",
      //     roomId: this.roomId,
      //     message: JSON.stringify(inputShape),
      //   })
      // );
    }
  };


  handleMouseMove = (e: MouseEvent) => {

    const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY)

    // sendMousePosition(this.socket, canvasCoords.x, canvasCoords.y, this.roomId)




    if (this.clicked) {
      this.ctx.strokeStyle = "#3d3c3a";
      this.ctx.lineWidth = 5;
      let inputShape :Shape | null= null
      if (this.selectedTool === "rect") {

        const rectHeight = Number(canvasCoords.y - this.startY);
        const rectWidth = Number(canvasCoords.x - this.startX);
        this.clearCanvas();
        this.shapeRenderer.drawRect({
          type: "rect",
          x: this.startX,
          y: this.startY,
          width: rectWidth,
          height: rectHeight
        });

      } else if (this.selectedTool === "ellipse") {

        const width = canvasCoords.x - this.startX;
        const height = canvasCoords.y - this.startY;
        this.clearCanvas();
        this.shapeRenderer.drawEllipse({
          type: "ellipse",
          centerX: this.startX + width / 2,
          centerY: this.startY + height / 2,
          radiusX: Math.abs(width / 2),
          radiusY: Math.abs(height / 2)
        });

      } else if (this.selectedTool === "line") {
        this.clearCanvas();
        this.shapeRenderer.drawLine({
          type: "line",
          startX: this.startX,
          startY: this.startY,
          endX: canvasCoords.x,
          endY: canvasCoords.y
        })
      } else if (this.selectedTool === "pencil") {


        const currentShape = this.existingShapes[this.existingShapes.length - 1];
        if (currentShape.type === "pencil" && Array.isArray((currentShape as any).points)) {
          (currentShape as { type: "pencil"; points: { x: number; y: number }[] }).points.push({ x: canvasCoords.x, y: canvasCoords.y });   //() to resolve type error 
          this.shapeRenderer.drawPencil(currentShape);
        }



      } else if (this.selectedTool === "panTool") {

        // this.startX  //initial point which we have to maintain with the canvavs by changin the offset so that the point with resp to canvas remains same
        const dx = e.movementX;
        const dy = e.movementY;
        this.panX += dx;
        this.panY += dy;


        // const dx = e.clientX - this.lastPanX;   //dx is the change in the pan
        // const dy = e.clientY - this.lastPanY;
        // this.panX += dx;
        // this.panY += dy;

        // this.lastPanX = e.clientX;
        // this.lastPanY = e.clientY;

        this.clearCanvas();
        // this.ctx.translate(this.panX, this.panY);

      }

      this.socket.send(JSON.stringify({
         type: "shapeUpdates",
          roomId: this.roomId,
          message: JSON.stringify(inputShape),

      }))
    }
  }


  handleMouseWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey === true) {



      const zoomFactro = (e.deltaY > 0 ? 0.9 : 1.1);
      const newScale = this.scale * zoomFactro;

      const mouseX = e.clientX - this.canvas.offsetLeft;
      const mouseY = e.clientY - this.canvas.offsetTop;

      this.panX = mouseX - (mouseX - this.panX) * (newScale / this.scale);
      this.panY = mouseY - (mouseY - this.panY) * (newScale / this.scale);

      this.scale = newScale
      this.clearCanvas();

    }

  }

  clearCanvas() {
    this.ctx.setTransform(this.scale, 0, 0, this.scale, this.panX, this.panY);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "#0d0c09";
    this.ctx.fillRect(-this.panX / this.scale, -this.panY / this.scale, this.canvas.width / this.scale, this.canvas.height / this.scale);   // to cover the whole panned and scaled canvas
    this.ctx.strokeStyle = "#3d3c3a";

    this.ctx.lineWidth = 5 / this.scale;
    this.existingShapes.map((shape) => {
      if (shape.type === "rect") {

        this.shapeRenderer.drawRect(shape)

      } else if (shape.type === "ellipse") {
        this.shapeRenderer.drawEllipse(shape)
      } else if (shape.type === "line") {
        this.shapeRenderer.drawLine(shape)
      }
      else if (shape.type === "pencil") {
        this.shapeRenderer.drawPencil(shape)
      }
    });
  }
}