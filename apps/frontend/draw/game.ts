import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import { NormalizedShape, Rect, Shape } from "./types";
import { ShapeRenderer } from "./shapeRenderer";
import throttle from 'lodash.throttle';
import { TextRenderer } from "./textRenderer";
import { useCursorType, useMouseStore } from "@/store/useMouseStore";
interface SelectionState {
  selectedShape: NormalizedShape | null,
  isDraggin: boolean,
  dragStartX: number,
  dragStartY: number
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

const sendShapePreview = throttle((socket: WebSocket, inputShape: NormalizedShape, roomId: string, preview: string, sessionId: string) => {
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
  private existingShapes: NormalizedShape[];
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
  private Handle_size : number = 8;
  private selectionState: SelectionState = {
    selectedShape: null,
    isDraggin: false,
    dragStartX: 0,
    dragStartY: 0
  }
  private sessionId : string | null = null;

  setSessionId(id: string) {
    this.sessionId = id;
    console.log('Game session ID set to:', this.sessionId);
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
    console.log('Initializing WebSocket handlers');
    
    this.socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Raw incoming message:', event.data);
        console.log('Parsed incoming message:', message);

        if (message.type === "session-init") {
          console.log('Received session-init message:', message);
          this.sessionId = message.sessionId;
          console.log('Session ID set to:', this.sessionId);
          return;
        }

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

        if (message.type === 'shapeUpdate') {
          const updatedShape: NormalizedShape = JSON.parse(message.message);

          const i = this.existingShapes.findIndex(shape => shape.id === updatedShape.id);

          if (i !== -1) {
            this.existingShapes[i] = updatedShape
          } else {
            this.existingShapes.push(updatedShape)

          }
          this.clearCanvas();
        } else if (message.type === 'shapePreview') {
          const previewShape = JSON.parse(message.message)
          this.clearCanvas()
          if (message.previewType === 'modification') {
            this.existingShapes = this.existingShapes.filter(shape => shape.id !== previewShape.id);

          }
          const renderableShape = this.shapeMapper(previewShape)
          if(renderableShape){
            this.drawAllShapes(renderableShape)
          }
          

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
            lineWidth: this.strokeWidth
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



  getBoundingBox = (shape: NormalizedShape) => {
    let boundX = 0, boundY = 0, boundWidth = 0, boundHeight = 0;

    if(shape.type === "text"){
      
    }else 
    if (shape.type === "pencil") {
      const xs = shape.points.map(p => p.x);
      const ys = shape.points.map(p => p.y);

      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      boundX = minX - 10;
      boundY = minY - 10;
      boundWidth = (maxX - minX) + 20;
      boundHeight = (maxY - minY) + 20;

    }else {
      boundX = shape.x - 10;
      boundY = shape.y - 10;
      boundWidth = shape.width + 20;
      boundHeight = shape.height + 20;

    }


    const path = new Path2D;
    path.rect(boundX, boundY, boundWidth, boundHeight);
    return {
      path,
       bounds: { x: boundX, y: boundY, width: boundWidth, height: boundHeight }
    };
  }

  handleShapeSelectionMouseDown = (x: number, y: number) => {
    if (this.selectionState.selectedShape && this.ctx.isPointInPath(this.getBoundingBox(this.selectionState.selectedShape).path, this.startX, this.startY)) {
      console.log('is inside the bounding box')
      this.selectionState.isDraggin = true;
      this.selectionState.dragStartX = x;
      this.selectionState.dragStartY = y;

    } else {
      console.log('is outside the bounding box')
      this.selectionState.selectedShape = null
      this.selectionState.isDraggin = false;
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
      const shape: Shape = {
        type: "pencil",
        points: [{ x: this.startX, y: this.startY }],
        color: this.selectedColor,
        id: crypto.randomUUID(),
        lineWidth: this.strokeWidth


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

    if (this.selectionState.isDraggin) {
      this.selectionState.isDraggin = false;

      //send shape updates
      this.socket.send(JSON.stringify({
        type: "shapeUpdate",
        roomId: this.roomId,
        message: JSON.stringify(this.selectionState.selectedShape),
        shapeId: this.selectionState.selectedShape?.id
      }))
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
        id: crypto.randomUUID(),
        lineWidth: this.strokeWidth


      };

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
        id: crypto.randomUUID(),
        lineWidth: this.strokeWidth,



      };

    } else if (this.selectedTool === "line") {
      inputShape = {
        type: "line",
        startX: this.startX,
        startY: this.startY,
        endX: canvasCoords.x,
        endY: canvasCoords.y,
        color: this.selectedColor,
        id: crypto.randomUUID(),
        lineWidth: this.strokeWidth

      }
    } else if (this.selectedTool === "pencil") {
      inputShape = this.shapeMapper(this.existingShapes[this.existingShapes.length - 1]) ?? null  //last shape as Shape

    }
    if (inputShape) {
      const normalisedShape = this.normalizeShape(inputShape)

      this.existingShapes.push(normalisedShape);


      this.socket.send(
        JSON.stringify({
          type: "chat",
          roomId: this.roomId,
          message: JSON.stringify(normalisedShape),
          shapeId: normalisedShape.id,
          shapeType: normalisedShape.type,
          sessionId :this.sessionId
        })
      );
    }
  };



  private mouseHoverDetection = async (e: MouseEvent) => {

    const { x, y } = await this.getUpdatedMouseCoords(e.clientX, e.clientY);
    const { cursorType, setCursorType } = useCursorType.getState();


    this.isHovering = false;
    Object.entries(this.existingPaths).forEach(([id, path]) => {
      if (this.ctx.isPointInStroke(path, x, y)) {
        this.isHovering = true;
        this.selectionState.selectedShape = this.existingShapes.find(shape => shape.id === id) ?? null;
      }
    })

    const nextCursor = this.isHovering ? 'cursor-move' : 'cursor-default';

    if (cursorType !== nextCursor) {
      setCursorType(nextCursor);
    }
  };

  private handleShapeDrag = async (e: MouseEvent) => {
    const { x, y } = await this.getUpdatedMouseCoords(e.clientX, e.clientY)


    const currentShape = this.existingShapes.find(shape => shape.id === this.selectionState.selectedShape?.id);

    if (currentShape?.type === "pencil") {
  const dx = x - this.selectionState.dragStartX;
  const dy = y - this.selectionState.dragStartY;

  currentShape.points = currentShape.points.map(p => ({
    x: p.x + dx,
    y: p.y + dy
  }));
}else if(currentShape)  {
      const dx = x - this.selectionState.dragStartX
      const dy = y - this.selectionState.dragStartY

      currentShape.x += dx
      currentShape.y += dy

    } 

    this.selectionState.dragStartX = x
    this.selectionState.dragStartY = y
    if (currentShape) {

      sendShapePreview(this.socket, currentShape, this.roomId, 'modification',this.sessionId!)
    }
    this.clearCanvas()


  }

  handleDrawingOnMouseMove = (e: MouseEvent) => {
    const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY)
    let inputShape: Shape | null = null
    switch (this.selectedTool) {
      case "rect":
        const rectHeight = canvasCoords.y - this.startY;
        const rectWidth = canvasCoords.x - this.startX;
        inputShape = {
          type: "rect",
          x: this.startX,
          y: this.startY,
          width: rectWidth,
          height: rectHeight,
          color: this.selectedColor,
          lineWidth: this.strokeWidth
        };
        this.clearCanvas();
        this.shapeRenderer.drawRect(inputShape);
        break;

      case "ellipse":
        const width = canvasCoords.x - this.startX;
        const height = canvasCoords.y - this.startY;
        inputShape = {
          type: "ellipse",
          centerX: this.startX + width / 2,
          centerY: this.startY + height / 2,
          radiusX: Math.abs(width / 2),
          radiusY: Math.abs(height / 2),
          color: this.selectedColor,
          lineWidth: this.strokeWidth
        };
        this.clearCanvas();
        this.shapeRenderer.drawEllipse(inputShape);
        break;

      case "line":
        inputShape = {
          type: "line",
          startX: this.startX,
          startY: this.startY,
          endX: canvasCoords.x,
          endY: canvasCoords.y,
          color: this.selectedColor,
          lineWidth: this.strokeWidth
        };
        this.clearCanvas();
        this.shapeRenderer.drawLine(inputShape);
        break;

      case "pencil":
        const currentShape = this.existingShapes[this.existingShapes.length - 1];
        if (currentShape.type === "pencil") {
          currentShape.points.push({ x: canvasCoords.x, y: canvasCoords.y });
          this.shapeRenderer.drawPencil(currentShape);
      sendShapePreview(this.socket, currentShape, this.roomId, 'new',this.sessionId!)


        }
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

      default:
        break;
    }
    if (inputShape) {
      const normalisedShape = this.normalizeShape(inputShape)
      // console.log('input shape send in preview', inputShape)
      sendShapePreview(this.socket, normalisedShape, this.roomId, 'new',this.sessionId!)

    }

  }



  handleMouseMove = async (e: MouseEvent) => {

    const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY)
    sendMousePosition(this.socket, canvasCoords.x, canvasCoords.y, this.roomId,this.sessionId!)

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
         const renderableShape = this.shapeMapper(shape)    //normalized -> !normalized/rendarable
    if (!renderableShape) return;
      this.drawAllShapes(renderableShape)
      this.updateShapePath(renderableShape)


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

      default:
        break
    }
  }

  normalizeShape = (shape: Shape): NormalizedShape => {
  switch (shape.type) {
    case "rect":
      return { ...shape }; // already normalized
    case "ellipse":
      return {
        type: "ellipse",
        x: shape.centerX - shape.radiusX,
        y: shape.centerY - shape.radiusY,
        width: shape.radiusX * 2,
        height: shape.radiusY * 2,
        id:shape.id,
        color: shape.color,
        lineWidth: shape.lineWidth,
      };
    case "line":
      return {
        type: "line",
        x: shape.startX,
        y: shape.startY,
        width: shape.endX - shape.startX,
        height: shape.endY - shape.startY,
        color: shape.color,
        lineWidth: shape.lineWidth,
        id:shape.id,

      };
    case "pencil":
      return {
        ...shape,
      };
    case "text":
      return {
        type: "text",
        textContent: shape.textContent,
        x: shape.startX,
        y: shape.startY,
        maxWidth: shape.maxWidth,
        font: shape.font,
        color: shape.color,
        lineWidth: shape.lineWidth,
        id:shape.id,

      };
  }
}


  shapeMapper = (shape:NormalizedShape): Shape | undefined =>{    //normalised to original
    switch (shape.type) {
      case "rect":
        return {
          ...shape,
        };
      case "ellipse":
        return {
          type: "ellipse",
          centerX: shape.x + shape.width / 2,
          centerY: shape.y + shape.height / 2,
          radiusX: shape.width / 2,
          radiusY: shape.height / 2,
          color: shape.color,
          lineWidth: shape.lineWidth,
        id:shape.id,

        };
      case "line":
        return {
          type: "line",
          startX: shape.x,
          startY: shape.y,
          endX: shape.x + shape.width,
          endY: shape.y + shape.height,
          color: shape.color,
          lineWidth: shape.lineWidth,
        id:shape.id,

        };
      case "pencil":
        return {
          type: "pencil",
          points: shape.points,
          color: shape.color,
          lineWidth: shape.lineWidth,
        id:shape.id,

        };

    }
  }


  updateShapePath = (shape: Shape) => {
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

      default:
        break;
    }
    if (shape.id) {
      this.existingPaths[shape.id] = path;

    }


  }
}
