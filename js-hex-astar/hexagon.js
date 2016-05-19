// Originally authored by rrreese at https://github.com/rrreese/Hexagon.js
// Edited by Jacob Knispel, Alec Tiefenthal, & Jayanth Shankar for motion planning

// Hex math defined here: http://blog.ruslans.com/2011/02/hexagonal-grid-math.html

function HexagonGrid(canvasId, radius, originX, originY, rows, cols) {

    this.startTileExists = false;

    this.radius = radius;

    this.height = Math.sqrt(3) * radius;
    this.width = 2 * radius;
    this.rows = rows;
    this.cols = cols;

    this.side = (3 / 2) * radius;

    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext('2d');

    this.canvasOriginX = originX;
    this.canvasOriginY = originY;
    
    this.hexes = new Array(this.cols);
    for (var i=0; i<this.cols; i++) {
        this.hexes[i] = new Array(this.rows);
    }

    var offsetColumn = false;
    for (var col = 0; col < this.cols; col++) {
        for (var row = 0; row < this.rows; row++) {

            if (!offsetColumn) {
                currentHexX = (col * this.side) + originX;
                currentHexY = (row * this.height) + originY;
            } else {
                currentHexX = col * this.side + originX;
                currentHexY = (row * this.height) + originY + (this.height * 0.5);
            }

            this.hexes[col][row] = new Hex(currentHexX, currentHexY, col, row, this.side);
        }
        offsetColumn = !offsetColumn;
    }

    this.canvas.addEventListener("mousedown", this.clickEvent.bind(this), false);
};

HexagonGrid.prototype.drawHexGrid = function () {
    
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (var col = 0; col < this.cols; col++) {
        for (var row = 0; row < this.rows; row++) {
            this.hexes[col][row].draw(this.context, this.width, this.height);
        }
    }
};

function Hex(x, y, col, row, side)
{
    const EMPTY_TILE = 0;
    const START_TILE = 1;
    const OBJECTIVE_TILE = 2;
    const OBSTACLE_TILE = 3;

    this.side = side;

    this.x = x;
    this.y = y;

    this.col = col;
    this.row = row;

    this.draw = function(ctx, width, height) {
        ctx.strokeStyle = "#000";
        ctx.beginPath();
        ctx.moveTo(this.x + width - this.side, this.y);
        ctx.lineTo(this.x + this.side, this.y);
        ctx.lineTo(this.x + width, this.y + (height / 2));
        ctx.lineTo(this.x + this.side, this.y + height);
        ctx.lineTo(this.x + width - this.side, this.y + height);
        ctx.lineTo(this.x, this.y + (height / 2));

        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.closePath();
        ctx.stroke();
    }

    // This function clears the hexagon (instead of the whole canvas), then draws as normal
    this.clearAndDraw = function(ctx, width, height) {

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(this.x + width - this.side, this.y);
        ctx.lineTo(this.x + this.side, this.y);
        ctx.lineTo(this.x + width, this.y + (height / 2));
        ctx.lineTo(this.x + this.side, this.y + height);
        ctx.lineTo(this.x + width - this.side, this.y + height);
        ctx.lineTo(this.x, this.y + (height / 2));
        ctx.closePath()
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        this.draw(ctx, width, height);
    }

    this.setEmpty = function() {
        this.typeIndicator = EMPTY_TILE;
        this.color = "rgb(192, 192, 192)";
    }

    this.isEmpty = function() {
        return this.typeIndicator == EMPTY_TILE;
    }

    this.setStart = function() {
        this.typeIndicator = START_TILE;
        this.color = "rgb(255, 69, 0)";
    }

    this.isStart = function() {
        return this.typeIndicator == START_TILE;
    }

    this.setObjectiveNode = function() {
        this.typeIndicator = OBJECTIVE_TILE;
        this.color = "rgb(154, 205, 50)";
    }

    this.isObjectiveNode = function(){
        return this.typeIndicator == OBJECTIVE_TILE;
    }

    this.setObstacle = function() {
        this.typeIndicator = OBSTACLE_TILE;
        this.color = "rgb(96, 96, 96)";
    }

    // Default tiles to empty
    this.setEmpty();
};

HexagonGrid.prototype.clearHexes = function() {
    for (var col = 0; col < this.cols; col++) {
        for (var row = 0; row < this.rows; row++) {
            this.hexes[col][row].setEmpty();
        }
    }
    this.startTileExists = false;
    this.drawHexGrid();
}

//Recusivly step up to the body to calculate canvas offset.
HexagonGrid.prototype.getRelativeCanvasOffset = function() {
	var x = 0, y = 0;
	var layoutElement = this.canvas;
    if (layoutElement.offsetParent) {
        do {
            x += layoutElement.offsetLeft;
            y += layoutElement.offsetTop;
        } while (layoutElement = layoutElement.offsetParent);
        
        return { x: x, y: y };
    }
}

//Uses a grid overlay algorithm to determine hexagon location
//Left edge of grid has a test to accurately determine correct hex
HexagonGrid.prototype.getSelectedTile = function(mouseX, mouseY) {

	var offSet = this.getRelativeCanvasOffset();

    mouseX -= offSet.x;
    mouseY -= offSet.y;

    var column = Math.floor((mouseX) / this.side);
    var row = Math.floor(
        column % 2 == 0
            ? Math.floor((mouseY) / this.height)
            : Math.floor(((mouseY + (this.height * 0.5)) / this.height)) - 1);


    //Test if on left side of frame            
    if (mouseX > (column * this.side) && mouseX < (column * this.side) + this.width - this.side) {

        //Now test which of the two triangles we are in 
        //Top left triangle points
        var p1 = new Object();
        p1.x = column * this.side;
        p1.y = column % 2 == 0
            ? row * this.height
            : (row * this.height) + (this.height / 2);

        var p2 = new Object();
        p2.x = p1.x;
        p2.y = p1.y + (this.height / 2);

        var p3 = new Object();
        p3.x = p1.x + this.width - this.side;
        p3.y = p1.y;

        var mousePoint = new Object();
        mousePoint.x = mouseX;
        mousePoint.y = mouseY;

        if (this.isPointInTriangle(mousePoint, p1, p2, p3)) {
            column--;

            if (column % 2 != 0) {
                row--;
            }
        }

        //Bottom left triangle points
        var p4 = new Object();
        p4 = p2;

        var p5 = new Object();
        p5.x = p4.x;
        p5.y = p4.y + (this.height / 2);

        var p6 = new Object();
        p6.x = p5.x + (this.width - this.side);
        p6.y = p5.y;

        if (this.isPointInTriangle(mousePoint, p4, p5, p6)) {
            column--;

            if (column % 2 == 0) {
                row++;
            }
        }
    }

    return {x: column, y: row};
};

HexagonGrid.prototype.sign = function(p1, p2, p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

HexagonGrid.prototype.isPointInTriangle = function isPointInTriangle(pt, v1, v2, v3) {
    var b1, b2, b3;

    b1 = this.sign(pt, v1, v2) < 0.0;
    b2 = this.sign(pt, v2, v3) < 0.0;
    b3 = this.sign(pt, v3, v1) < 0.0;

    return ((b1 == b2) && (b2 == b3));
};

HexagonGrid.prototype.clickEvent = function (e) {

    var mouseX = e.pageX;
    var mouseY = e.pageY;

    var localX = mouseX - this.canvasOriginX;
    var localY = mouseY - this.canvasOriginY;

    var pos = this.getSelectedTile(localX, localY);
    if(pos.x < this.cols && pos.y < this.rows && pos.x >= 0 && pos.y >= 0)
    {
        var tile = this.hexes[pos.x][pos.y];

        if (!tile.isEmpty()) { // Any click on a nonempty tile

            if(tile.isStart()) {
                this.startTileExists = false;
            }

            tile.setEmpty();
        }
        else if(!this.startTileExists) { // Any click when a start tile doesn't exist yet
            tile.setStart();
            this.startTileExists = true;
        }
        else if(e.which == 1) { // Left click
            tile.setObstacle();
        }
        else if(e.which == 3) { // Right click
            tile.setObjectiveNode();
        }

        tile.clearAndDraw(this.context, this.width, this.height);
    }
};