function DeckGenerator(heroes) {
    this.heroes = heroes;
}

DeckGenerator.prototype.generate = function () {
    var possibilities = this.countPossibilities();
    var onePercentOfPossibilities = Math.floor(possibilities / 100);
    var counter = 0;

    var bestDecks = {'Fire': {}, 'Water': {}, 'Earth': {}, 'Light': {}, 'Dark': {}};
    for (var affinity in bestDecks) {
        bestDecks[affinity] = {
            power: {
                value: 0,
                heroes: []
            },
            attack: {
                value: 0,
                heroes: []
            }
        };
    }

    var combinations = function (leaderHero, heroes, len, offset, result) {
        if (len === 0) {
            if (!(++counter % onePercentOfPossibilities)) {
                this.postMessage(Math.round(counter / possibilities * 100));
            }

            var deck = new Deck([leaderHero].concat(result));
            for (var affinity in bestDecks) {
                var deckValues = deck.calculate(affinity);

                // Array-type access of object's property is slow
                // and I need this code to run as fast as it can be - remember it's called millions of times
                // (for 70 cards it's over 300.000.000 times)

                if (deckValues.power > bestDecks[affinity].power.value) {
                    bestDecks[affinity].power = {
                        value: deckValues.power,
                        heroes: deck.heroes
                    };
                }
                if (deckValues.attack > bestDecks[affinity].attack.value) {
                    bestDecks[affinity].attack = {
                        value: deckValues.attack,
                        heroes: deck.heroes
                    };
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
    for (var i = this.heroes.length - 1; i >= 0; --i) {
        var heroes = this.heroes.slice();
        var leaderHero = heroes[i];
        heroes.splice(i, 1);
        combinations(leaderHero, heroes, 4, 0, new Array(4));
    }

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
