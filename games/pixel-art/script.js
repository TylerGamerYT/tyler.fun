// ---- Palette Configuration ----
const PALETTE = [
    '#f8fafc', '#94a3b8', '#334155', '#020617', '#ef4444', 
    '#f97316', '#fbbf24', '#22c55e', '#10b981', '#14b8a6', 
    '#3b82f6', '#60a5fa', '#8b5cf6', '#a855f7', '#ec4899', 
    '#f43f5e', '#84cc16', '#06b6d4', '#6366f1', '#78716c'
];

// ---- State Variables ----
let tool = 'draw';
let color = '#60a5fa';
let cols = 24;
let rows = 24;
let grid = [];
let drawing = false;
let cellSize;

// ---- DOM Elements ----
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const gridSizeSelect = document.getElementById('gridSize');
const paletteEl = document.getElementById('palette');
const toolDrawBtn = document.getElementById('toolDraw');
const toolEraseBtn = document.getElementById('toolErase');
const toolFillBtn = document.getElementById('toolFill');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');

// ---- Initialization & Palette Setup ----
PALETTE.forEach(c => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch' + (c === color ? ' selected' : '');
    swatch.style.background = c;
    swatch.addEventListener('click', () => {
        color = c;
        colorPicker.value = c;
        updatePalette();
        setTool('draw');
    });
    paletteEl.appendChild(swatch);
});

function updatePalette() {
    document.querySelectorAll('.swatch').forEach((swatch, i) => {
        swatch.classList.toggle('selected', PALETTE[i] === color);
    });
}

function setColor(c) {
    color = c;
    updatePalette();
}

function setTool(t) {
    tool = t;
    toolDrawBtn.classList.toggle('active', t === 'draw');
    toolEraseBtn.classList.toggle('active', t === 'erase');
    toolFillBtn.classList.toggle('active', t === 'fill');
}

// ---- Grid & Canvas Functions ----
function resizeGrid() {
    const s = parseInt(gridSizeSelect.value);
    cols = rows = s;
    initGrid();
}

function initGrid() {
    grid = Array.from({ length: rows }, () => Array(cols).fill('#020617'));
    const maxW = Math.min(window.innerWidth - 48, 480);
    const maxH = Math.min(window.innerHeight - 220, 480);
    cellSize = Math.floor(Math.min(maxW / cols, maxH / rows));
    canvas.width = cellSize * cols;
    canvas.height = cellSize * rows;
    drawGrid();
}

function drawGrid() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            ctx.fillStyle = grid[r][c];
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
    }
    
    // Draw subtle grid lines
    ctx.strokeStyle = 'rgba(51,65,85,0.3)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellSize);
        ctx.lineTo(cols * cellSize, r * cellSize);
        ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellSize, 0);
        ctx.lineTo(c * cellSize, rows * cellSize);
        ctx.stroke();
    }
}

function getCell(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
    return { r: Math.floor(y / cellSize), c: Math.floor(x / cellSize) };
}

function paint(e) {
    const { r, c } = getCell(e);
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    
    if (tool === 'fill') {
        floodFill(r, c, grid[r][c]);
        drawGrid();
        return;
    }

    const targetColor = tool === 'erase' ? '#020617' : color;
    if (grid[r][c] === targetColor) return;

    grid[r][c] = targetColor;
    ctx.fillStyle = targetColor;
    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
    ctx.strokeStyle = 'rgba(51,65,85,0.3)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
}

function floodFill(r, c, target) {
    if (target === color || r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== target) return;
    grid[r][c] = color;
    floodFill(r + 1, c, target);
    floodFill(r - 1, c, target);
    floodFill(r, c + 1, target);
    floodFill(r, c - 1, target);
}

function clearGrid() {
    grid = Array.from({ length: rows }, () => Array(cols).fill('#020617'));
    drawGrid();
}

function saveArt() {
    const a = document.createElement('a');
    a.download = 'pixel-art.png';
    a.href = canvas.toDataURL();
    a.click();
}

// ---- Event Listeners ----
toolDrawBtn.addEventListener('click', () => setTool('draw'));
toolEraseBtn.addEventListener('click', () => setTool('erase'));
toolFillBtn.addEventListener('click', () => setTool('fill'));
colorPicker.addEventListener('input', (e) => setColor(e.target.value));
gridSizeSelect.addEventListener('change', resizeGrid);
clearBtn.addEventListener('click', clearGrid);
saveBtn.addEventListener('click', saveArt);

canvas.addEventListener('mousedown', (e) => { drawing = true; paint(e); });
canvas.addEventListener('mousemove', (e) => { if (drawing) paint(e); });
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseleave', () => drawing = false);

canvas.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    drawing = true; 
    paint(e); 
}, { passive: false });

canvas.addEventListener('touchmove', (e) => { 
    e.preventDefault(); 
    if (drawing) paint(e); 
}, { passive: false });

canvas.addEventListener('touchend', () => drawing = false);

// ---- Background Star Particles ----
const pCanvas = document.getElementById('particles');
const pCtx = pCanvas.getContext('2d');
let W, H, stars = [];

function resizeParticles() { 
    W = pCanvas.width = window.innerWidth; 
    H = pCanvas.height = window.innerHeight; 
}

function initStars() { 
    stars = []; 
    for (let i = 0; i < Math.floor((W * H) / 8000); i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.1 + 0.3,
            speed: Math.random() * 0.14 + 0.03,
            opacity: Math.random() * 0.45 + 0.1,
            ts: Math.random() * 0.01 + 0.003,
            to: Math.random() * Math.PI * 2
        });
    }
}

let t = 0;
function drawParticles() { 
    pCtx.clearRect(0, 0, W, H); 
    t += 0.016; 
    
    for (const s of stars) {
        pCtx.beginPath();
        pCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        pCtx.fillStyle = `rgba(148,197,255,${Math.max(0, s.opacity + Math.sin(t * s.ts * 60 + s.to) * 0.14)})`;
        pCtx.fill();
        
        s.y -= s.speed;
        if (s.y < -2) {
            s.y = H + 2;
            s.x = Math.random() * W;
        }
    } 
    requestAnimationFrame(drawParticles); 
}

// ---- Startup & Resize Handlers ----
initGrid();
resizeParticles(); 
initStars(); 
drawParticles();

window.addEventListener('resize', () => {
    resizeParticles();
    initStars();
    initGrid();
});
