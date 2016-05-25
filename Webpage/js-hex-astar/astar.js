// Implementation of a* search
//

var running = false;
var abort = false;
var clearBoard = false;

// Get the value of the slider bar determining simulation speed
function getSimTick(sliderId) {
	return document.getElementById(sliderId).value;
}

function runAlgorithm() {
	if(running) {
        abort = true;
    }
    else if(!hexagonGrid.startTile) {
    	alert("No start node was defined, nothing to do!");
		return;
    }
    else {
        document.getElementById("runbtn").textContent = 'Abort';
        updateVisitedNodes(0);
        runAStar(hexagonGrid, 'slider');
    }
}

function endAlgorithm() {
	abort = false;
	running = false;

	document.getElementById("runbtn").textContent = "Run";
}

function updateVisitedNodes(visitedNodes) {
	document.getElementById("info-hud").innerHTML = "Nodes visited: " + visitedNodes;
}

function runAStar(hexGrid, sliderId) {

	hexGrid.resetForRunningAlgorithm();

	var whileLoop = function(slowEval) {

			// Command to abort the algorithm has been issued
			if (abort) {
				if (clearBoard) {
					hexGrid.clearHexes();
				}
				endAlgorithm();
				return;
			}

			if (openList.length == 0) {
				endAlgorithm();
				alert("No solution found!");
				return;
			}

			// First, find the node in openList with the lowest f(x)
			var lowIndex = 0;
			for(var i=0; i<openList.length; i++) {
				if(openList[i].f < openList[lowIndex].f) {
					lowIndex = i;
				}
			}
			var hex = openList[lowIndex];

			// Reached an objective -- break and choose a new objective point
			if(hex == endHex) {
				hex.setObjectiveMet();

				// Modify the status of the hexes that were on the optimal path
				var current = hex;
				while(current.parent) {
					if(current != hex) {
						current.setOptimalPath();
					}
					hexGrid.clearAndDrawHex(current);

					var temp = current.parent;
					current.parent = null;
					current = temp;
				}

				goalList.splice(0, 1);
				if(goalList.length == 0) {
					endAlgorithm();
					return;
				}

				// There are still goals left
				hexGrid.clearCheckedAndToCheck();
				endHex = goalList[0];
				openList = [];
				openList.push(endHex);
				closedList = [];

				lowIndex = 0;
			}

			// Remove this hex from the open list
			openList.splice(lowIndex, 1);
			closedList.push(hex);
			updateVisitedNodes(++visitedNodes);

			if(!hex.isStart() && !hex.isMetObjective() && !hex.isOptimalPath()) {
				hex.setChecked();
				hexGrid.clearAndDrawHex(hex);
			}

		    var neighbors = hexGrid.getHexNeighbors(hex);
	        for(var i=0; i<neighbors.length; i++) {
	        	var n = neighbors[i];

	        	//The node we're going for isn't the best, so update (this is unnecessary, but results in better pathing)
	        	if(n.isObjectiveNode() && n != endHex) {

	        		//First make sure our original goal isn't already nearby
	        		var goalNearby = false;
	        		for(var j=0; j<neighbors.length; j++) {
	        			if(neighbors[j] == endHex) {
	        				goalNearby = true;
	        				break;
	        			}
	        		}

	        		if(!goalNearby) {
		        		hexGrid.clearCheckedAndToCheck();
		        		for(var j=0; j<goalList.length; j++) {
		        			if(goalList[j] == n) {
		        				goalList.splice(j, 1);
		        				break;
		        			}
		        		}
		        		goalList.unshift(n);
		        		openList = [];
		        		openList.push(closedList[0]);
		        		endHex = n;
		        		closedList = [];
		        		break;
		        	}
	        	}

	        	// No need to add obstacles or already-added hexes
	        	if(n.isObstacle() || n.isChecked()) {
	        		continue;
	        	}

	        	var g = hex.g + 1; // Distance to the start position is one greater than before
	        	var bestG = false;

	        	// We have never seen this hex before
	        	if(!n.isToCheck() && !n.isStart() && !n.isMetObjective()) {
	        		bestG = true;
	        		n.h = computeH(n, endHex); // since we've never seen it, we need to compute its h val

	        		if(!n.isObjectiveNode()) {
	        			n.setToCheck();
	        			hexGrid.clearAndDrawHex(n);
	        		}

	        		openList.push(n);
	        	}
	        	// We've seen this hex, but it had a lower g before so update it
	        	else if(g < n.g) {
	        		bestG = true;
	        	}

	        	if(bestG) {
	        		n.parent = hex;
	        		n.g = g;
	        		n.f = n.g + n.h; // f(x) = g(x) + h(x)
	        	}

	            hexGrid.clearAndDrawHex(n);
	        }

	        // Determines speed of evaluation based on the slider
        	if(slowEval) {
        		var tick_ms = getSimTick(sliderId);
				setTimeout(function() {whileLoop(tick_ms != 0)}, tick_ms);
			}
			else {
				whileLoop(false);
			}
		}

	openList = [];
	openList.push(hexGrid.startTile);

	closedList = [];

	goalList = chooseGoals(hexGrid);
	if(goalList.length == 0) {
		endAlgorithm();
		alert("No waypoints set -- set objectives with RMB!");
		return;
	}

	var endHex = goalList[0];
	var visitedNodes = 0;

	running = true;
	whileLoop(true);
}

function computeH(currHex, endHex) {
	// Manhattan distance
	//return Math.abs(currHex.col - endHex.col) + Math.abs(currHex.row - endHex.row); // Manhattan (city block) dist
	
	// Uses real distance function
	//return currHex.distanceTo(endHex);
	
	// Diagonal shortcut
	var xDistance = Math.abs(currHex.col - endHex.col);
	var yDistance = Math.abs(currHex.row - endHex.row);
	if(xDistance > yDistance) {
		return 1.4*yDistance + (xDistance - yDistance);
	} else {
		return 1.4*xDistance + (yDistance - xDistance);
	}
}

function chooseGoals(hexGrid) {
	var goals = [];
	var allGoals = [];

	for (var col = 0; col < hexGrid.cols; col++) {
        for (var row = 0; row < hexGrid.rows; row++) {
            var hex = hexGrid.hexes[col][row];

            if(hex.isObjectiveNode()) {
            	allGoals.push(hex);
            }
        }
    }

    var currentComparator = hexGrid.startTile;
	while (allGoals.length != 0) {
		var nearestIndex = 0;
    	var nearestHex = allGoals[0];
		var dist = currentComparator.distanceTo(allGoals[0]);

		for (var i = 1; i < allGoals.length; i++) {
            var hex = allGoals[i];

    		var newDist = hexGrid.startTile.distanceTo(hex);
    		if(newDist < dist) {
    			dist = newDist;
    			nearestHex = hex;
    			nearestIndex = i;
    		}
	    }

	    currentComparator = nearestHex;
    	goals.push(nearestHex);
    	allGoals.splice(nearestIndex, 1);
	}

    return goals;
}