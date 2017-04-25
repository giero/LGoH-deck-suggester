function DeckGenerator(heroes) {
    this.heroes = heroes;
}

DeckGenerator.prototype.generate = function () {
    console.log('GENERATOR STARTED');
    var possibilities = this.countPossibilities();
    var counter = 0;
    var bestDeck = {};
    var affinities = {'Fire': null, 'Water': null, 'Earth': null, 'Light': null, 'Dark': null};
    var combinations = function (heroes, len, offset, result) {
        if (len === 0) {
            if (!(++counter % 100) || counter === possibilities) {
                this.postMessage(JSON.stringify({progress: Math.round(counter / possibilities * 100)}));
            }

            var d = new Deck(result);
            for (var affinity in affinities) {
                var calculated = d.calculate('attack', affinity);

                if (!bestDeck.hasOwnProperty(affinity) || calculated.result > bestDeck[affinity].value) {
                    bestDeck[affinity] = {
                        value: calculated.result,
                        heroes: JSON.parse(JSON.stringify(result)),
                        debug: calculated.debug
                    };
                }
            }

            return;
        }

        for (var i = offset; i <= heroes.length - len; i++) {
            result[result.length - len] = heroes[i];
            combinations(heroes, len - 1, i + 1, result);
        }
    };

    combinations(this.heroes, 5, 0, new Array(5));

    console.log('GENERATOR ENDED');

    return bestDeck;
};

DeckGenerator.prototype.countPossibilities = function () {
    var result = 1;
    var heroesCount = this.heroes.length;

    for (var i = 1; i <= 5; ++i) {
        result *= (heroesCount - i + 1) / i;
    }

    return result;
};
