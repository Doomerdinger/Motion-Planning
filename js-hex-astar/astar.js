// Implementation of a* search

function runAStar(hexGrid) {

	hexGrid.resetForRunningAlgorithm();

	if(!hexGrid.startTile) {
		alert("No start node was defined, nothing to do!");
		return;
	}

	var endHex = chooseGoal(hexGrid);
	if(!endHex) {
		alert("No waypoints set -- set objectives with RMB!");
		return;
	}

	openList = [];
	openList.push(hexGrid.startTile);

	closedList = [];

	var success = false;

	var whileLoop = function() {

			if (openList.length == 0)
			{
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
			if(hex.isObjectiveNode()) {
				openList = [];
				openList.push(hex);
				hex.setObjectiveMet();

				// Modify the status of the hexes that were on the optimal path
				var current = hex;
				while(current.parent) {
					if(current != hex) {
						current.setOptimalPath();
					}
					hexGrid.clearAndDrawHex(current);
					current = current.parent;
				}

				success = true;
				return;
			}

			// Remove this hex from the open list
			openList.splice(lowIndex, 1);
			closedList.push(hex);

			if(!hex.isStart()) {
				hex.setChecked();
				hexGrid.clearAndDrawHex(hex);
			}

		    var neighbors = hexGrid.getHexNeighbors(hex);
	        for(var i=0; i<neighbors.length; i++) {
	        	var n = neighbors[i];

	        	// No need to add obstacles or already-added hexes
	        	if(n.isObstacle() || contains(closedList, n)) {
	        		continue;
	        	}

	        	var g = hex.g + 1; // Distance to the start position is one greater than before
	        	var bestG = false;

	        	// We have never seen this hex before
	        	if(!contains(openList, n)) {
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

	        setTimeout(whileLoop, 50);
		}

	setTimeout(whileLoop, 50);

	hexGrid.drawHexGrid();
}

function computeH(currHex, endHex) {
	// return Math.abs(currHex.col - endHex.col) + Math.abs(currHex.row - endHex.row); // Manhattan dist
	return Math.sqrt(Math.pow(currHex.col - endHex.col, 2) + Math.pow(currHex.row - endHex.row, 2)); // True dist
}

function contains(list, hex) {
	for(var i=0; i<list.length; i++) {
		if(list[i] == hex) {
			return true;
		}
	}
	return false;
}

function chooseGoal(hexGrid) {
	for (var col = 0; col < hexGrid.cols; col++) {
        for (var row = 0; row < hexGrid.rows; row++) {
            var hex = hexGrid.hexes[col][row];
            if(hex.isObjectiveNode()) {
            	return hex; // TODO: currently just goes for the first objective node it sees!
            }
        }
    }
}