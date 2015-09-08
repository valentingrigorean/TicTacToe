$(document).ready(function () {
    var random = function (max) {
        max = max || 100;
        return Math.floor(Math.random() * max);
    };

    var seed = {
        EMPTY: 0,
        CROSS: 1,
        NOUGHT: 2
    };

    var turn = {
        PLAYER: 0,
        AI: 1,
        DRAW: 2
    };

    var state = {
        RUNNING: 0,
        OVER: 1
    }

    var winner = {
        DRAW: 0,
        PLAYER: 1,
        AI: 2
    }

    var difficulty = {
        EASY: 1,
        MEDIUM: 3,
        HARD: 10
    };

    var Board = function (player, ai) {
        var board = [];
        var moves = 0;
        var wonMoves = [];
        this.player = player;
        this.ai = ai;
        this.totalMove = function () {
            return moves;
        }
        this.isEmpty = function (x) {
            return board[x] === seed.EMPTY;
        };

        this.getWinnerMoves = function () {
            return wonMoves;
        }

        this.set = function (x, type) {
            if (type !== seed.EMPTY)
                moves++;
            board[x] = type;
        };

        this.get = function (x) {
            return board[x];
        };
        this.isFull = function () {
            for (var i = 0 ; i < 9; i++)
                if (seed.EMPTY === board[i])
                    return false;
            return true;
        };

        this.clear = function () {
            for (var i = 0; i < 9; i++)
                board[i] = seed.EMPTY;
            moves = 0;
            wonMoves = [];
        };

        this.checkWinner = function () {
            var win = false;
            for (var i = 0; i < 9; i += 3)
                if (board[i] !== seed.EMPTY &&
                    board[i] === board[i + 1] &&
                    board[i] === board[i + 2]) {
                    wonMoves = [i, i + 1, i + 2];
                    return board[i];
                }

            for (var i = 0; i < 3; i++)
                if (board[i] !== seed.EMPTY &&
                    board[i] === board[i + 3] &&
                    board[i] === board[i + 6]) {
                    wonMoves = [i, i + 3, i + 6];
                    return (board[i]);
                }
            if (board[0] !== seed.EMPTY &&
                board[0] === board[4] &&
                board[0] === board[8]) {
                wonMoves = [0, 4, 8];
                return (board[0]);
            }
            if (board[2] !== seed.EMPTY &&
                board[2] === board[4] &&
                board[2] === board[6]) {
                wonMoves = [2, 4, 6];
                return (board[2]);
            }
            if (this.isFull())
                return winner.DRAW;
            return win;
        };
        this.clear();
    };

    var AI = function (board, diff) {
        _difficulty = diff || difficulty.HARD;
        var bestFirstMoves = [0, 2, 6, 8, 4];
        this.getMove = function () {
            if (board.totalMove() === 0) {
                var r = random(5);
                board.set(bestFirstMoves[r], board.ai);
                return { x: bestFirstMoves[r] };
            }
            var move = computeMove(board, board.ai, 0);
            board.set(move.x, board.ai);
            return { x: move.x };
        }

        this.setDifficulty = function (diff) {
            _difficulty = diff;
        }

        var switchPlayer = function (player) {
            return board.player === player ? board.ai : board.player;
        }

        var computeMove = function (board, player, depth) {
            var win = board.checkWinner();
            if (win !== false) {
                if (win === board.player)
                    return { score: depth - 10 };
                return { score: 10 - depth };
            }
            if (board.isFull() || depth >= _difficulty)
                return { score: 0 };
            var moves = [];

            for (var i = 0 ; i < 9; i++) {
                if (board.isEmpty(i)) {
                    var move = {
                        x: i,
                        turn: player,
                        score: 0
                    };
                    board.set(i, player);
                    move.score = computeMove(board, switchPlayer(player), depth + 1).score;
                    moves.push(move);
                    board.set(i, seed.EMPTY);
                }
            }
            var bestMove = 0;
            if (player === board.ai) {
                var bestScore = -100;

                for (var i = 0; i < moves.length; i++)
                    if (moves[i].score > bestScore) {
                        bestScore = moves[i].score;
                        bestMove = i;
                    }
            } else {
                var bestScore = 100;
                for (var i = 0; i < moves.length; i++)
                    if (moves[i].score < bestScore) {
                        bestScore = moves[i].score;
                        bestMove = i;
                    }
            }
            return moves[bestMove];
        }
    }

    var Game = function (div, mark) {
        var _board = new Board(mark, mark === seed.CROSS ? seed.NOUGHT : seed.CROSS);
        var _turn = turn.PLAYER;
        var _ai = new AI(_board);
        var _callback;
        var _init = false;
        var _state = state.OVER;

        this.setDifficulty = function (diff) {
            _ai.setDifficulty(diff);
        }

        this.setMark = function (m) {
            if (_board.player !== m)
                swapSeed();
        }

        this.clear = function () {
            _board.clear();
            clearDraw();
        }

        var swapSeed = function () {
            for (var i = 0 ; i < 9; i++)
                if (_board.get(i) === _board.ai)
                    _board.set(i, _board.player);
                else if (_board.get(i) === _board.player)
                    _board.set(i, _board.ai);
            var aux = _board.ai;
            _board.ai = _board.player;
            _board.player = aux;
            redrawBoard();
        }

        var clearDraw = function () {
            $(div + '> h2').each(function (index, item) {
                $(item).html("");
            });
        }

        var redrawBoard = function () {
            for (var i = 0; i < 9; i++)
                updateDraw(i, _board.get(i));
        }

        this.startGame = function (callback) {
            if (!_init) {
                _callback = callback;
                $(div).click(function () {
                    if (_turn !== turn.PLAYER || _state === state.OVER)
                        return;
                    var cell = parseInt($(this).attr('value'));
                    if (_board.isEmpty(cell)) {
                        _board.set(cell, _board.player);
                        updateDraw(cell, _board.player);
                        checkWinner();
                        _turn = turn.AI;
                        update();
                    }
                });
                _init = true;
            }
            _state = state.RUNNING;
            randomStart();
            update();
        }

        var randomStart = function () {
            return random(2) === 0 ? _turn = turn.AI : turn.PLAYER;
        }

        var checkWinner = function () {
            var win = _board.checkWinner();
            if (win !== false) {
                _state = state.OVER;
                if (win !== winner.DRAW)
                    win = _board.ai === win ? winner.AI : winner.PLAYER;
                _callback(win, _board.getWinnerMoves());
                return;
            }
        }


        var update = function () {
            if (_state === state.RUNNING) {
                if (_turn === turn.AI) {
                    var move = _ai.getMove();
                    updateDraw(move.x, _board.ai);
                    _turn = turn.PLAYER;
                    checkWinner();
                    return;
                }
            }
        }

        var updateDraw = function (x, type) {
            switch (type) {
                case seed.EMPTY:
                    $($(div + '> h2')[x]).html('');
                    break;
                case seed.CROSS:
                    $($(div + '> h2')[x]).html('X');
                    break;
                case seed.NOUGHT:
                    $($(div + '> h2')[x]).html('O');
                    break;
            }

        }
    }
    var game = new Game('.cell', seed.CROSS);
    var aiScore = 0;
    var playerScore = 0;
    var draws = 0;

    var gameOver = function (win, moves) {

        var add = function () {
            for (var i = 0 ; i < moves.length; i++)
                $($('.cell > h2')[moves[i]]).addClass('animated flash');
        }

        var remove = function () {
            for (var i = 0; i < moves.length; i++)
                $($('.cell > h2')[moves[i]]).removeClass('animated flash');
        }


        switch (win) {
            case winner.AI:
                aiScore++;
                $('#ai-score').html(aiScore);
                break;
            case winner.PLAYER:
                playerScore++;
                $('#player-score').html(playerScore);
                break;
            case winner.DRAW:
                draws++;
                $('#draw-score').html(draws);
                break;
        }
        if (win === winner.AI || win === winner.PLAYER)
            add();
        setTimeout(function () {
            if (win === winner.AI || win === winner.PLAYER)
                remove();
            game.clear();
            setTimeout(function () {
                game.startGame(gameOver);
            }, 500);
        }, 1500);
       
    }

    game.startGame(gameOver);
    $('input[type=radio][name=difficulty]').change(function () {
        switch (this.value) {
            case "Easy":
                game.setDifficulty(difficulty.EASY);
                break;
            case "Medium":
                game.setDifficulty(difficulty.MEDIUM);
                break;
            case "Hard":
                game.setDifficulty(difficulty.HARD);
                break;
        }
    });

    $('input[type=radio][name=seed]').change(function () {
        switch (this.value) {
            case 'X':
                game.setMark(seed.CROSS);
                break;
            case 'O':
                game.setMark(seed.NOUGHT);
                break;
        }
    });

});