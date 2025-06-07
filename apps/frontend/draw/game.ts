import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import { Shape } from "./types";
import { ShapeRenderer } from "./shapeRenderer";




export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D
  private existingShapes: Shape[];
  private roomId: string;
  private clicked: boolean;
  private startX: number = 0;
  private startY: number = 0;
  private socket: WebSocket;
  private selectedTool: Tool = "ellipse";
  private shapeRenderer : ShapeRenderer;

  constructor(canvas: HTMLCanvasElement, socket: WebSocket, roomId: string) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d")!;
    this.existingShapes = [];
    this.shapeRenderer = new ShapeRenderer(this.ctx);
    this.clicked = false;
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

  initHandlers() {

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "chat") {
        this.existingShapes.push(JSON.parse(message.message));
        this.clearCanvas();
      }
    };
  }

  mouseHandlers() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
  }

  destroy() {

    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);

  }

  handleMouseDown = (e: MouseEvent) => {
    this.clicked = true;
    this.startX = e.offsetX;
    this.startY = e.offsetY;
  };

  handleMouseUp = (e: MouseEvent) => {
    this.clicked = false;
    let inputShape: Shape | null = null;
    if (this.selectedTool === "rect") {
      const rectHeight = Number(e.offsetY - this.startY);
      const rectWidth = Number(e.offsetX - this.startX);

      inputShape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        width: rectWidth,
        height: rectHeight,
      };

      this.existingShapes.push(inputShape);
    } else if (this.selectedTool === "ellipse") {
      const width = e.offsetX - this.startX;
      const height = e.offsetY - this.startY;
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
    } else if (this.selectedTool === "line"){
      inputShape = {
        type:"line",
        startX : this.startX,
        startY:this.startY,
        endX: e.offsetX,
        endY : e.offsetY
      }
      this.existingShapes.push(inputShape);
    }

    this.socket.send(
      JSON.stringify({
        type: "chat",
        roomId: this.roomId,
        message: JSON.stringify(inputShape),
      })
    );
  };

  handleMouseMove = (e: MouseEvent) => {
    if (this.clicked) {
      this.ctx.strokeStyle = "#3d3c3a";
      this.ctx.lineWidth = 5;
      if (this.selectedTool === "rect") {
        const rectHeight = Number(e.offsetY - this.startY);
        const rectWidth = Number(e.offsetX - this.startX);
        this.clearCanvas();
        this.shapeRenderer.drawRect({ type: "rect", x: this.startX, y: this.startY, width: rectWidth, height: rectHeight });

      } else if (this.selectedTool === "ellipse") {

        const width = e.offsetX - this.startX;
        const height = e.offsetY - this.startY;
        this.clearCanvas();
        this.shapeRenderer.drawEllipse({
          type: "ellipse",
          centerX: this.startX + width / 2,
          centerY: this.startY + height / 2,
          radiusX: Math.abs(width / 2),
          radiusY: Math.abs(height / 2)
        });

      }else if (this. selectedTool === "line"){
         this.clearCanvas();
      this.shapeRenderer.drawLine({
        type:"line",
        startX : this.startX,
        startY:this.startY,
        endX: e.offsetX,
        endY : e.offsetY
      })
    }
    }
  };

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#0d0c09";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.strokeStyle = "#3d3c3a";

    this.ctx.lineWidth = 5;
    this.existingShapes.map((shape) => {
      console.log(shape);
      if (shape.type === "rect") {

        this.shapeRenderer.drawRect(shape)

      } else if (shape.type === "ellipse") {
        this.shapeRenderer.drawEllipse(shape)
      }else if (shape.type === "line"){
      this.shapeRenderer.drawLine(shape)
    }
    });
  }
}