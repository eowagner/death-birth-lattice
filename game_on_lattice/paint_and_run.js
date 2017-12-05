const colors = ["#800080", "#008000"]; //Purple and Green -- complementary colors

var canvas;
var info_canvas;

var game = new StrategicFormGame(stag_hunt_matrix);
var net = new DynamicLattice(game);
net.reset(96, 96);

var running = true; 
var steps_per_second = 100000;
var timing_info = convert_to_interval_aggregate(steps_per_second);
var ms_per_draw = timing_info[0];
var steps_per_draw = timing_info[1];

//Javascript cannot update faster than once every 10ms
var timerID;

//Operates logrithically
function time_slider_change(input) {
	clearInterval(timerID);

	var steps_per_second = Math.pow(10, input);
  	document.getElementById('db_per_sec_span').innerHTML = steps_per_second;

	timing_info = convert_to_interval_aggregate(steps_per_second);
	ms_per_draw = timing_info[0];
	steps_per_draw = timing_info[1];

	timerID = setInterval(one_drawing_step, ms_per_draw);
}

//Operates logrithmically.  Options chosen so that agent size will be a perfect square and the lattice will fit exactly in an 768 x 768 canvas
function agents_slider_change(input) {
	clearInterval(timerID);

	var num_agents_along_side = 3 * Math.pow(2, input);
	document.getElementById('agents_span').innerHTML = num_agents_along_side + " x " + num_agents_along_side + " = " + num_agents_along_side*num_agents_along_side + " total agents";

	net.reset(num_agents_along_side, num_agents_along_side);
	draw_lattice(canvas, net);

	timerID = setInterval(one_drawing_step, ms_per_draw);
}

function mut_slider_change(input) {
	document.getElementById('mut_span').innerHTML = parseFloat(input).toFixed(2);

	net.mutation_prob = input;
}

function start_pause_click() {
	if (running) {
		clearInterval(timerID);
		document.getElementById('start_pause_button').innerText = 'Start';
		running = false;
	}
	else {
		timerID = setInterval(one_drawing_step, ms_per_draw);
		document.getElementById('start_pause_button').innerText = 'Pause';
		running = true;
	}
}

function radio_click() {
	var m = [ [1, 0], [0, 1]];

	if (document.getElementById('rad_SH').checked) {
		m = stag_hunt_matrix;
	}
	else if (document.getElementById('rad_ASH').checked) {
		m = aumann_stag_hunt_matrix;
	}
	else if (document.getElementById('rad_PD1').checked) {
		m = prisoners_dilemma_cooperation_possible_matrix;
	}
	else if (document.getElementById('rad_PD2').checked) {
		m = prisoners_dilemma_matrix;
	}
	else if (document.getElementById('rad_PC').checked) {
		m = pure_coordination_matrix;
	}
	else if (document.getElementById('rad_AC').checked) {
		m = anticoordination_matrix
	}

	document.getElementById('t00').value = m[0][0];
	document.getElementById('t10').value = m[1][0];
	document.getElementById('t01').value = m[0][1];
	document.getElementById('t11').value = m[1][1];

	reset_click();
}

function reset_click() {
	var matrix = [ [1, 1], [1, 1] ];

	matrix[0][0] = document.getElementById('t00').value;
	matrix[0][1] = document.getElementById('t01').value;
	matrix[1][0] = document.getElementById('t10').value;
	matrix[1][1] = document.getElementById('t11').value;

	matrix[0] = matrix[0].map(parseFloat);
	matrix[1] = matrix[1].map(parseFloat);

	var flattened = matrix.reduce( (a, b) => {return a.concat(b);});

	if (flattened.some(x => isNaN(x))) {
		alert("All entries in the game's payoff matrix must be numbers");
		return;
	}

	// Transform the payoff matrix so that every entry is positive
	var minimum = Math.min.apply(null, flattened);
	if (minimum < 0) {
		matrix = matrix.map(r => r.map(x => x+(-1*minimum)));
	}

	if (running) {
		clearInterval(timerID);
	}

	game.payoff_matrix = matrix;
	net.game = game;

	net.reset_null();
	draw_lattice(canvas, net);

	if (running) {
		timerID = setInterval(one_drawing_step, ms_per_draw);
	}
}

//Returns a list: [ms interval, number of steps to do each interval]
function convert_to_interval_aggregate(steps_per_second) {
	var ms_per_step = 1000/steps_per_second;
	var agg = 1;

	if (ms_per_step < 10) {
		agg = 10/ms_per_step;
		ms_per_step = 10;
	}

	return [Math.floor(ms_per_step), Math.floor(agg)];
}

function draw_lattice(canvas, lattice) {
	var ctx = canvas.getContext("2d");

	var node_height = canvas.height / lattice.agents.length;
	var node_width = canvas.width / lattice.agents[0].length;

	for (var r=0; r<lattice.agents.length; r++) {
		for (var c=0; c<lattice.agents[0].length; c++) {
			var loc = [Math.floor(c*node_width), Math.floor(r*node_height)];

			if (lattice.agents[r][c] == 0) {
				ctx.fillStyle = colors[0];
			}
			else {
				ctx.fillStyle = colors[1];
			}
			ctx.fillRect(loc[0], loc[1], node_width, node_height);
		}
	}
}

function draw_lattice_loc(canvas, lattice, pos) {
	var ctx = canvas.getContext("2d");

	var node_height = canvas.height / lattice.agents.length;
	var node_width = canvas.width / lattice.agents[0].length;

	var loc = [Math.floor(pos[1]*node_width), Math.floor(pos[0]*node_height)];

	if (lattice.agents[pos[0]][pos[1]] == 0) {
		ctx.fillStyle = colors[0];
	}
	else {
		ctx.fillStyle = colors[1];
	}
	ctx.fillRect(loc[0], loc[1], node_width, node_height);
}

function draw_aggregate_info(canvas, lattice) {
	var freqs = lattice.aggregate_frequencies();

	var ctx = canvas.getContext("2d");

	var vert_offset = 25;

	var total_length = canvas.width;
	var height = canvas.height;

	var width_bar_0 = Math.floor(freqs[0] * total_length);
	var width_bar_1 = total_length - width_bar_0;

	var freq_labels = freqs.map( (x) => {return (Math.round(100 * x) / 1).toString() + "%";} );

	ctx.fillStyle = "#D0D0D0";
	ctx.font = '18pt serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	ctx.fillRect(0, 0, total_length, vert_offset);

	ctx.fillStyle = colors[0];
	ctx.fillRect(0, vert_offset, width_bar_0, height-vert_offset);
	if (freqs[0] > .1) {
		ctx.fillText(freq_labels[0], width_bar_0/2, vert_offset/2);
	}

	ctx.fillStyle = colors[1];
	ctx.fillRect(width_bar_0, vert_offset, total_length-width_bar_0, height-vert_offset);
	if (freqs[1] > .1) {
		ctx.fillText(freq_labels[1], width_bar_0 + width_bar_1/2, vert_offset/2);
	}
}

function one_drawing_step() {
	for(var i=0; i<steps_per_draw; i++) {
		var pos = net.step_death_birth();
		draw_lattice_loc(canvas, net, pos);
	}

	draw_aggregate_info(info_canvas, net);
}

//Start the action
$( document ).ready(function() {    
    canvas = document.getElementById("myCanvas");
	info_canvas = document.getElementById("info_canvas");

	draw_lattice(canvas, net);
	timerID = setInterval(one_drawing_step, ms_per_draw);
});