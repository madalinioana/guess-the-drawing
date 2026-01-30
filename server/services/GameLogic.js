class GameLogic {
  static checkGuess(room, guesserId, guess) {
    if (!room || !room.currentWord) return false;
    if (guesserId === room.drawerId) return false;

    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedWord = room.currentWord.trim().toLowerCase();

    return normalizedGuess === normalizedWord;
  }

  static calculateScore(timeElapsed, maxTime = 60) {
    const maxScore = 1000;
    const minScore = 100;

    if (timeElapsed <= 0) return maxScore;
    if (timeElapsed >= maxTime) return minScore;

    const scoreRange = maxScore - minScore;
    const timeRatio = timeElapsed / maxTime;
    const score = maxScore - (scoreRange * timeRatio);

    return Math.round(score);
  }

  static calculateDrawerScore(guessedCount, totalPlayers, baseScore = 10) {
    if (totalPlayers === 0) return 0;

    const proportion = guessedCount / totalPlayers;
    return Math.ceil(proportion * baseScore);
  }

  static generateWordHint(word) {
    if (!word || typeof word !== 'string') return '';

    return word.replace(/[a-zA-Z0-9]/g, '_');
  }

  static revealLetter(word, currentHint) {
    if (!word || !currentHint) return currentHint;

    const hiddenPositions = [];
    for (let i = 0; i < word.length; i++) {
      if (currentHint[i] === '_' && /[a-zA-Z0-9]/.test(word[i])) {
        hiddenPositions.push(i);
      }
    }

    if (hiddenPositions.length === 0) return currentHint;

    const randomIndex = Math.floor(Math.random() * hiddenPositions.length);
    const positionToReveal = hiddenPositions[randomIndex];

    const hintArray = currentHint.split('');
    hintArray[positionToReveal] = word[positionToReveal];

    return hintArray.join('');
  }
}

module.exports = GameLogic;
