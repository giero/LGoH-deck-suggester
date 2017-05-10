function DeckGenerator(heroes) {
    this.heroes = heroes;
}

DeckGenerator.prototype.generate = function () {
    console.log('GENERATOR STARTED');
    var generatorStart = new Date();
    var possibilities = this.countPossibilities();
    var onePercentOfPossibilities = Math.floor(possibilities / 100);
    var counter = 0;
    var bestDecks = {'Fire': {}, 'Water': {}, 'Earth': {}, 'Light': {}, 'Dark': {}};

    var combinations = function (leaderHero, heroes, len, offset, result) {
        if (len === 0) {
            if (!(++counter % onePercentOfPossibilities)) {
                this.postMessage(Math.round(counter / possibilities * 100));
            }

            var deck = new Deck([leaderHero].concat(result));
            for (var affinity in bestDecks) {
                var deckValues = deck.calculate(affinity);

                for (var stat in deckValues) {
                    if (deckValues.hasOwnProperty(stat)) {
                        if (!bestDecks[affinity].hasOwnProperty(stat) || deckValues[stat] > bestDecks[affinity][stat].value) {
                            bestDecks[affinity][stat] = {
                                value: deckValues[stat],
                                heroes: deck.heroes
                            };
                        }
                    }
                }
            }

            return;
        }

        for (var i = offset, rl = result.length, hl = heroes.length; i <= hl - len; i++) {
            result[rl - len] = heroes[i];
            combinations(leaderHero, heroes, len - 1, i + 1, result);
        }
    };

    // for every hero as leader check every four other cards possibilities
    for (var i = 0; i < this.heroes.length; ++i) {
        var start = new Date();

        var heroes = this.heroes.slice();
        var leaderHero = heroes[i];
        heroes.splice(i, 1);
        combinations(leaderHero, heroes, 4, 0, new Array(4));

        var time = new Date() - start;
        console.log(time);
    }

    console.log('GENERATOR ENDED after ' + (new Date() - generatorStart));

    return bestDecks;
};

DeckGenerator.prototype.countPossibilities = function () {
    // for every hero as leader check every four other cards possibilities
    // n * (n-1 choose 4)

    var result = 1;
    var heroesCount = this.heroes.length;

    // (n-1) * (n-2) * (n-3) * (n-4) / (1 * 2 * 3 * 4)
    for (var i = 1; i <= 4; ++i) {
        result = result * (heroesCount - i) / i;
    }

    return heroesCount * result;
};
