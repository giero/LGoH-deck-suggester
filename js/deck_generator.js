function DeckGenerator(heroes) {
    this.heroes = heroes;
}

DeckGenerator.prototype.generate = function () {
    console.log('GENERATOR STARTED');
    var possibilities = this.countPossibilities();
    var onePercentOfPossibilities = Math.round(possibilities / 100);
    var counter = 0;
    var bestDecks = {};
    var affinities = {'Fire': null, 'Water': null, 'Earth': null, 'Light': null, 'Dark': null};
    var combinations = function (leaderHero, heroes, len, offset, result) {
        if (len === 0) {
            if (!(++counter % onePercentOfPossibilities)) {
                this.postMessage(Math.round(counter / possibilities * 100));
            }

            var deck = new Deck([leaderHero].concat(result));
            for (var affinity in affinities) {
                var calculatedResult = deck.calculate('attack', affinity);

                if (!bestDecks.hasOwnProperty(affinity) || calculatedResult > bestDecks[affinity].value) {
                    bestDecks[affinity] = {
                        value: calculatedResult,
                        heroes: deck.heroes
                    };
                }
            }

            return;
        }

        for (var i = offset; i <= heroes.length - len; i++) {
            result[result.length - len] = heroes[i];
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

    console.log('GENERATOR ENDED');

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
