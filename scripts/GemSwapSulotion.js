class GameState {
    constructor({ grid, botPlayer, enemyPlayer }) {
        this.grid = grid;
        this.botPlayer = botPlayer;
        this.enemyPlayer = enemyPlayer;
        this.currentPlayer = botPlayer;
        this.point = 0;
    }

    calcScore() {
        const bot = this.getCurrentPlayer();
        const enemy = this.getCurrentEnemyPlayer();
        bot.metrics.calc(bot, enemy);
    }

    isGameOver() {
        return this.botPlayer.isLose() || this.enemyPlayer.isLose();
    }

    isExtraturn() {
        return this.hasExtraTurn;
    }

    isBotTurn() {
        return this.currentPlayer.sameOne(this.botPlayer);
    }

    switchTurn() {
        if (this.isBotTurn()) {
            this.currentPlayer = this.botPlayer;
        } else {
            this.currentPlayer = this.enemyPlayer;
        }
    }

    getCurrentPlayer() {
        if (this.isBotTurn()) {
            return this.botPlayer;
        }
        return this.enemyPlayer;
    }

    getCurrentEnemyPlayer() {
        if (this.isBotTurn()) {
            return this.enemyPlayer;
        }
        return this.botPlayer;
    }

    copyTurn(other) {
        this.botPlayer = other.botPlayer;
        this.enemyPlayer
    }

    // addDistinction(result) {
    //   this.distinctions.push(result);
    // }

    clone() {
        const grid = this.grid.clone();
        const botPlayer = this.botPlayer.clone();
        const enemyPlayer = this.enemyPlayer.clone();
        return new GameState({ grid, botPlayer, enemyPlayer });
    }
}

class TurnEfect {
    attackGem = 0;
    manaGem = {};
    buffAttack = 0;
    buffExtraTurn = 0;
    buffHitPoint = 0;
    buffMana = 0;
    buffPoint = 0;
    maxMatchedSize = 0;
  
    static fromDistinction(distinction) {
      const turnEffect = new TurnEfect();
      const maxMatchedSize = Math.max(...distinction.matchesSize);
      turnEffect.maxMatchedSize = maxMatchedSize;
  
      for (const gem of distinction.removedGems) {
        if(gem.type == GemType.SWORD) {
          turnEffect.applyAttack(gem);
        } else {
          turnEffect.applyCollect(gem);
        }
  
        if(gem.modifier == GemModifier.BUFF_ATTACK) {
          turnEffect.applyBuffAttack(gem);
        }
  
        if(gem.modifier == GemModifier.EXTRA_TURN) {
          turnEffect.applyExtraTurn(gem);
        }
  
        if(gem.modifier == GemModifier.HIT_POINT) {
          turnEffect.applyHitPoint(gem);
        }
  
  
        if(gem.modifier == GemModifier.MANA) {
          turnEffect.applyMana(gem);
        }
  
        if(gem.modifier == GemModifier.POINT) {
          turnEffect.applyPoint(gem);
        }
      }
  
      return turnEffect;
    }
    applyBuffAttack(gem) {
      this.buffAttack += 1;
    }
  
    applyExtraTurn(gem) {
      this.buffExtraTurn += 1;
    }
  
    applyHitPoint(gem) {
      this.buffHitPoint += 1;
    }
  
    applyMana(gem) {
      this.buffMana += 1;
    }
  
    applyPoint(gem) {
      this.buffPoint += 0;
    }
  
    applyAttack(gem){
      this.attackGem += 1;
    }
  
    applyCollect(gem) {
      if(!this.manaGem[gem.type]) {
        this.manaGem[gem.type] = 0;
      }
      this.manaGem[gem.type] += 1;
    }
  }

class GameSimulator {
    constructor(state) {
      this.state = state;
    }
  
    getState() {
      return this.state;
    }
  
    applyMove(move) {
      this.applySwap(move);
      return this;
    }
  
    applySwap(move) {
      const { swap } = move;
      const { index1, index2 } = swap;
      const result = this.state.grid.performSwap(index1, index2);
      this.applyDistinctionResult(result);
      return result;
    }
  
    applyDistinctionResult(result) {
      const turnEffect = TurnEfect.fromDistinction(result);
      this.applyTurnEffect(turnEffect);
      this.state.addDistinction(result);
    }
  
    applyTurnEffect(turn) {
      this.turnEffect = this.turnEffect;
      this.applyMaxMatchedSize(turn.maxMatchedSize);
    }
  
    applyMaxMatchedSize(value) {
      if(value >= 5) {
        this.state.hasExtraTurn = value > 0;
      }
    }
  
    applyBuffExtraTurn(value) {
      if(value > 0) {
        this.state.hasExtraTurn = value > 0;
      }
    }
  
    
  }

class GemSwapSulotion {
    constructor(grid, botPlayer, enemyPlayer, suggestMatch) {
        this.sate = new GameState({ grid, botPlayer, enemyPlayer });
        this.suggestMatch = suggestMatch;
    }

    chooseBestPosibleSwap() {
        const allPosibleSwaps = this.suggestMatch || state.grid.suggestMatch();
        if (!allPosibleSwaps || allPosibleSwaps.length == 0) {
            return null;
        }
        let currentBestMove = allPosibleSwaps[0];
        let currentBestMoveScore = 0;
        for (const move of allPosibleSwaps) {
            const futureState = this.seeFutureState(move, state, deep);
            const simulateMoveScore = this.compareScoreOnStates(state, futureState);

            if (simulateMoveScore > currentBestMoveScore) {
                currentBestMove = move;
                currentBestMoveScore = simulateMoveScore;
            }
        }
        return currentBestMove;
    }

    seeFutureState(move, state, deep) {
        console.log("See the future", deep);
        if (deep === 0 || !move) {
          return state;
        }
    
        if(state.isGameOver()) {
          return state;
        }
    
        const clonedState = state.clone();
        clonedState.hasExtraTurn = false;
    
        const futureState = this.applyMoveOnState(move, clonedState);
        if (futureState.isExtraturn()) {
          const newMove = this.chooseBestPosibleMove(futureState, deep);
          return this.seeFutureState(newMove, futureState, deep);
        }
    
        futureState.switchTurn();
        const newMove = this.chooseBestPosibleMove(futureState, deep - 1);
        const afterState = this.seeFutureState(newMove, futureState, deep - 1);
        return afterState;
    }

    applyMoveOnState(move, state) {
        const cloneState = state.clone();
        const simulator = new GameSimulator(cloneState);
        simulator.applyMove(move);
        const newState = simulator.getState();
        return newState;
    }

    gotScore() {

    }
}