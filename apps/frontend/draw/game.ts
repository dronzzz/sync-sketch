import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import { Shape } from "./types";
import { ShapeRenderer } from "./shapeRenderer";
import throttle from 'lodash.throttle';
import { TextRenderer } from "./textRenderer";
import { useCursorType, useMouseStore } from "@/store/useMouseStore";
import { randomUUID } from "crypto";

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
  private isTyping: boolean;
  private selectedColor
  private currentTheme: string
  private existingPaths: { [key: string]: Path2D }
  private isHovering: boolean = false; //true if pointer is hover over a shape
  private selectedShape: Shape | undefined = undefined; //selected for drag/resize
  private strokeWidth : number = 5;
  private selectedShapePath : Path2D | undefined = undefined
  private boundingBox : boolean = false;
  private isDragging : boolean = false;
  private prevMouseX : number = 0;
  private prevMouseY : number = 0;




  constructor(canvas: HTMLCanvasElement, socket: WebSocket, roomId: string) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d")!;
    this.existingShapes = [];
    this.existingPaths = {}
    this.shapeRenderer = new ShapeRenderer(this.ctx);
    this.textRenderer = new TextRenderer(this.ctx)
    this.clicked = false;
    this.isTyping = false;
    this.socket = socket;
    this.roomId = roomId;
    this.selectedColor = "#3d3c3a";
    this.currentTheme = "#FFFFFF";
    this.ctx.fillStyle = this.currentTheme
    this.ctx.strokeStyle = this.selectedColor
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

  setColor(color: any) {
    this.selectedColor = color.hex;
    this.ctx.strokeStyle = color.hex;

  }

  setTheme(color: string) {
    this.currentTheme = color;
    this.ctx.fillStyle = this.currentTheme;
    this.clearCanvas()

  }


  initHandlers() {

    this.socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "chat") {
        this.existingShapes.push(JSON.parse(message.message));
        this.clearCanvas();
      }
      if (message.type === "mouseMovement") {
        const { setMousePosition } = useMouseStore.getState();

        const screenX = message.x * this.scale + this.panX;  //world coord --> screen coord
        const screenY = message.y * this.scale + this.panY;

        setMousePosition(message.userId, screenX, screenY);


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

  getUpdatedMouseCoords = (clientX: number, clientY: number) => {   //screen coord  -->world coord

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

  getBoundingBox = (shape:Shape)=>{
     let boundX = 0, boundY = 0, boundWidth = 0, boundHeight = 0;

    if (shape.type === 'rect') {
      boundX = shape.x -10;
      boundY = shape.y -10;
      boundWidth = shape.width + 20;
      boundHeight = shape.height + 20;

    } else if (shape.type === 'ellipse') {
      boundX = shape.centerX - shape.radiusX -10;
      boundY = shape.centerY - shape.radiusY -10;
      boundWidth = shape.radiusX * 2 + 20;
      boundHeight = shape.radiusY * 2 + 20;

    } 
    const path = new Path2D;
    path.rect(boundX,boundY,boundWidth,boundHeight);
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#a6a3ea';
    this.ctx.stroke(path);
    this.boundingBox = true
    this.selectedShapePath = path ;
    return path;
  }

  handleMouseDown = (e: MouseEvent) => {
    this.clicked = true;
        const { x, y } = this.getUpdatedMouseCoords(e.clientX, e.clientY)
    this.startX = x;
    this.startY = y;

    if(this.boundingBox){
      console.log('checking if inside the selcted region')
      if(this.selectedShapePath){
        
        if(this.ctx.isPointInPath(this.selectedShapePath,this.startX,this.startY) === false) {
          this.clearCanvas();
          this.selectedShapePath = undefined;
          this.selectedShape = undefined;
          this.boundingBox = false;
        }else {
          console.log('is draggin to true ')
          // if(this.isDragging === false) this.boundingBox = false
          this.prevMouseX = x;
  this.prevMouseY = y;
          this.isDragging = true;
        }
      }

    }



  


   if (this.isHovering && this.selectedShape) {
    this.getBoundingBox(this.selectedShape)



  }


    if (this.selectedTool === "pencil" && this.clicked === true) {
      const shape: Shape = {
        type: "pencil",
        points: [{ x: this.startX, y: this.startY }],
        color: this.selectedColor,
        id: crypto.randomUUID()

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

    if(this.isDragging){
      this.isDragging = false
    }



    if (this.selectedTool === "rect") {

      const rectHeight = Number(canvasCoords.y - this.startY);
      const rectWidth = Number(canvasCoords.x - this.startX);

      inputShape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        width: rectWidth,
        height: rectHeight,
        color: this.selectedColor,
        id: crypto.randomUUID()


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
        radiusY,
        color: this.selectedColor,
        id: crypto.randomUUID()


      };

      this.existingShapes.push(inputShape);
    } else if (this.selectedTool === "line") {
      inputShape = {
        type: "line",
        startX: this.startX,
        startY: this.startY,
        endX: canvasCoords.x,
        endY: canvasCoords.y,
        color: this.selectedColor,
        id: crypto.randomUUID()

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

  isPointingShape = async (e: MouseEvent) => {
    const { x, y } = await this.getUpdatedMouseCoords(e.clientX, e.clientY);
    const { cursorType, setCursorType } = useCursorType.getState();


      this.isHovering = false;
    Object.entries(this.existingPaths).forEach(([id, path]) => {
      if (this.ctx.isPointInStroke(path, x, y)) {
        console.log("found it ------------------------------------------------------------->")
        this.isHovering = true;
        this.selectedShape = this.existingShapes.find(shape => shape.id === id)
      }
    })

    const nextCursor = this.isHovering ? 'cursor-move' : 'cursor-default';

    if (cursorType !== nextCursor) {
      setCursorType(nextCursor);
    }
  };



  handleMouseMove = async(e: MouseEvent) => {

    const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY)
    sendMousePosition(this.socket, canvasCoords.x, canvasCoords.y, this.roomId)

      if(this.selectedTool === "pointer" && this.isDragging){
        console.log('mouse moving n drag state')
        const currentshape = this.existingShapes.find(shape => shape.id === this.selectedShape?.id)

        const {x,y} = await this.getUpdatedMouseCoords(e.clientX,e.clientY)
      if(currentshape?.type === 'rect'){

        const dx = x - this.prevMouseX
        const dy =y - this.prevMouseY
      

        
          currentshape.x += dx
          currentshape.y +=dy
          this.selectedShape  = currentshape
          

        }else if (currentshape?.type === 'ellipse') {

    const dx = x - this.prevMouseX;
    const dy = y - this.prevMouseY;

    currentshape.centerX += dx;  
    currentshape.centerY += dy;  

    this.selectedShape = currentshape; 
        }
        this.prevMouseX = x;
this.prevMouseY = y;
this.clearCanvas();


      

    }else


    if (this.selectedTool === "pointer") {
      this.isPointingShape(e)
    }

  




    if (this.clicked) {
      this.ctx.lineWidth = this.strokeWidth;
      let inputShape: Shape | null = null
      if (this.selectedTool === "rect") {

        const rectHeight = Number(canvasCoords.y - this.startY);
        const rectWidth = Number(canvasCoords.x - this.startX);
        this.clearCanvas();
        this.shapeRenderer.drawRect({
          type: "rect",
          x: this.startX,
          y: this.startY,
          width: rectWidth,
          height: rectHeight,
          color: this.selectedColor
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
          radiusY: Math.abs(height / 2),
          color: this.selectedColor

        });

      } else if (this.selectedTool === "line") {
        this.clearCanvas();
        this.shapeRenderer.drawLine({
          type: "line",
          startX: this.startX,
          startY: this.startY,
          endX: canvasCoords.x,
          endY: canvasCoords.y,
          color: this.selectedColor

        })
      } else if (this.selectedTool === "pencil") {


        const currentShape = this.existingShapes[this.existingShapes.length - 1];
        if (currentShape.type === "pencil") {
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

    this.ctx.fillStyle = this.currentTheme;
    this.ctx.fillRect(-this.panX / this.scale, -this.panY / this.scale, this.canvas.width / this.scale, this.canvas.height / this.scale);

    this.ctx.lineWidth = this.strokeWidth / this.scale;
    
    if (this.selectedShape && this.boundingBox) {
  const path = this.getBoundingBox(this.selectedShape);
  this.selectedShapePath = path;

  this.ctx.lineWidth = 1 / this.scale;
  this.ctx.strokeStyle = '#6965db';
  this.ctx.stroke(path);
}

  this.ctx.lineWidth = this.strokeWidth / this.scale;
  this.ctx.strokeStyle = this.selectedColor;

    this.existingPaths = {};

   




    this.existingShapes.forEach((shape) => {
      const path = new Path2D();

      if (shape.type === "rect") {
        path.rect(shape.x, shape.y, shape.width, shape.height);
        this.shapeRenderer.drawRect(shape);
      } else if (shape.type === "ellipse") {
        path.ellipse(
          shape.centerX,
          shape.centerY,
          shape.radiusX,
          shape.radiusY,
          0,
          0,
          Math.PI * 2
        );
        this.shapeRenderer.drawEllipse(shape);
      } else if (shape.type === "line") {
        path.moveTo(shape.startX, shape.startY);
        path.lineTo(shape.endX, shape.endY);
        this.shapeRenderer.drawLine(shape);
      } else if (shape.type === "pencil") {
        if (shape.points && shape.points.length > 1) {
          path.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            path.lineTo(shape.points[i].x, shape.points[i].y);
          }
        }
        this.shapeRenderer.drawPencil(shape);
      }

      if (shape.id) {
        this.existingPaths[shape.id] = path;
      }
    });
  }
}
