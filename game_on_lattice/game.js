function StrategicFormGame(payoff_matrix) {
	this.payoff_matrix = payoff_matrix;

	this.get_payoff = function(strat1, strat2) {
		return this.payoff_matrix[strat1][strat2];
	}

	this.get_num_strats = function() {
		return this.payoff_matrix.length; 
	}
}



const prisoners_dilemma_matrix = [ [3, 0], [4, 1] ];

const prisoners_dilemma_cooperation_possible_matrix = [ [5, 0], [6, 1]];
// const prisoners_dilemma_cooperation_possible_matrix = [ [10, 0], [11, 1]];  //Appropriate numbers for Moore-8 neighborhood

// const stag_hunt_matrix = [ [5.5, 0], [3, 3] ]; //This seemed to yield cooperation for the Moore-8 neighborhood
const stag_hunt_matrix = [ [5, 0], [3, 3] ]; 

const aumann_stag_hunt_matrix = [ [9,0], [8,7] ];

const pure_coordination_matrix = [ [1,0], [0,1] ];

const hawk_dove_matrix = [ [0, 3], [1, 2]];

const anticoordination_matrix = [ [0, 1], [1, 0]];

