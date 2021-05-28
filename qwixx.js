/* Scott Clayton 2021 */
var app = new Vue({
    el: '#qwixx',
    data: {
        red: [],
        yellow: [],
        green: [],
        blue: [],

        penalty: 0,

        dice: [
            { color: 0, value: 1 },
            { color: 1, value: 1 },
            { color: 2, value: 1 },
            { color: 3, value: 1 },
            { color: -1, value: 1 },
            { color: -1, value: 1 },
        ],

        redLocked: false,
        yellowLocked: false,
        greenLocked: false,
        blueLocked: false,

        worker: null,
        best: null,
    },
    computed: {
        redUi: function () {
            var list = this.red;
            for (var i = 0; i < list.length; i++) {
                list[i].recommended = false;
                list[i].score = -1;
            }
            if (this.best != null) {
                for (var i = 0; i < this.best.length; i++) {
                    if (this.best[i].color == 0) {
                        list[this.best[i].value - 2].score = Math.round(10 * this.best[i].score / this.best[i].simulations) / 10;
                        list[this.best[i].value - 2].recommended = list[this.best[i].value - 2].score == this.bestScore;
                    }
                }
            }
            return list;
        },
        yellowUi: function () {
            var list = this.yellow;
            for (var i = 0; i < list.length; i++) {
                list[i].recommended = false;
                list[i].score = -1;
            }
            if (this.best != null) {
                for (var i = 0; i < this.best.length; i++) {
                    if (this.best[i].color == 1) {
                        list[this.best[i].value - 2].score = Math.round(10 * this.best[i].score / this.best[i].simulations) / 10;
                        list[this.best[i].value - 2].recommended = list[this.best[i].value - 2].score == this.bestScore;
                    }
                }
            }
            return list;
        },
        greenUi: function () {
            var list = this.green;
            for (var i = 0; i < list.length; i++) {
                list[i].recommended = false;
                list[i].score = -1;
            }
            if (this.best != null) {
                for (var i = 0; i < this.best.length; i++) {
                    if (this.best[i].color == 2) {
                        list[12 - this.best[i].value].score = Math.round(10 * this.best[i].score / this.best[i].simulations) / 10;
                        list[12 - this.best[i].value].recommended = list[12 - this.best[i].value].score == this.bestScore;
                    }
                }
            }
            return list;
        },
        blueUi: function () {
            var list = this.blue;
            for (var i = 0; i < list.length; i++) {
                list[i].recommended = false;
                list[i].score = -1;
            }
            if (this.best != null) {
                for (var i = 0; i < this.best.length; i++) {
                    if (this.best[i].color == 3) {
                        list[12 - this.best[i].value].score = Math.round(10 * this.best[i].score / this.best[i].simulations) / 10;
                        list[12 - this.best[i].value].recommended = list[12 - this.best[i].value].score == this.bestScore;
                    }
                }
            }
            return list;
        },
        penaltyUi: function () {
            if (this.best != null) {
                for (var i = 0; i < this.best.length; i++) {
                    if (this.best[i].color == -1) {
                        return {
                            recommended: Math.round(10 * this.best[i].score / this.best[i].simulations) / 10 == this.bestScore,
                            score: Math.round(10 * this.best[i].score / this.best[i].simulations) / 10,
                        };
                    }
                }
            }
            return {
                recommended: false,
                score: -1,
            };
        },
        bestScore: function () {
            var bestScore = -1;
            if (this.best != null) {
                for (var i = 0; i < this.best.length; i++) {
                    bestScore = Math.max(bestScore, Math.round(10 * this.best[i].score / this.best[i].simulations) / 10);
                }
            }
            return bestScore;
        }
    },
    methods: {
        onClick: function (color, index) {
            if (index == 12) {
                if (color == 0) {
                    this.redLocked = !this.redLocked;
                } else if (color == 1) {
                    this.yellowLocked = !this.yellowLocked;
                } else if (color == 2) {
                    this.greenLocked = !this.greenLocked;
                } else if (color == 3) {
                    this.blueLocked = !this.blueLocked;
                }
            } else {
                if (color == 0) {
                    this.red[index].selected = !this.red[index].selected;
                } else if (color == 1) {
                    this.yellow[index].selected = !this.yellow[index].selected;
                } else if (color == 2) {
                    this.green[index].selected = !this.green[index].selected;
                } else if (color == 3) {
                    this.blue[index].selected = !this.blue[index].selected;
                }
            }
            this.process();
        },
        onClickDie: function (index) {
            if (index <= 3) {
                // Colored dice can be disabled
                this.dice[index].value = this.dice[index].value % 7 + 1;
            } else {
                this.dice[index].value = this.dice[index].value % 6 + 1;
            }
            this.process();
        },
        createWorker: function (fn) {
            var blob = new Blob(['self.onmessage = ', fn.toString()], { type: 'text/javascript' });
            var url = URL.createObjectURL(blob);
            return new Worker(url);
        },
        process: function () {
            var me = this;
            if (this.worker) {
                this.worker.terminate();
            }
            this.worker = this.createWorker(function (e) {
                var getMoves = function (state) {
                    var moves = [];
                    var locked = [
                        state.red[10].selected || state.redLocked, // || state.dice[0].value == 7,
                        state.yellow[10].selected || state.yellowLocked, // || state.dice[1].value == 7,
                        state.green[10].selected || state.greenLocked, // || state.dice[2].value == 7,
                        state.blue[10].selected || state.blueLocked, // || state.dice[3].value == 7,
                    ];
                    var unavailable = [
                        state.red[10].selected || state.redLocked || state.dice[0].value == 7,
                        state.yellow[10].selected || state.yellowLocked || state.dice[1].value == 7,
                        state.green[10].selected || state.greenLocked || state.dice[2].value == 7,
                        state.blue[10].selected || state.blueLocked || state.dice[3].value == 7,
                    ];

                    var redMin = 0;
                    var yellowMin = 0;
                    var greenMax = 100;
                    var blueMax = 100;
                    var redCount = 0;
                    var yellowCount = 0;
                    var greenCount = 0;
                    var blueCount = 0;
                    for (var i = 0; i < 11; i++) {
                        if (state.red[i].selected) {
                            redCount++;
                            redMin = state.red[i].value;
                        }
                        if (state.yellow[i].selected) {
                            yellowCount++;
                            yellowMin = state.yellow[i].value;
                        }
                        if (state.green[i].selected) {
                            greenCount++;
                            greenMax = state.green[i].value;
                        }
                        if (state.blue[i].selected) {
                            blueCount++;
                            blueMax = state.blue[i].value;
                        }
                    }

                    // Game over
                    var numLocked = 0;
                    if (locked[0]) numLocked++;
                    if (locked[1]) numLocked++;
                    if (locked[2]) numLocked++;
                    if (locked[3]) numLocked++;
                    if (numLocked >= 2 || state.penalty >= 4) {
                        return [];
                    }

                    // Default dice (one move for each destination color)
                    if (state.dice[4].value + state.dice[5].value > redMin && !locked[0]) {
                        if (state.dice[4].value + state.dice[5].value < 12 || redCount >= 5) {
                            moves.push({
                                diceOne: 4,
                                diceTwo: 5,
                                color: 0,
                                value: state.dice[4].value + state.dice[5].value,
                                score: 0,
                                simulations: 0,
                            });
                        }
                    }
                    if (state.dice[4].value + state.dice[5].value > yellowMin && !locked[1]) {
                        if (state.dice[4].value + state.dice[5].value < 12 || yellowCount >= 5) {
                            moves.push({
                                diceOne: 4,
                                diceTwo: 5,
                                color: 1,
                                value: state.dice[4].value + state.dice[5].value,
                                score: 0,
                                simulations: 0,
                            });
                        }
                    }
                    if (state.dice[4].value + state.dice[5].value < greenMax && !locked[2]) {
                        if (state.dice[4].value + state.dice[5].value > 2 || greenCount >= 5) {
                            moves.push({
                                diceOne: 4,
                                diceTwo: 5,
                                color: 2,
                                value: state.dice[4].value + state.dice[5].value,
                                score: 0,
                                simulations: 0,
                            });
                        }
                    }
                    if (state.dice[4].value + state.dice[5].value < blueMax && !locked[3]) {
                        if (state.dice[4].value + state.dice[5].value > 2 || blueCount >= 5) {
                            moves.push({
                                diceOne: 4,
                                diceTwo: 5,
                                color: 3,
                                value: state.dice[4].value + state.dice[5].value,
                                score: 0,
                                simulations: 0,
                            });
                        }
                    }

                    // Colored dice
                    for (var i = 0; i <= 3; i++) {
                        if (!unavailable[i]) {
                            // Default dice
                            for (var j = 4; j <= 5; j++) {
                                if (i == 0 && state.dice[i].value + state.dice[j].value <= redMin) {
                                    continue;
                                }
                                if (i == 1 && state.dice[i].value + state.dice[j].value <= yellowMin) {
                                    continue;
                                }
                                if (i == 2 && state.dice[i].value + state.dice[j].value >= greenMax) {
                                    continue;
                                }
                                if (i == 3 && state.dice[i].value + state.dice[j].value >= blueMax) {
                                    continue;
                                }
                                if (i == 0 && (state.dice[i].value + state.dice[j].value == 12 && redCount < 5)) {
                                    continue;
                                }
                                if (i == 1 && (state.dice[i].value + state.dice[j].value == 12 && yellowCount < 5)) {
                                    continue;
                                }
                                if (i == 2 && (state.dice[i].value + state.dice[j].value == 2 && greenCount < 5)) {
                                    continue;
                                }
                                if (i == 3 && (state.dice[i].value + state.dice[j].value == 2  &&  blueCount < 5)) {
                                    continue;
                                }
                                moves.push({
                                    diceOne: i,
                                    diceTwo: j,
                                    color: i,
                                    value: state.dice[i].value + state.dice[j].value,
                                    score: 0,
                                    simulations: 0,
                                });
                            }
                        }
                    }

                    // Penalty
                    moves.push({
                        diceOne: -1,
                        diceTwo: -1,
                        color: -1,
                        value: -1,
                        score: 0,
                        simulations: 0,
                    });

                    return moves;
                };
                var getBestMoves = function (state, onStatus) {
                    var simulationsBetweenReports = 100;
                    var simulations = 0;
                    //console.log(state);

                    var allMoves = getMoves(state);
                    // console.log(allMoves);

                    while (true && allMoves.length > 0) {
                        simulations++;

                        for (var i = 0; i < allMoves.length; i++) {
                            var copy = cloneState(state);
                            makeMove(copy, allMoves[i]);

                            // Simulate
                            var maxAttempts = 100;
                            randomizeDice(copy);
                            var nextMoves = getMoves(copy);
                            while (nextMoves.length > 0 && maxAttempts-- > 0) {
                                var randIndex = Math.floor(Math.random() * nextMoves.length);
                                makeMove(copy, nextMoves[randIndex]);
                                randomizeDice(copy);
                                nextMoves = getMoves(copy);
                            }

                            // Record score
                            allMoves[i].simulations++;
                            allMoves[i].score += getScore(copy);
                        }

                        if (simulations % simulationsBetweenReports == 0) {
                            onStatus(allMoves);
                        }
                    }
                };
                var randomizeDice = function (state) {
                    if (!state.redLocked && state.dice[0].value <= 6) {
                        state.dice[0].value = Math.floor(Math.random() * 6) + 1;
                    }
                    if (!state.yellowLocked && state.dice[1].value <= 6) {
                        state.dice[1].value = Math.floor(Math.random() * 6) + 1;
                    }
                    if (!state.greenLocked && state.dice[2].value <= 6) {
                        state.dice[2].value = Math.floor(Math.random() * 6) + 1;
                    }
                    if (!state.blueLocked && state.dice[3].value <= 6) {
                        state.dice[3].value = Math.floor(Math.random() * 6) + 1;
                    }
                    state.dice[4].value = Math.floor(Math.random() * 6) + 1;
                    state.dice[5].value = Math.floor(Math.random() * 6) + 1;
                };
                var makeMove = function (state, move) {
                    if (move.color == -1) {
                        state.penalty++;
                        return;
                    }
                    var index = move.value - 2;
                    if (move.color == 0) {
                        state.red[index].selected = true;
                        if (index == 10) {
                            state.redLocked = true;
                        }
                    }
                    if (move.color == 1) {
                        state.yellow[index].selected = true;
                        if (index == 10) {
                            state.yellowLocked = true;
                        }
                    }
                    if (move.color == 2) {
                        index = 12 - move.value;
                        state.green[index].selected = true;
                        if (index == 10) {
                            state.greenLocked = true;
                        }
                    }
                    if (move.color == 3) {
                        index = 12 - move.value;
                        state.blue[index].selected = true;
                        if (index == 10) {
                            state.blueLocked = true;
                        }
                    }
                    state.depth++;
                };
                var getScore = function (state) {
                    var points = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78];
                    var score = 0;

                    var redCount = state.redLocked ? 1 : 0;
                    var yellowCount = state.yellowLocked ? 1 : 0;
                    var greenCount = state.greenLocked ? 1 : 0;
                    var blueCount = state.blueLocked ? 1 : 0;
                    for (var i = 0; i < 11; i++) {
                        if (state.red[i].selected) {
                            redCount++;
                        }
                        if (state.yellow[i].selected) {
                            yellowCount++;
                        }
                        if (state.green[i].selected) {
                            greenCount++;
                        }
                        if (state.blue[i].selected) {
                            blueCount++;
                        }
                    }

                    score += points[redCount];
                    score += points[yellowCount];
                    score += points[greenCount];
                    score += points[blueCount];

                    score -= state.penalty * 5;

                    return Math.max(0, score); // * Math.pow(0.95, state.depth));
                };
                var cloneState = function (state) {
                    return JSON.parse(JSON.stringify(state));
                };
                getBestMoves(e.data, self.postMessage);
            });
            this.worker.onmessage = function (e) {
                me.onBestMove(e.data);
            };
            this.worker.postMessage({
                red: this.red,
                yellow: this.yellow,
                green: this.green,
                blue: this.blue,
                redLocked: this.redLocked,
                yellowLocked: this.yellowLocked,
                greenLocked: this.greenLocked,
                blueLocked: this.blueLocked,
                dice: this.dice,
                penalty: this.penalty,
                depth: 1,
            })
        },
        onBestMove: function (data) {
            this.best = data;
        },
        randomize: function() {
            if (!this.redLocked && this.dice[0].value <= 6) {
                this.dice[0].value = Math.floor(Math.random() * 6) + 1;
            }
            if (!this.yellowLocked && this.dice[1].value <= 6) {
                this.dice[1].value = Math.floor(Math.random() * 6) + 1;
            }
            if (!this.greenLocked && this.dice[2].value <= 6) {
                this.dice[2].value = Math.floor(Math.random() * 6) + 1;
            }
            if (!this.blueLocked && this.dice[3].value <= 6) {
                this.dice[3].value = Math.floor(Math.random() * 6) + 1;
            }
            this.dice[4].value = Math.floor(Math.random() * 6) + 1;
            this.dice[5].value = Math.floor(Math.random() * 6) + 1;
            this.process();
        },
        penalize: function(number) {
            if (number > this.penalty) {
                this.penalty++;
            } else {
                this.penalty--;
            }
            if (this.penalty < 0) {
                this.penalty = 0;
            }
            if (this.penalty > 4) {
                this.penalty = 4;
            }
        },
    },
    mounted: function () {
        for (var i = 2; i <= 12; i++) {
            this.red.push({
                value: i,
                selected: false,
                recommended: false,
                score: -1,
            });
            this.yellow.push({
                value: i,
                selected: false,
                recommended: false,
                score: -1,
            });
            this.green.push({
                value: 14 - i,
                selected: false,
                recommended: false,
                score: -1,
            });
            this.blue.push({
                value: 14 - i,
                selected: false,
                recommended: false,
                score: -1,
            });
        }
    }
})