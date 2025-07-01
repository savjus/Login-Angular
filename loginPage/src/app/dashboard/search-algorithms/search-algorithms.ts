import { Component } from '@angular/core';
import { NgClass } from '@angular/common';

const Directions: Array<Array<number>> = [
  [0, -1],
  [0, 1],
  [1, 0],
  [-1, 0],
];

interface Position{
  X: number;
  Y: number;
}

@Component({
  selector: 'app-search-algorithms',
  imports: [NgClass],
  templateUrl: './search-algorithms.html',
  styleUrl: './search-algorithms.css'
})
export class SearchAlgorithms {

  gridSize = 60;
  animationTimeout = 0.1;
  wallPercentage = 0.3;
  grid: Array<Array<boolean>> = [];
  startPos: Position = {X: 0, Y: 0};
  endPos: Position = {X: 0, Y: 0};
  currentPath: Position[] = [];
  animatedPath: Position[] = [];
  isAnimating: boolean = false;

  // Maze generation parameters
  mazeZigZagyness = 1; // 0 = straight, 1 = very zigzaggy
  mazeDeadEndiness = 0; // 0 = few dead ends (more loops), 1 = many dead ends (classic maze)

  constructor(){
    this.initializeGrid();
  }

  initializeGrid(){
    this.startPos = {
      X: Math.floor(Math.random() * this.gridSize), 
      Y: Math.floor(Math.random() * this.gridSize)
    };
    this.endPos = {
      X: Math.floor(Math.random() * this.gridSize),
      Y: Math.floor(Math.random() * this.gridSize)
    };
    
    // Make sure start and end positions are different and their distance is far enough
    while (this.startPos.X === this.endPos.X && this.startPos.Y === this.endPos.Y && Math.abs(this.startPos.X - this.endPos.X) > this.gridSize/2 && Math.abs(this.startPos.Y - this.endPos.Y) > this.gridSize/2) {
      this.endPos = {
        X: Math.floor(Math.random() * this.gridSize),
        Y: Math.floor(Math.random() * this.gridSize)
      };
    }

    // Create grid with random walls
    this.grid = [];
    for(let i = 0; i < this.gridSize; i++){
      this.grid[i] = [];
      for(let j = 0; j < this.gridSize; j++){
        this.grid[i][j] = Math.random() < this.wallPercentage; // 30% walls
      }
    }
    
    // Ensure start and end positions are not walls
    this.grid[this.startPos.Y][this.startPos.X] = false;
    this.grid[this.endPos.Y][this.endPos.X] = false;
    this.currentPath = []; // Clear any existing path
    this.animatedPath = [];
    this.isAnimating = false;
  }

  isStart(row: number, col: number): boolean {
    return this.startPos.X === col && this.startPos.Y === row;
  }

  isEnd(row: number, col: number): boolean {
    return this.endPos.X === col && this.endPos.Y === row;
  }

  isInPath(row: number, col: number): boolean {
    return this.currentPath.some(pos => pos.X === col && pos.Y === row);
  }

  isInAnimatedPath(row: number, col: number): boolean {
    return this.animatedPath.some(pos => pos.X === col && pos.Y === row);
  }

  // DFS Implementation (stops at endPos if provided)
  DFS(startPos: Position, grid: Array<Array<boolean>>): Position[] {
    const path: Position[] = [];
    const visited: boolean[][] = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(false));
    const stack: Position[] = [startPos];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited[current.Y][current.X]) continue;
      visited[current.Y][current.X] = true;
      path.push(current);
      if (current.X === this.endPos.X && current.Y === this.endPos.Y) break;
      for (const [dx, dy] of Directions) {
        const newX = current.X + dx;
        const newY = current.Y + dy;
        if (this.isValidPosition(newX, newY) && !visited[newY][newX] && !grid[newY][newX]) {
          stack.push({ X: newX, Y: newY });
        }
      }
    }
    return path;
  }

  // BFS Implementation (stops at endPos if provided)
  BFS(startPos: Position, grid: Array<Array<boolean>>): Position[] {
    const visited: boolean[][] = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(false));
    const path: Position[] = [];
    const queue: Position[] = [startPos];

    visited[startPos.Y][startPos.X] = true;
    while (queue.length > 0) {
      const current = queue.shift()!;
      path.push(current);
      if (current.X === this.endPos.X && current.Y === this.endPos.Y)
         break;
        
      for (const [dx, dy] of Directions) {
        const newX = current.X + dx;
        const newY = current.Y + dy;
        if (this.isValidPosition(newX, newY) && !visited[newY][newX] && !grid[newY][newX]) {
          visited[newY][newX] = true;
          queue.push({ X: newX, Y: newY });
        }
      }
    }
    return path;
  }

  // A* Implementation
  Astar(startPos: Position, endPos: Position, grid: Array<Array<boolean>>): Position[] | null {
    const openSet: Position[] = [startPos];
    const closedSet: Set<string> = new Set();
    const gScore: Map<string, number> = new Map();
    const fScore: Map<string, number> = new Map();
    const parent: Map<string, Position> = new Map();
    
    gScore.set(`${startPos.X},${startPos.Y}`, 0);
    fScore.set(`${startPos.X},${startPos.Y}`, this.heuristic(startPos, endPos));
    
    while (openSet.length > 0) {
      let current = openSet[0];
      let currentIndex = 0;
      
      for (let i = 1; i < openSet.length; i++) {
        const currentKey = `${current.X},${current.Y}`;
        const nodeKey = `${openSet[i].X},${openSet[i].Y}`;
        
        if ((fScore.get(nodeKey) || Infinity) < (fScore.get(currentKey) || Infinity)) {
          current = openSet[i];
          currentIndex = i;
        }
      }
      
      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.X},${current.Y}`);
      
      if (current.X === endPos.X && current.Y === endPos.Y) {
        return this.reconstructPath(parent, startPos, current);
      }
      
      for (const [dx, dy] of Directions) {
        const newX = current.X + dx;
        const newY = current.Y + dy;
        const neighborKey = `${newX},${newY}`;
        
        if (!this.isValidPosition(newX, newY) || grid[newY][newX] || closedSet.has(neighborKey)) {
          continue;
        }
        
        const neighbor = { X: newX, Y: newY };
        const tentativeGScore = (gScore.get(`${current.X},${current.Y}`) || 0) + 1;
        
        if (!openSet.some(n => n.X === newX && n.Y === newY)) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
          continue;
        }
        
        parent.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, endPos));
      }
    }
    
    return null;
  }
  
  // Dijkstra's Implementation (starts from startPos, visits all or stops at endPos)
  dijkstras(startPos: Position, _endPos: Position, grid: Array<Array<boolean>>): Position[] {
    const distances: Map<string, number> = new Map();
    const visited: Set<string> = new Set();
    const parent: Map<string, Position> = new Map();
    const unvisited: Position[] = [];
    const path: Position[] = [];
    // Only add startPos to unvisited at first
    unvisited.push(startPos);
    distances.set(`${startPos.X},${startPos.Y}`, 0);
    while (unvisited.length > 0) {
      let current = unvisited[0];
      let currentIndex = 0;
      for (let i = 1; i < unvisited.length; i++) {
        const currentKey = `${current.X},${current.Y}`;
        const nodeKey = `${unvisited[i].X},${unvisited[i].Y}`;
        if ((distances.get(nodeKey) || Infinity) < (distances.get(currentKey) || Infinity)) {
          current = unvisited[i];
          currentIndex = i;
        }
      }
      unvisited.splice(currentIndex, 1);
      const currentKey = `${current.X},${current.Y}`;
      visited.add(currentKey);
      path.push(current);
      // Stop if we reach endPos (if endPos is set and not equal to startPos)
      if ((this.endPos.X !== this.startPos.X || this.endPos.Y !== this.startPos.Y) && current.X === this.endPos.X && current.Y === this.endPos.Y) {
        break;
      }
      for (const [dx, dy] of Directions) {
        const newX = current.X + dx;
        const newY = current.Y + dy;
        const neighborKey = `${newX},${newY}`;
        if (!this.isValidPosition(newX, newY) || grid[newY][newX] || visited.has(neighborKey)) {
          continue;
        }
        const alt = (distances.get(currentKey) || 0) + 1;
        if (alt < (distances.get(neighborKey) || Infinity)) {
          distances.set(neighborKey, alt);
          parent.set(neighborKey, current);
          // Only add to unvisited if not already present
          if (!unvisited.some(n => n.X === newX && n.Y === newY)) {
            unvisited.push({ X: newX, Y: newY });
          }
        }
      }
    }
    return path;
  }

  clearPath() {
    this.currentPath = [];
    this.animatedPath = [];
    this.isAnimating = false;
  }
   stopAnimation() {
    this.isAnimating = false;
  }

  // Generate a maze using recursive backtracking with zigzag and dead-end control
  async generateMaze() {
    if (this.isAnimating) return;
    // Fill grid with walls
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        this.grid[i][j] = true;
      }
    }
    // Carve maze
    this.carveMaze(this.startPos.X, this.startPos.Y);
    // Optionally remove some dead ends to create loops
    this.removeDeadEnds(1 - this.mazeDeadEndiness);
    // Ensure start/end are open
    this.grid[this.startPos.Y][this.startPos.X] = false;
    this.grid[this.endPos.Y][this.endPos.X] = false;
    this.currentPath = [];
    this.animatedPath = [];
    this.isAnimating = false;
    // Ensure maze is solvable: if not, carve a path using BFS
    if (!(await this.isMazeSolvable())) {
      this.carveGuaranteedPath();
    }
  }

  // Recursive backtracking maze generation with zigzag control
  private carveMaze(x: number, y: number) {
    this.grid[y][x] = false;
    let dirs = [
      [0, -1], [1, 0], [0, 1], [-1, 0]
    ];
    // Shuffle directions, but with zigzag bias
    for (let i = dirs.length - 1; i > 0; i--) {
      if (Math.random() < this.mazeZigZagyness) {
        // Swap with a random earlier direction
        const j = Math.floor(Math.random() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
      }
    }
    for (const [dx, dy] of dirs) {
      const nx = x + dx * 2;
      const ny = y + dy * 2;
      if (this.isValidPosition(nx, ny) && this.grid[ny][nx]) {
        // Carve passage between
        this.grid[y + dy][x + dx] = false;
        this.carveMaze(nx, ny);
      }
    }
  }

  // Remove dead ends to create loops (lower deadEndiness = more loops)
  private removeDeadEnds(loopiness: number) {
    if (loopiness <= 0) return;
    for (let y = 1; y < this.gridSize - 1; y++) {
      for (let x = 1; x < this.gridSize - 1; x++) {
        if (!this.grid[y][x] && !this.isStart(y, x) && !this.isEnd(y, x)) {
          let exits = 0;
          let walls = [];
          for (const [dx, dy] of Directions) {
            if (!this.grid[y + dy][x + dx]) exits++;
            else walls.push([dx, dy]);
          }
          if (exits === 1 && Math.random() < loopiness) {
            // Remove a random wall to create a loop
            const [dx, dy] = walls[Math.floor(Math.random() * walls.length)];
            this.grid[y + dy][x + dx] = false;
          }
        }
      }
    }
  }

  // Check if maze is solvable using BFS
  private async isMazeSolvable(): Promise<boolean> {
    const visited: boolean[][] = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(false));
    const queue: Position[] = [this.startPos];
    visited[this.startPos.Y][this.startPos.X] = true;
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.X === this.endPos.X && current.Y === this.endPos.Y) return true;
      for (const [dx, dy] of Directions) {
        const newX = current.X + dx;
        const newY = current.Y + dy;
        if (this.isValidPosition(newX, newY) && !visited[newY][newX] && !this.grid[newY][newX]) {
          visited[newY][newX] = true;
          queue.push({ X: newX, Y: newY });
        }
      }
    }
    return false;
  }

  // Carve a guaranteed path from start to end (simple straight path)
  private carveGuaranteedPath() {
    let x = this.startPos.X;
    let y = this.startPos.Y;
    while (x !== this.endPos.X) {
      x += x < this.endPos.X ? 1 : -1;
      this.grid[y][x] = false;
    }
    while (y !== this.endPos.Y) {
      y += y < this.endPos.Y ? 1 : -1;
      this.grid[y][x] = false;
    }
  }

  // Helper for recursive division maze
  private divide(x: number, y: number, width: number, height: number) {
    if (width < 3 || height < 3) return;
    const horizontal = width < height;
    if (horizontal) {
      // Horizontal wall
      const wallY = y + Math.floor(Math.random() * (height - 2)) + 1;
      const passageX = x + Math.floor(Math.random() * width);
      for (let i = x; i < x + width; i++) {
        if ((i === this.startPos.X && wallY === this.startPos.Y) || (i === this.endPos.X && wallY === this.endPos.Y) || i === passageX) continue;
        this.grid[wallY][i] = true;
      }
      this.divide(x, y, width, wallY - y);
      this.divide(x, wallY + 1, width, y + height - wallY - 1);
    } else {
      // Vertical wall
      const wallX = x + Math.floor(Math.random() * (width - 2)) + 1;
      const passageY = y + Math.floor(Math.random() * height);
      for (let i = y; i < y + height; i++) {
        if ((wallX === this.startPos.X && i === this.startPos.Y) || (wallX === this.endPos.X && i === this.endPos.Y) || i === passageY) continue;
        this.grid[i][wallX] = true;
      }
      this.divide(x, y, wallX - x, height);
      this.divide(wallX + 1, y, x + width - wallX - 1, height);
    }
  }

  // Helper Methods
  private isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
  }
  
  private heuristic(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.X - pos2.X) + Math.abs(pos1.Y - pos2.Y);
  }
  
  private reconstructPath(parent: Map<string, Position>, start: Position, end: Position): Position[] {
    const path: Position[] = [];
    let current = end;
    
    while (current.X !== start.X || current.Y !== start.Y) {
      path.unshift(current);
      const parentPos = parent.get(`${current.X},${current.Y}`);
      if (!parentPos) break;
      current = parentPos;
    }
    
    path.unshift(start);
    return path;
  }
  
  // Public Methods to Run Algorithms
   async runDFS() {
    if (this.isAnimating) return;
    
    const path = this.DFS(this.startPos, this.grid);
    if(path.length > 0)
      await this.animatePath(path);
  }

  async runBFS() {
    if (this.isAnimating) return;
    
    const path = this.BFS(this.startPos, this.grid);
    if(path.length > 0)
      await this.animatePath(path);
  }

  async runAstar() {
    if (this.isAnimating) return;
    
    const path = this.Astar(this.startPos, this.endPos, this.grid);
    if(path)
      await this.animatePath(path);
  }

  async runDijkstras() {
    if (this.isAnimating) return;
    
    const path = this.dijkstras(this.startPos, this.endPos, this.grid);
    await this.animatePath(path);
  }

  private async animatePath(path: Position[]) {
    this.isAnimating = true;
    this.animatedPath = [];
    
    for(let i = 0; i < path.length; i++){
      if(!this.isAnimating)
         break;
      this.animatedPath.push(path[i]);
      await new Promise(resolve => setTimeout(resolve, this.animationTimeout));
    }
    
    this.isAnimating = false;
  }
 
}