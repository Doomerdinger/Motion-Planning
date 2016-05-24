// Implementation of a* search

var running = false;

var regularHeuristic = true;

var nodesVisited = 0;

function getSimTick(sliderId) {
	return document.getElementById(sliderId).value;
}

function howManyNodesVisited(){
	nodesVisited += closedList.length;
	document.getElementById('nv').innerHTML = "Number of Nodes Visited: " + nodesVisited;

}

function resetNodesVisited(){
	nodesVisited = 0;
	document.getElementById('nv').innerHTML = "Number of Nodes Visited: " + nodesVisited;

}

function runAStar(hexGrid, sliderId) {

	if(running) {
		alert("Algorithm already in progress!");
		return;
	}

	hexGrid.resetForRunningAlgorithm();

	if(!hexGrid.startTile) {
		alert("No start node was defined, nothing to do!");
		return;
	}

	document.getElementById('nv').innerHTML = "Number of Nodes Visited: " + nodesVisited;
	var whileLoop = function(slowEval) {

			if (openList.length == 0)
			{
				running = false;
				alert("No solution found!");
				return null;
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
				howManyNodesVisited();

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
					running = false;
					return hex.f;
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

			if(!hex.isStart() && !hex.isMetObjective() && !hex.isOptimalPath()) {
				hex.setChecked();
				hexGrid.clearAndDrawHex(hex);
			}

		    var neighbors = hexGrid.getHexNeighbors(hex);
	        for(var i=0; i<neighbors.length; i++) {
	        	var n = neighbors[i];

	        	//The node we're going for isn't the best, so update
	        	if(n.isObjectiveNode() && n != endHex) {
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

        	if(slowEval) {
        		var tick_ms = getSimTick(sliderId);
				setTimeout(function() {whileLoop(tick_ms != 0)}, tick_ms);
			}
			else {
				whileLoop(false);
			}
		}

	running = true;

	openList = [];
	openList.push(hexGrid.startTile);

	closedList = [];

	goalList = chooseGoals(hexGrid);
	if(goalList.length == 0) {
		alert("No waypoints set -- set objectives with RMB!");
		return;
	}

	var endHex = goalList[0];

	whileLoop(true);
}

function toggleHeuristic(){
	regularHeuristic = !regularHeuristic;
}

function computeH(currHex, endHex) {
	// return Math.abs(currHex.col - endHex.col) + Math.abs(currHex.row - endHex.row); // Manhattan dist

	if(regularHeuristic){
		return currHex.distanceTo(endHex); //Simple distance calculation
	}
	return Math.max( Math.abs(currHex.row - endHex.row), Math.abs(Math.ceil(endHex.row/-2)+ endHex.col - Math.ceil(currHex.row/-2) - currHex.col), Math.abs(-endHex.row - Math.ceil(endHex.row /-2) - endHex.col + currHex.row  + Math.ceil(currHex.row/-2) +currHex.col ));
	// Hexagonal grid distance(taking into account 6 possible neighbors to travel)
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
