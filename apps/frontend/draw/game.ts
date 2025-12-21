import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import { Shape } from "./types";
import { TextRenderer } from "./textRenderer";
import { useCursorType, useMouseStore } from "@/store/useMouseStore";
import { BaseShape } from "./shapes/BaseShape";
import { ShapeFactory } from "./utils/ShapeFactory";
import { Pencil } from "./shapes/Pencil";
import { clearAllShapes, getAllShapes, initDB, saveShape, SketchDB } from "@/lib/indexdb";
import { IDBPDatabase } from 'idb';
import { CommandManager } from "./utils/CommandManager";
import { RenderingManager } from "./RenderingManager";
import { SelectionManager } from "./SelectionManager";
import { DrawingManager } from "./DrawingManager";
import { CollaborationManager } from "./CollaborationManager";


export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D
  private existingShapes: BaseShape[];
  private roomId: string | null;
  private clicked: boolean;
  private startX: number = 0;
  private startY: number = 0;
  private socket: WebSocket | null;
  private selectedTool: Tool = "panTool";
  private textRenderer: TextRenderer;
  private scale: number = 1;
  private panX: number = 0;
  private panY: number = 0;
  private isTyping: boolean;
  private selectedColor: string;
  private currentTheme: string;
  private existingPaths: { [key: string]: Path2D }
  private strokeWidth: number = 5;
  private Handle_size: number = 8;
  private isEraserDragging: boolean = false;

  private hitTolerance: number = 16;
  private sessionId: string | null = null;
  private isOnline: boolean = false;
  private dbPromise: any | null = null;
  private shapesToDelete: Set<string> = new Set();
  private commandManager: CommandManager | null = null;
  private collaborationManager: CollaborationManager;
  private renderingManager: RenderingManager;
  private selectionManager: SelectionManager;
  private drawingManager: DrawingManager;

  setSessionId(id: string) {
    this.collaborationManager.setSessionId(id);
    this.sessionId = id;
  }

  constructor(canvas: HTMLCanvasElement, socket?: WebSocket | null, roomId?: string | null, theme?: string) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d")!;
    this.existingShapes = [];
    this.existingPaths = {}
    this.textRenderer = new TextRenderer(this.ctx)
    this.clicked = false;
    this.isTyping = false;
    this.socket = socket || null;
    this.roomId = roomId || null;
    this.currentTheme = theme === "light" ? "#ffffff" : "#0d0c09";
    this.selectedColor = theme === "light" ? "#1f1f1f" : "#d3d3d3";

    this.collaborationManager = new CollaborationManager(socket, roomId,
      (shape: BaseShape) => {
        this.existingShapes.push(shape);
        this.renderingManager.clearCanvas();
      },
      (shape: BaseShape) => {
        const i = this.existingShapes.findIndex(s => s.getShapeId() === shape.getShapeId());

        if (i !== -1) {
          this.existingShapes[i] = shape
        } else {
          this.existingShapes.push(shape)

        }
        this.renderingManager.clearCanvas();

      },
      (shapeId: string) => {
        const index = this.existingShapes.findIndex(s => s.getShapeId() === shapeId);
        if (index !== -1) {
          this.existingShapes.splice(index, 1);
          this.renderingManager.clearCanvas();
        }


      },
      (shape: Shape, messageType: string) => {
        if (messageType === 'modification') {
          this.existingShapes = this.existingShapes.filter(
            s => s.getShapeId() !== shape.id
          );
        }

        this.renderingManager.clearCanvas();
        this.renderingManager.drawAllShapes(shape);

      },
      (userId: string, x: number, y: number) => {
        const { setMousePosition } = useMouseStore.getState();
        setMousePosition(userId, x, y);
      },
      () => ({ scale: this.scale, panX: this.panX, panY: this.panY })
    );



    this.renderingManager = new RenderingManager(this.ctx,
      this.Handle_size,
      () => this.strokeWidth,
      () => this.currentTheme,
      () => ({ scale: this.scale, panX: this.panX, panY: this.panY }),
      () => this.existingShapes,
      () => this.existingPaths,
      () => this.selectionManager.getSelectedShape(),
      () => ({ canvasWidth: this.canvas.width, canvasHeight: this.canvas.height })
    );

    this.selectionManager = new SelectionManager(
      this.ctx,
      this.Handle_size,
      this.hitTolerance,
      this.renderingManager,
      () => this.existingShapes,
      () => ({ scale: this.scale, panX: this.panX, panY: this.panY }),
      () => this.existingPaths,
      (x, y) => this.getUpdatedMouseCoords(x, y),
      (x, y) => this.getMousePixelCoords(x, y),
      this.collaborationManager
    );

    this.drawingManager = new DrawingManager(
      this.ctx,
      () => this.selectedColor,
      () => this.strokeWidth,
      () => this.selectedTool,
      this.renderingManager,
      this.collaborationManager,
      (x, y) => this.getUpdatedMouseCoords(x, y),
      () => this.existingShapes,
    );

    this.init();

    this.mouseHandlers();

  }


  async init() {
    this.ctx.fillStyle = this.currentTheme
    this.ctx.strokeStyle = this.selectedColor
    this.isOnline = !!(this.socket && this.roomId);
    this.dbPromise = await initDB()

    if (!this.isOnline) {

      const shapes = await getAllShapes(this.dbPromise);   //from local indexdb

      this.existingShapes = shapes.map((shapeData: Shape) =>
        ShapeFactory.createShapeFromData(shapeData)
      );

    } else {
      const shapes = await getExistingShapes(this.roomId!);
      this.existingShapes = shapes.map((shapeData: Shape) =>
        ShapeFactory.createShapeFromData(shapeData)
      );
    }


    this.commandManager = new CommandManager(this.existingShapes, () => this.renderingManager.clearCanvas());

    this.renderingManager.clearCanvas();
  }

  clearCanvas() {
    this.renderingManager.clearCanvas();
  }

  getDBPromise(): IDBPDatabase<SketchDB> {
    return this.dbPromise;
  }


  setTool(tool: Tool) {

    const selectedShape = this.selectionManager.getSelectedShape()
    if (selectedShape) {
      this.selectionManager.setSelectedShape(null);
      this.renderingManager.clearCanvas();
    }


    this.selectedTool = tool;
  }

  setColor = async (color: any) => {
    this.selectedColor = color.hex;
    this.ctx.strokeStyle = color.hex;

    const selectedShape = this.selectionManager.getSelectedShape();
    if (selectedShape) {
      const index = this.existingShapes.findIndex((shape) => shape.getShapeId() === selectedShape.getShapeId());

      if (index !== -1 && this.existingShapes[index]) {
        const previousState = this.existingShapes[index].serialize();
        this.existingShapes[index].setColor(color.hex);

        if (this.commandManager) {
          this.commandManager.modify(this.existingShapes[index], previousState);
        }

        await this.collaborationManager.updateStore(this.existingShapes[index], "shapeUpdate", this.dbPromise);
        this.renderingManager.clearCanvas();
      }
    }
  }

  setTheme(theme: string) {
    this.currentTheme = theme;
    this.ctx.fillStyle = this.currentTheme;

    if (theme === "#0d0c09" && this.selectedColor === "#1f1f1f") {
      this.selectedColor = "#d3d3d3";
      this.ctx.strokeStyle = this.selectedColor;
    } else if (theme === "#ffffff" && this.selectedColor === "#d3d3d3") {
      this.selectedColor = "#1f1f1f";
      this.ctx.strokeStyle = this.selectedColor;
    }

    this.renderingManager.clearCanvas();

  }

  getAllShapesFromGameState = async () => {
    return this.existingShapes.map(shape => shape.serialize());
  }

  overWriteExistingData = async () => {
    console.log('Overwriting existing data');

    await clearAllShapes(this.dbPromise);


    for (const shape of this.existingShapes) {
      const serialized = shape.serialize();
      await saveShape(this.dbPromise, serialized);
    }

  }


  undo = async () => {
    if (this.commandManager) {
      const action = this.commandManager.undo();

      if (action) {
        const shape = this.existingShapes.find(s => s.getShapeId() === action.shapeId);

        if (action.action === 'add') {
          const tempShape = ShapeFactory.createShapeFromData(action.shapeData);
          await this.collaborationManager.updateStore(tempShape, 'shapeDelete', this.dbPromise);
        } else if (action.action === 'delete' && shape) {
          await this.collaborationManager.updateStore(shape, 'chat', this.dbPromise);
        } else if (action.action === 'modify' && shape) {
          await this.collaborationManager.updateStore(shape, 'shapeUpdate', this.dbPromise);

        }
      }
      this.selectionManager.setSelectedShape(null);
      this.renderingManager.clearCanvas();
    }

  }

  redo = async () => {

    if (this.commandManager) {
      const action = this.commandManager.redo();

      if (action) {
        const shape = this.existingShapes.find(s => s.getShapeId() === action.shapeId);

        if (action.action === 'add' && shape) {
          await this.collaborationManager.updateStore(shape, 'chat', this.dbPromise);
        } else if (action.action === 'delete') {

          const tempShape = ShapeFactory.createShapeFromData(action.shapeData);
          await this.collaborationManager.updateStore(tempShape, 'shapeDelete', this.dbPromise);
        } else if (action.action === 'modify' && shape) {
          await this.collaborationManager.updateStore(shape, 'shapeUpdate', this.dbPromise);
        }
      }

      this.selectionManager.setSelectedShape(null);
      this.renderingManager.clearCanvas();
    }


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

  getMousePixelCoords(clientX: number, clientY: number) {  //screen coord -->pixel coord
    const rect = this.canvas.getBoundingClientRect();
    return {
      pixelX: clientX - rect.left,
      pixelY: clientY - rect.top
    };
  }

  isWritableKey(key: string): boolean {
    return key.length === 1 || key === " "

  }
  handleKeys = async (e: KeyboardEvent) => {

    if (this.selectedTool === "text" && this.isTyping === true) {
      e.preventDefault();

      if (e.key === "Enter" || e.key === "Escape") {
        this.isTyping = false;
        this.textRenderer.stopTextInput();
      }

      if (e.key === "Backspace") {
        this.textRenderer.deleteLetter();
        this.renderingManager.clearCanvas();
      } else
        //@ts-ignore
        if (this.isWritableKey(e.key)) {
          this.renderingManager.clearCanvas();


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

      e.preventDefault();
      this.undo();
    }

    if (e.ctrlKey && e.key === "y") {

      e.preventDefault();
      this.redo();
    }
  }



  handleMouseDown = (e: MouseEvent) => {
    this.clicked = true;
    const { x, y } = this.getUpdatedMouseCoords(e.clientX, e.clientY)
    this.startX = x;
    this.startY = y;

    if (this.selectedTool === "eraser") {
      this.isEraserDragging = true;
    }

    if (this.selectedTool === "pointer") {
      this.selectionManager.handleShapeSelectionMouseDown(e)
    }

    const drawingTools = ["rect", "ellipse", "line", "diamond", "arrow"];
    if (drawingTools.includes(this.selectedTool)) {
      this.drawingManager.setStartPosition(x, y);
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


  handleMouseUp = async (e: MouseEvent) => {
    this.clicked = false;
    const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY);

    if (this.selectedTool === "eraser") {
      this.isEraserDragging = false;

      if (this.shapesToDelete.size > 0) {

        const shapesToDeleteArray = this.existingShapes.filter(
          (shape) => this.shapesToDelete.has(shape.getShapeId())
        );

        if (this.commandManager) {
          shapesToDeleteArray.forEach(shape => {
            this.commandManager!.delete(shape); //delete from stack 
          });
        }

        for (let i = this.existingShapes.length - 1; i >= 0; i--) {
          if (this.shapesToDelete.has(this.existingShapes[i].getShapeId())) {
            this.existingShapes.splice(i, 1);
          }
        }
        this.shapesToDelete.clear()

        if (!this.isOnline) {
          await clearAllShapes(this.dbPromise)
          for (const shape of this.existingShapes) {
            await saveShape(this.dbPromise, shape.serialize())
          }

        }

        if (this.isOnline && this.socket) {

          shapesToDeleteArray.forEach(shape => {
            this.socket!.send(JSON.stringify({
              type: 'shapeDelete',
              roomId: this.roomId,
              shapeId: shape.getShapeId(),
              sessionId: this.sessionId,
            }));
          });
        }

        this.renderingManager.clearCanvas();
      }
      return;
    }

    if (this.selectionManager.isDragging() || this.selectionManager.isResizing()) {
      const selectedShape = this.selectionManager.getSelectedShape();
      const previousState = this.selectionManager.getPreviousState();

      if (selectedShape && previousState) {
        const currentState = selectedShape.serialize();

        const hasChanged = JSON.stringify(currentState) !== JSON.stringify(previousState);

        if (hasChanged) {
          await this.collaborationManager.updateStore(selectedShape, 'shapeUpdate', this.dbPromise);

          if (this.commandManager) {
            this.commandManager.modify(selectedShape, previousState);
          }
        }
      }
      this.selectionManager.resetDragResizeState();
      return;
    }


    const newShape = this.drawingManager.createShape(e);
    if (newShape) {
      if (this.selectedTool !== "pencil") {
        this.existingShapes.push(newShape);
      }

      const bounds = newShape.getBounds();
      const hasSize = Math.abs(bounds.width) > 1 || Math.abs(bounds.height) > 1;

      if (this.commandManager && hasSize) {
        this.commandManager.add(newShape);
      }
      await this.collaborationManager.updateStore(newShape, 'chat', this.dbPromise);
      this.renderingManager.clearCanvas();
    }
  };



  handleMouseMove = async (e: MouseEvent) => {

    const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY)
    this.collaborationManager.sendMousePosition(canvasCoords.x, canvasCoords.y);
    if (this.selectedTool === "eraser" && this.isEraserDragging) {
      this.hanldeEraser(e)
    } else if (this.selectedTool === "pointer" && this.selectionManager.isResizing()) {
      this.selectionManager.handleShapeResize(e)
    } else if (this.selectedTool === "pointer" && this.selectionManager.isDragging()) {
      this.selectionManager.handleShapeDrag(e)
    } else if (this.selectedTool === "pointer") {
      this.selectionManager.mouseHoverDetection(e)
    } else if (this.clicked) {
      this.drawingManager.handleDrawingOnMouseMove(e)

    }
  }
  hanldeEraser = (e: MouseEvent) => {
    const { pixelX, pixelY } = this.getMousePixelCoords(e.clientX, e.clientY);

    let found = false;
    this.ctx.save();
    const hitLineWidth = this.hitTolerance / this.scale;
    this.ctx.lineWidth = hitLineWidth;

    Object.entries(this.existingPaths).forEach(([id, path]) => {
      if (!found && this.ctx.isPointInStroke(path, pixelX, pixelY)) {
        const shapeIndex = this.existingShapes.findIndex(shape => shape.getShapeId() === id);


        if (shapeIndex !== -1 && this.existingShapes[shapeIndex]) {
          found = true;
          this.shapesToDelete.add(id);

          this.existingShapes[shapeIndex].setColor("#b0adadff");
          this.renderingManager.clearCanvas();
        }
      }
    });
    this.ctx.restore();
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
      this.renderingManager.clearCanvas();

    }

  }

}