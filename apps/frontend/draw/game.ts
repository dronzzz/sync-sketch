import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import { Shape } from "./types";
import { ShapeRenderer } from "./shapeRenderer";
import throttle from 'lodash.throttle';
import { TextRenderer } from "./textRenderer";
import { useCursorType, useMouseStore } from "@/store/useMouseStore";
import { BaseShape } from "./shapes/BaseShape";
import { ShapeFactory } from "./utils/ShapeFactory";
import { Rect } from "./shapes/Rect";
import { Ellipse } from "./shapes/Ellipse";
import { Line } from "./shapes/Line";
import { Pencil } from "./shapes/Pencil";
import { Diamond } from "./shapes/Diamond";
interface SelectionState {
  selectedShape: BaseShape | null,
  isDraggin: boolean,
  dragStartX: number,
  dragStartY: number,
  isResizing:boolean,
  resizeHanle: any | null,
}

const sendMousePosition = throttle((socket: WebSocket, x: number, y: number, roomId: string,sessionId:string) => {
  socket.send(JSON.stringify({
    type: "mouseMovement",
    x,
    y,
    roomId,
    sessionId,

  }))
}, 100)

const sendShapePreview = throttle((socket: WebSocket, inputShape: Shape, roomId: string, preview: string, sessionId: string) => {
  if (!sessionId) {
    console.warn('Attempting to send shape preview without session ID');
    return;
  }

  socket.send(JSON.stringify({
    type: "shapePreview",
    roomId: roomId,
    message: JSON.stringify(inputShape),
    previewType: preview,
    sessionId
  }))
}, 150)

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D
  private existingShapes: BaseShape[];
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
  private strokeWidth: number = 5;
  private isHovering: boolean = false; //true if pointer is hover over a shape
  private Handle_size : number = 10;
  private selectionState: SelectionState = {
    selectedShape: null,
    isDraggin: false,
    dragStartX: 0,
    dragStartY: 0,
    isResizing:false,
    resizeHanle:null,
  }
  private sessionId : string | null = null;

  setSessionId(id: string) {
    this.sessionId = id;
  }

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
    this.init();
    this.initHandlers();
    this.mouseHandlers();
    this.clearCanvas();
  }


  async init() {
    this.ctx.fillStyle = this.currentTheme
    this.ctx.strokeStyle = this.selectedColor
    const shapes = await getExistingShapes(this.roomId);
    this.existingShapes =  this.existingShapes = shapes.map(shapeData=> 
            ShapeFactory.createShapeFromData(shapeData)
        );
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
    console.log('Initializing WebSocket handlers');
    
    this.socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        // console.log('Raw incoming message:', event.data);
        // console.log('Parsed incoming message:', message);

        if (message.type === "session-init") {
          console.log('Received session-init message:', message);
          this.sessionId = message.sessionId;
          console.log('Session ID set to:', this.sessionId);
          return;
        }

        if (message.type === "chat") {
          const shapeData = JSON.parse(message.message)
          const shape = ShapeFactory.createShapeFromData(shapeData)
          this.existingShapes.push(shape);
          this.clearCanvas();
        }
        if (message.type === "mouseMovement") {
          const { setMousePosition } = useMouseStore.getState();
          const screenX = message.x * this.scale + this.panX;  //world coord --> screen coord
          const screenY = message.y * this.scale + this.panY;
          setMousePosition(message.userId, screenX, screenY);
        }

        if (message.type === 'shapeUpdate') {
          const updatedShape = JSON.parse(message.message);
          const shape = ShapeFactory.createShapeFromData(updatedShape)
          

          const i = this.existingShapes.findIndex(shape => shape.getShapeId() === updatedShape.id);

          if (i !== -1) {
            this.existingShapes[i] = shape
          } else {
            this.existingShapes.push(shape)

          }
          this.clearCanvas();
        } else if (message.type === 'shapePreview') {
          const previewShape = JSON.parse(message.message);
          
         
          if (message.previewType === 'modification') {
            this.existingShapes = this.existingShapes.filter(
              shape => shape.getShapeId() !== previewShape.id
            );
          }
          
          this.clearCanvas();
          this.drawAllShapes(previewShape);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
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
            maxWidth: Math.abs(2 * this.startX - this.canvas.width),
            lineWidth: this.strokeWidth,
            color: this.selectedColor
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

  getResizeHandlers = (bounds:{
    x:number;
    y:number;
    width:number;
    height:number;
  })=>{

    const handleSize = this.Handle_size / this.scale;
    const halfHandle = handleSize/2

    const handles = [
    {
      type: "top-left",
      x: bounds.x - halfHandle,
      y: bounds.y - halfHandle,
    },
    {
      type: "top-right",
      x: bounds.x + bounds.width - halfHandle,
      y: bounds.y - halfHandle,
    },
    {
      type: "bottom-left",
      x: bounds.x - halfHandle,
      y: bounds.y + bounds.height - halfHandle,
    },
    {
      type: "bottom-right",
      x: bounds.x + bounds.width - halfHandle,
      y: bounds.y + bounds.height - halfHandle,
    },
  ];

    return handles

  }



  getBoundingBox = (shape:BaseShape) => {


    const{x, y, width, height} = shape.getBounds()
    const gap  = 10;

    const path = new Path2D;
    path.rect(x - gap , y - gap, width + gap*2, height + gap*2);
    return {
      path,
       bounds: { x:x-gap, y:y-gap, width:width+gap*2, height:height+gap*2 }
    };
  }

  handleShapeSelectionMouseDown = (x: number, y: number) => {
    const resizeHandle = this.checkIfHandleAtPoint(x,y);
    if(this.selectionState.selectedShape && resizeHandle !== null ){
      this.selectionState.isResizing = true;
      this.selectionState.resizeHanle = resizeHandle;
      this.selectionState.dragStartX = x;
      this.selectionState.dragStartY = y;
      console.log('inside the handleShapeSelectionMouseDown')
    }else if (this.selectionState.selectedShape && this.ctx.isPointInPath(this.getBoundingBox(this.selectionState?.selectedShape).path, this.startX, this.startY)) {
      console.log('is inside the bounding box')
      this.selectionState.isDraggin = true;
      this.selectionState.dragStartX = x;
      this.selectionState.dragStartY = y;

    } else {
      console.log('is outside the bounding box')
      this.selectionState.selectedShape = null
      this.selectionState.isDraggin = false;  
      this.selectionState.resizeHanle = null;
      this.selectionState.dragStartX = 0;
      this.selectionState.dragStartY = 0;

      this.clearCanvas()

    }
    
    if (this.isHovering && this.selectionState.selectedShape) {
      this.drawBoundingBox(this.selectionState.selectedShape)

    }
  }

  handleMouseDown = (e: MouseEvent) => {
    this.clicked = true;
    const { x, y } = this.getUpdatedMouseCoords(e.clientX, e.clientY)
    this.startX = x;
    this.startY = y;

    if (this.selectedTool === "pointer") {
      this.handleShapeSelectionMouseDown(x, y)
    }

    if (this.selectedTool === "pencil" && this.clicked === true) {
      const shape = new Pencil(
        [{ x: this.startX, y: this.startY }],
        this.selectedColor,
        this.strokeWidth
      );
      this.existingShapes.push(shape);
    }


    


    if (this.selectedTool === "text" && this.clicked === true) {
      this.isTyping = true;

      console.log('the current tool selsected is ', this.selectedTool)
    }


  };

  handleMouseUp = (e: MouseEvent) => {
    this.clicked = false;
    const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY);

    if (this.selectionState.isDraggin || this.selectionState.isResizing) {
      if (this.selectionState.selectedShape) {
        this.socket.send(JSON.stringify({
          type: "shapeUpdate",
          roomId: this.roomId,
          message: JSON.stringify(this.selectionState.selectedShape.serialize()),
          shapeId: this.selectionState.selectedShape.getShapeId()
        }));
        this.selectionState.isDraggin = false;
        this.selectionState.isResizing = false;
        this.selectionState.resizeHanle  = null
      }
    }

    let inputShape: BaseShape | null = null;
    
    switch (this.selectedTool) {
      case "rect":
        inputShape = new Rect(
          this.startX,
          this.startY,
          canvasCoords.x - this.startX,
          canvasCoords.y - this.startY,
          this.selectedColor,
          this.strokeWidth
        );
        break;

      case "ellipse":
        const width = canvasCoords.x - this.startX;
        const height = canvasCoords.y - this.startY;
        inputShape = new Ellipse(
          this.startX + width / 2,
          this.startY + height / 2,
          Math.abs(width / 2),
          Math.abs(height / 2),
          this.selectedColor,
          this.strokeWidth
        );
        break;
        

      case "line":
        inputShape = new Line(
          this.startX,
          this.startY,
          canvasCoords.x,
          canvasCoords.y,
          this.selectedColor,
          this.strokeWidth
        );
        break;



      case "pencil":
        inputShape = this.existingShapes[this.existingShapes.length - 1]  //last shape as Shape
      break;

      case "diamond":
        const widthh = canvasCoords.x - this.startX
        const heighth = canvasCoords.y - this.startY
        inputShape = new Diamond(
          this.startX,
          this.startY,
          Math.abs(widthh / 2),
          Math.abs(heighth / 2),
          this.selectedColor,
          this.strokeWidth


        )
        break;

    }
    if (inputShape) {
      this.existingShapes.push(inputShape);
      this.socket.send(JSON.stringify({
        type: "chat",
        roomId: this.roomId,
        message: JSON.stringify(inputShape.serialize()),
        shapeId: inputShape.getShapeId(),
        shapeType: inputShape.constructor.name.toLowerCase(),
        sessionId: this.sessionId
      }));
      this.clearCanvas();
    }
  };



  private mouseHoverDetection = async (e: MouseEvent) => {

    const { x, y } = await this.getUpdatedMouseCoords(e.clientX, e.clientY);
    const { cursorType, setCursorType } = useCursorType.getState();

    if(this.selectionState.selectedShape){
      const handleType = this.checkIfHandleAtPoint(x,y);
      if(handleType !== null){
        // console.log('pointing ot hanle ',handleType)
        let cursor = 'cursor-default';
          switch (handleType) {
            case 'top-left':
            case 'bottom-right':
              cursor = "cursor-nw-resize"
              break;
            case 'top-right':
            case 'bottom-left':
              cursor = "cursor-ne-resize"
              break;
          
            default:
              break;
          }
          if(cursorType !== cursor){
            setCursorType(cursor)
          }
          return;
      }
    }


    this.isHovering = false;
    Object.entries(this.existingPaths).forEach(([id, path]) => {
      if (this.ctx.isPointInStroke(path, x, y)) {
        this.isHovering = true;
        this.selectionState.selectedShape = this.existingShapes.find(shape => shape.getShapeId() === id) ?? null;
      }
    })

    const nextCursor = this.isHovering ? 'cursor-move' : 'cursor-default';

    if (cursorType !== nextCursor) {
      setCursorType(nextCursor);
    }
  };

  checkIfHandleAtPoint = (x: number, y: number) => {
    if (!this.selectionState.selectedShape) return null;
    
    const handlesize = this.Handle_size / this.scale;
    const {bounds} = this.getBoundingBox(this.selectionState.selectedShape);
    const handles =this.getResizeHandlers(bounds)
    for( let handle of handles)
      if(x >= handle.x && x <= handle.x + handlesize && y >= handle.y && y <= handle.y + handlesize){
        return handle.type;
      }
    return null;



  }

  private handleShapeDrag = async (e: MouseEvent) => {
    if (!this.selectionState.selectedShape) return;
    
    const { x, y } = await this.getUpdatedMouseCoords(e.clientX, e.clientY);
    const dx = x - this.selectionState.dragStartX;
    const dy = y - this.selectionState.dragStartY;

    this.selectionState.selectedShape?.drag(dx,dy)

    this.selectionState.dragStartX = x
    this.selectionState.dragStartY = y
    

      sendShapePreview(this.socket, this.selectionState.selectedShape?.serialize(), this.roomId, 'modification',this.sessionId!)
    
    this.clearCanvas()


  }

  handleShapeResize = (e:MouseEvent) =>{
    const { x, y} = this.getUpdatedMouseCoords(e.clientX,e.clientY);
    const dx = x - this.selectionState.dragStartX;
    const dy = y - this.selectionState.dragStartY;

    const bounds = this.selectionState.selectedShape?.getBounds()
    if(!bounds) return
    
    switch(this.selectionState.resizeHanle){
      case 'top-left':
        this.selectionState.selectedShape?.resize(bounds.x+dx,bounds.y+dy,bounds.width - dx,bounds.height - dy)
        break;
        case 'top-right':
          this.selectionState.selectedShape?.resize(bounds.x,bounds.y+dy,bounds.width + dx,bounds.height - dy)
          break
          case 'bottom-left':
            this.selectionState.selectedShape?.resize(bounds.x+dx,bounds.y, bounds.width - dx,bounds.height + dy)
            break;
            case 'bottom-right':
              this.selectionState.selectedShape?.resize(bounds.x,bounds.y, bounds.width + dx,bounds.height + dy)
              break;
              default:
            break;
            
            
          }
          this.selectionState.dragStartX = x
          this.selectionState.dragStartY = y

    this.clearCanvas()


  }



  handleDrawingOnMouseMove = (e: MouseEvent) => {
    const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY)
    let previewShape: Shape | null = null;
    
    switch (this.selectedTool) {
      case "rect":
        const rectHeight = canvasCoords.y - this.startY;
        const rectWidth = canvasCoords.x - this.startX;
        previewShape = {
          type: 'rect',
          x: this.startX,
          y: this.startY,
          width: rectWidth,
          height: rectHeight,
          color: this.selectedColor,
          lineWidth: this.strokeWidth
        };
        break;

      case "ellipse":
        const width = canvasCoords.x - this.startX;
        const height = canvasCoords.y - this.startY;
        previewShape = {
          type: 'ellipse',
          centerX: this.startX + width / 2,
          centerY: this.startY + height / 2,
          radiusX: Math.abs(width / 2),
          radiusY: Math.abs(height / 2),
          color: this.selectedColor,
          lineWidth: this.strokeWidth
        };
        break;

      case "line":
        previewShape = {
          type: 'line',
          startX: this.startX,
          startY: this.startY,
          endX: canvasCoords.x,
          endY: canvasCoords.y,
          color: this.selectedColor,
          lineWidth: this.strokeWidth
        };
        break;

      case "pencil":
        const currentShape = this.existingShapes[this.existingShapes.length - 1];
        if (currentShape instanceof Pencil) {                                     
          currentShape.addPoint(canvasCoords.x, canvasCoords.y);
          this.clearCanvas();
          currentShape.draw(this.ctx);
          sendShapePreview(this.socket, currentShape.serialize(), this.roomId, 'new', this.sessionId!);
        }
        break;
      case "diamond":
        const diamondWidth = canvasCoords.x - this.startX;
        const diamondHeight  = canvasCoords.y - this.startY;
        previewShape = {
          type: 'diamond',
          centerX: this.startX + diamondWidth /2 ,
          centerY: this.startY + diamondHeight /2 ,
          radiusX: Math.abs(diamondWidth / 2),
          radiusY: Math.abs(diamondHeight / 2),
          color: this.selectedColor,
          lineWidth: this.strokeWidth
        };
        break;  

      case "panTool":
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
        break;
    }

    if (previewShape) {
      this.clearCanvas();
      this.drawAllShapes(previewShape);
      sendShapePreview(this.socket, previewShape, this.roomId, 'new', this.sessionId!);
    }
  }



  handleMouseMove = async (e: MouseEvent) => {

    const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY)
    sendMousePosition(this.socket, canvasCoords.x, canvasCoords.y, this.roomId,this.sessionId!)
    if(this.selectedTool === "pointer" && this.selectionState.isResizing){
      this.handleShapeResize(e)
    }else

    if (this.selectedTool === "pointer" && this.selectionState.isDraggin) {
      this.handleShapeDrag(e)
    } else if (this.selectedTool === "pointer") {
      this.mouseHoverDetection(e)
    } else if (this.clicked) {
      this.handleDrawingOnMouseMove(e)

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


    if (this.selectionState.selectedShape) {
      this.drawBoundingBox(this.selectionState.selectedShape)
    }




    this.existingShapes.forEach((shape) => {
      shape.draw(this.ctx)
      this.updateShapePath(shape)


    });
  }

  drawBoundingBox = (shape: any) => {
    const handleSize = this.Handle_size / this.scale
    this.ctx.save()
    const {path,bounds} = this.getBoundingBox(shape);
    this.ctx.lineWidth = 1 / this.scale;
    this.ctx.strokeStyle = '#302c94';
    this.ctx.stroke(path);

    this.ctx.restore();
    
    this.ctx.save();
    if(this.currentTheme === "#0d0c09"){

      this.ctx.fillStyle = '#0d0c09';
    }else{
      this.ctx.fillStyle = '#ffffff';

    }
    this.ctx.lineWidth = 1/ this.scale;
    this.ctx.strokeStyle = '#302c94';


  
    const handlers = this.getResizeHandlers(bounds)
    handlers.forEach(handle =>{
      this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      this.ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
      
    })
    
    this.ctx.restore();

  }

  drawAllShapes = (shape: Shape) => {


    switch (shape.type) {
      case 'rect':
        this.shapeRenderer.drawRect(shape);
        break;

      case 'ellipse':
        this.shapeRenderer.drawEllipse(shape);
        break;

      case 'line':
        this.shapeRenderer.drawLine(shape);
        break;

      case 'pencil':
        this.shapeRenderer.drawPencil(shape);
        break;
      case 'diamond':
        this.shapeRenderer.drawDiamond(shape);
        break;
        
      default:
        break
    }
  }





  updateShapePath = (unSerializedShape: BaseShape) => {
    const shape = unSerializedShape.serialize()
    const path = new Path2D;
    

    switch (shape.type) {
      case 'rect':
        path.rect(shape.x, shape.y, shape.width, shape.height);

        break;

      case 'ellipse':
        path.ellipse(shape.centerX, shape.centerY, shape.radiusX, shape.radiusY, 0, 0, Math.PI * 2);
        break;

      case 'line':
        path.moveTo(shape.startX, shape.startY);
        path.lineTo(shape.endX, shape.endY);
        break;

      case 'pencil':
        if (shape.points && shape.points.length > 1) {
          path.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            path.lineTo(shape.points[i].x, shape.points[i].y);
          }
        }
        break;

      case 'diamond':
        path.moveTo(shape.centerX, shape.centerY);
        path.lineTo(shape.centerX + shape.radiusX, shape.centerY + shape.radiusY);
        path.lineTo(shape.centerX, shape.centerY + 2 * shape.radiusY);
        path.lineTo(shape.centerX - shape.radiusX, shape.centerY + shape.radiusY);
        path.closePath();
        break;

      default:
        break;
    }
    if (shape.id) {
      this.existingPaths[shape.id] = path;

    }


  }
}

