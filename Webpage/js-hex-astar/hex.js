function Hex(x, y, col, row, side)
{
    const EMPTY_TILE = 0;
    const START_TILE = 1;
    const OBJECTIVE_TILE = 2;
    const OBSTACLE_TILE = 3;
    const TO_CHECK_TILE = 4;
    const CHECKED_TILE = 5;
    const OBJECTIVE_MET_TILE = 6;
    
    this.onOptimalPath = false;

    this.side = side;

    this.x = x;
    this.y = y;

    this.col = col;
    this.row = row;

    // AStar algorithm stuff
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.parent = null;

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

    this.distanceTo = function(other) {
        return Math.max(Math.abs(this.row - other.row), 
                    Math.abs(Math.ceil(other.row/-2) + other.col - Math.ceil(this.row/-2) - this.col), 
                    Math.abs(-other.row - Math.ceil(other.row /-2) - other.col + this.row + Math.ceil(this.row/-2) + this.col)
                    );
    }

    this.setEmpty = function() {
        this.onOptimalPath = false;
        this.typeIndicator = EMPTY_TILE;
        this.color = "rgb(192, 192, 192)";
    }

    this.isEmpty = function() {
        return this.typeIndicator == EMPTY_TILE;
    }

    this.setStart = function() {
        this.typeIndicator = START_TILE;
        this.color = "red";
    }

    this.isStart = function() {
        return this.typeIndicator == START_TILE;
    }

    this.setObjectiveNode = function() {
		this.onOptimalPath = false;
        this.typeIndicator = OBJECTIVE_TILE;
        this.color = "rgb(154, 205, 50)";
    }

    this.isObjectiveNode = function(){
        return this.typeIndicator == OBJECTIVE_TILE;
    }

    this.setObstacle = function() {
		this.onOptimalPath = false;
        this.typeIndicator = OBSTACLE_TILE;
        this.color = "rgb(96, 96, 96)";
    }

    this.isObstacle = function() {
        return this.typeIndicator == OBSTACLE_TILE;
    }

    this.setToCheck = function() {
        this.typeIndicator = TO_CHECK_TILE;

        if(!this.onOptimalPath) {
            this.color = "rgb(219, 169, 105)";
        }
    }

    this.isToCheck = function() {
        return this.typeIndicator == TO_CHECK_TILE;
    }

    this.setChecked = function() {
        this.typeIndicator = CHECKED_TILE;

        if(!this.onOptimalPath) {
            this.color = "rgb(255, 124, 40)";
        }
    }

    this.isChecked = function() {
        return this.typeIndicator == CHECKED_TILE;
    }

    this.setObjectiveMet = function() {
        this.typeIndicator = OBJECTIVE_MET_TILE;
        this.color = "green";
    }

    this.isMetObjective = function() {
        return this.typeIndicator == OBJECTIVE_MET_TILE;
    }

    this.setOptimalPath = function() {
        this.onOptimalPath = true;
        this.color = "rgb(250, 221, 13)";
    }

    this.isOptimalPath = function() {
        return this.onOptimalPath;
    }

    // Default tiles to empty
    this.setEmpty();
};