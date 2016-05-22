// Originally authored by rrreese at https://github.com/rrreese/Hexagon.js
// Edited by Advanced Graphics motion planning team

// Hex math defined here: http://blog.ruslans.com/2011/02/hexagonal-grid-math.html

function HexagonGrid(canvasId, radius, originX, originY, rows, cols) {

    this.startTile = false;

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

HexagonGrid.prototype.clearHexes = function() {
    for (var col = 0; col < this.cols; col++) {
        for (var row = 0; row < this.rows; row++) {
            this.hexes[col][row].setEmpty();
        }
    }
    this.startTile = false;
    clearBoard = false;
    this.drawHexGrid();
}

HexagonGrid.prototype.clearCheckedAndToCheck = function() {
    for (var col = 0; col < this.cols; col++) {
        for (var row = 0; row < this.rows; row++) {
            var hex = this.hexes[col][row];
            if(hex.isToCheck() || hex.isChecked()) {
                if(hex.isOptimalPath()) {
                    this.hexes[col][row].setEmpty();
                    this.hexes[col][row].setOptimalPath();
                }
                else {
                    this.hexes[col][row].setEmpty();
                }
            }
        }
    }
    this.drawHexGrid();
}

HexagonGrid.prototype.resetForRunningAlgorithm = function() {
    for (var col = 0; col < this.cols; col++) {
        for (var row = 0; row < this.rows; row++) {
            var hex = this.hexes[col][row];
            hex.f = 0;
            hex.g = 0;
            hex.h = 0;
            hex.parent = null;

            if(hex.isChecked() || hex.isToCheck() || hex.isOptimalPath()) {
                hex.setEmpty();
            }
            else if(hex.isMetObjective()) {
                hex.setObjectiveNode();
            }
        }
    }
    this.drawHexGrid();
}

HexagonGrid.prototype.getHexNeighbors = function(hex) {

    var neighbors = [];

    if(hex) {
        var x = hex.col;
        var y = hex.row;

        // Accounts for the staggered columns
        var wAdj = hex.col % 2;
        var eAdj = 1 - wAdj;

        if(this.hexes[x-1]) {
            if(this.hexes[x-1][y-1+wAdj]) {
                neighbors.push(this.hexes[x-1][y-1+wAdj]); // NW
            }
            if(this.hexes[x-1][y+wAdj]) {
                neighbors.push(this.hexes[x-1][y+wAdj]); // SW
            }
        }
        if(this.hexes[x]) {
            if(this.hexes[x][y-1]) {
                neighbors.push(this.hexes[x][y-1]); // N
            }
            if(this.hexes[x][y+1]) {
                neighbors.push(this.hexes[x][y+1]); // S
            }
        }
        if(this.hexes[x+1]) {
            if(this.hexes[x+1][y-eAdj]) {
                neighbors.push(this.hexes[x+1][y-eAdj]); // NE
            }
            if(this.hexes[x+1][y+1-eAdj]) {
                neighbors.push(this.hexes[x+1][y+1-eAdj]); // SE
            }
        }
    }

    return neighbors;
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

        if (!(tile.isEmpty() || tile.isChecked() || tile.isToCheck() || tile.isOptimalPath())) { // Any click on a nonempty tile

            if(tile.isStart()) {
                this.startTile = false;
            }

            tile.setEmpty();
        }
        else if(!this.startTile) { // Any click when a start tile doesn't exist yet
            tile.setStart();
            this.startTile = tile;
        }
        else if(e.which == 1) { // Left click
            tile.setObstacle();
        }
        else if(e.which == 3) { // Right click
            tile.setObjectiveNode();
        }

        this.clearAndDrawHex(tile);
    }
};

HexagonGrid.prototype.clearAndDrawHex = function(hex) {
    hex.clearAndDraw(this.context, this.width, this.height);
}