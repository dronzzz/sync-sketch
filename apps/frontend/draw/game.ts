import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import { Shape } from "./types";
import { ShapeRenderer } from "./shapeRenderer";
import throttle from 'lodash.throttle';
import { TextRenderer } from "./textRenderer";
import { useCursorType, useMouseStore } from "@/store/useMouseStore";
interface SelectionState {
  selectedShape: Shape | null,
  isDraggin: boolean,
  dragStartX: number,
  dragStartY: number
}

const sendMousePosition = throttle((socket: WebSocket, x: number, y: number, roomId: string) => {
  socket.send(JSON.stringify({
    type: "mouseMovement",
    x,
    y,
    roomId
  }))
}, 100)

const sendShapePreview = throttle((socket: WebSocket, inputShape: Shape, roomId: string, preview: string) => {

  socket.send(JSON.stringify({
    type: "shapePreview",
    roomId: roomId,
    message: JSON.stringify(inputShape),
    previewType: preview
  }))
}, 150)

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
  private strokeWidth: number = 5;
  private isHovering: boolean = false; //true if pointer is hover over a shape
  private selectionState: SelectionState = {
    selectedShape: null,
    isDraggin: false,
    dragStartX: 0,
    dragStartY: 0
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

      if (message.type === 'shapeUpdate') {
        const updatedShape: Shape = JSON.parse(message.message);

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
        this.drawAllShapes(previewShape)

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

  getBoundingBox = (shape: Shape) => {
    let boundX = 0, boundY = 0, boundWidth = 0, boundHeight = 0;

    if (shape.type === 'rect') {
      boundX = shape.x - 10;
      boundY = shape.y - 10;
      boundWidth = shape.width + 20;
      boundHeight = shape.height + 20;

    } else if (shape.type === 'ellipse') {
      boundX = shape.centerX - shape.radiusX - 10;
      boundY = shape.centerY - shape.radiusY - 10;
      boundWidth = shape.radiusX * 2 + 20;
      boundHeight = shape.radiusY * 2 + 20;

    } else if (shape.type === "line") {
      const minX = Math.min(shape.startX, shape.endX);
      const minY = Math.min(shape.startY, shape.endY);
      boundX = minX - 10;
      boundY = minY - 10;
      boundWidth = Math.abs(shape.startX - shape.endX) + 20;
      boundHeight = Math.abs(shape.startY - shape.endY) + 20;

    } else if (shape.type === "pencil") {
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

    }

    const path = new Path2D;
    path.rect(boundX, boundY, boundWidth, boundHeight);
    return path;
  }

  handleShapeSelectionMouseDown = (x: number, y: number) => {
    if (this.selectionState.selectedShape && this.ctx.isPointInPath(this.getBoundingBox(this.selectionState.selectedShape), this.startX, this.startY)) {
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
        id: crypto.randomUUID(),
        lineWidth: this.strokeWidth,



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
        id: crypto.randomUUID(),
        lineWidth: this.strokeWidth

      }
      this.existingShapes.push(inputShape);
    } else if (this.selectedTool === "pencil") {
      inputShape = this.existingShapes[this.existingShapes.length - 1]  //last shape

    }
    if (inputShape) {

      this.socket.send(
        JSON.stringify({
          type: "chat",
          roomId: this.roomId,
          message: JSON.stringify(inputShape),
          shapeId: inputShape.id,
          shapeType: inputShape.type
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

    if (currentShape?.type === "rect") {
      const dx = x - this.selectionState.dragStartX
      const dy = y - this.selectionState.dragStartY

      currentShape.x += dx
      currentShape.y += dy

    } else if (currentShape?.type === "ellipse") {
      const dx = x - this.selectionState.dragStartX
      const dy = y - this.selectionState.dragStartY

      currentShape.centerX += dx
      currentShape.centerY += dy
    }else if(currentShape?.type === "line"){
           const dx = x - this.selectionState.dragStartX
      const dy = y - this.selectionState.dragStartY

      currentShape.startX += dx
      currentShape.startY += dy

      currentShape.endX += dx
      currentShape.endY += dy


    }else if (currentShape?.type === "pencil") {
  const dx = x - this.selectionState.dragStartX;
  const dy = y - this.selectionState.dragStartY;

  currentShape.points = currentShape.points.map(p => ({
    x: p.x + dx,
    y: p.y + dy
  }));
}

    this.selectionState.dragStartX = x
    this.selectionState.dragStartY = y
    if (currentShape) {

      sendShapePreview(this.socket, currentShape, this.roomId, 'modification')
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
      sendShapePreview(this.socket, currentShape, this.roomId, 'new')


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
      console.log('input shape send in preview', inputShape)
      sendShapePreview(this.socket, inputShape, this.roomId, 'new')

    }

  }



  handleMouseMove = async (e: MouseEvent) => {

    const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY)
    sendMousePosition(this.socket, canvasCoords.x, canvasCoords.y, this.roomId)

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
      this.drawAllShapes(shape)
      this.updateShapePath(shape)


    });
  }

  drawBoundingBox = (shape: Shape) => {
    this.ctx.save()
    const path = this.getBoundingBox(shape);
    this.ctx.lineWidth = 1 / this.scale;
    this.ctx.strokeStyle = '#302c94';
    this.ctx.stroke(path);
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
        this.shapeRenderer.drawPencil(shape)

      default:
        break
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
