//agents is expected to be an n x n matrix
function Lattice(game) {
	this.agents = [];
	this.game = game;

	this.reset_null = function() {
		this.reset(this.agents.length, this.agents[0].length);
	}

	this.reset = function(rows, cols) {
		// this.agents = Array(rows).fill(Array(cols));
		this.agents = new Array(rows);
		var num_strats = this.game.get_num_strats();

		for(var r=0; r<rows; r++) {
			this.agents[r] = new Array(cols);
			for (var c=0; c<cols; c++) {
				this.agents[r][c] = Math.floor(Math.random() * num_strats);
			}
		}
	}

	this.get_random_agent = function() {
		var row = Math.floor(Math.random() * this.agents.length);
		var col = Math.floor(Math.random() * this.agents[0].length);

		return [row, col];
	}

	this.get_neighbors_vonNeumann = function(loc) {
		var nRows = this.agents.length;
		var nCols = this.agents[0].length;

		var neighborList = new Array(4);

		var adj_r = (loc[0]-1 < 0) ? nRows-1 : loc[0]-1;
		neighborList[0] = [adj_r, loc[1]];

		var adj_c = (loc[1]+1 >= nCols) ? 0 : loc[1]+1;
		neighborList[1] = [loc[0], adj_c];

		adj_r = (loc[0]+1 >= nRows) ? 0 :loc[0]+1;
		neighborList[2] = [adj_r, loc[1]];

		adj_c = (loc[1]-1 < 0) ? nCols-1 : loc[1]-1;
		neighborList[3] = [loc[0], adj_c];

		return neighborList;
	}

	this.get_neighbors_Moore8 = function(loc) {
		var nRows = this.agents.length;
		var nCols = this.agents[0].length;

		var neighborList = new Array(8);

		var i = 0;
		for(var r = loc[0]-1;  r<=loc[0]+1; r++) {
			var adj_r = r;
			if (adj_r < 0) {
				adj_r = this.agents.length-1;
			}
			else if (adj_r > this.agents.length-1){
				adj_r = 0;
			}


			for(var c = loc[1]-1; c<=loc[1]+1; c++) {
				var adj_c = c;
				if (adj_c < 0) {
					adj_c = this.agents[0].length-1;
				}
				else if (adj_c > this.agents[0].length-1) {
					adj_c = 0
				}

				if (r != loc[0] || c != loc[1]) {
					neighborList[i] = [adj_r, adj_c];
					i++;
				}
			}
		}

		return neighborList;
	}

	this.get_neighbors = function(loc) {
		return this.get_neighbors_vonNeumann(loc);
	}

	this.get_average_payoff = function(loc) {
		var neighbors = this.get_neighbors(loc);
		var focal_strat = this.agents[loc[0]][loc[1]];
		var agents = this.agents;

		var neighbor_strats = neighbors.map( function(pos) {
			return agents[pos[0]][pos[1]];
		});

		game_temp = this.game;
		var payoffs_against = neighbor_strats.map( function(strat) {
			return game_temp.get_payoff(focal_strat, strat);
		});

		var total_payoff = payoffs_against.reduce( function(sum, value) {
			return sum + value;
		}, 0);

		return total_payoff / neighbors.length;
	}

	this.get_average_payoff_of_each_neighbor = function(loc) {
		var neighbors = this.get_neighbors(loc);
		var neighbors_avg_payoff = new Array(neighbors.length);

		for (var i=0; i<neighbors.length; i++) {
			neighbors_avg_payoff[i] = this.get_average_payoff(neighbors[i]);
		}

		return neighbors_avg_payoff;
	}

	this.get_random_neighbor_prob_prop_to_payoff = function(loc) {
		var neighbors = this.get_neighbors(loc);
		var avg_payoff_each_neighbor = this.get_average_payoff_of_each_neighbor(loc);

		var total = avg_payoff_each_neighbor.reduce( function(sum, value) {
			return sum + value;
		}, 0);

		if (total==0) {
			total = neighbors.length;
			avg_payoff_each_neighbor = avg_payoff_each_neighbor.map( (x) => {return 1;} );
		}

		var normalized_payoff_each_neighbor = avg_payoff_each_neighbor.map( function(num) {
			return num/total;
		});

		var r = Math.random();

		var counter = 0;
		for (var i=0; i<neighbors.length; i++) {
			counter += normalized_payoff_each_neighbor[i];

			if (r<= counter) {
				return neighbors[i];
			}
		}

		return null;
	}

	this.get_random_neighbor = function(loc) {
		var neighbors = this.get_neighbors(loc);

		var rand = Math.floor(Math.random() * neighbors.length);

		return neighbors[rand];
	}

	this.get_random_agent_prob_prop_to_payoff = function() {
		var payoffs = new Array(this.agents.length);

		for (let r=0; r<payoffs.length; r++) {
			payoffs[r] = new Array(this.agents[r].length);

			for(let c=0; c<payoffs[r].length; c++) {
				payoffs[r][c] = this.get_average_payoff([r,c]);
			}
		}

		var total = payoffs.reduce( function(acc, el) {
			return acc + el.reduce( (t, x) => {return t+x;}, 0);
		}, 0);

		var normalized = payoffs.map( function(row) {
			return row.map( (x) => {return x/total;} );
		});

		var rand = Math.random();
		var agg = 0

		for (let r=0; r<payoffs.length; r++) {
			for(let c=0; c<payoffs[0].length; c++) {
				agg += normalized[r][c];
				if (agg > rand) {
					return [r, c];
				}
			}
		}

		return null;
	}

	//Returns the location at which the change occured 
	this.step_death_birth = function() {
		var death_loc = this.get_random_agent();
		var reproducer_loc = this.get_random_neighbor_prob_prop_to_payoff(death_loc, this.game);

		this.agents[death_loc[0]][death_loc[1]] = this.agents[reproducer_loc[0]][reproducer_loc[1]];

		return death_loc;
	}

	//Returns the location at which the change occured
	this.step_birth_death = function() {
		var reproducer_loc = this.get_random_agent_prob_prop_to_payoff();
		var death_loc = this.get_random_neighbor(reproducer_loc);

		this.agents[death_loc[0]][death_loc[1]] = this.agents[reproducer_loc[0]][reproducer_loc[1]];

		return death_loc;
	}

	this.aggregate_frequencies = function() {
		//First flatten the matrix
		var flat = this.agents.reduce( (a, b) => {return a.concat(b);});

		var init_counts = new Array(this.game.get_num_strats());
		init_counts.fill(0);

		var counts = flat.reduce( function(accumulator, element) {
			accumulator[element]++;
			return accumulator;
		}, init_counts);

		var total = counts.reduce( (sum, a) => {return sum+a;}, 0);

		var freqs = counts.map( (a) => {return a/total;} );

		return freqs;
	}

}




