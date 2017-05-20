function DeckGenerator(heroes) {
    this.heroes = heroes;
}

DeckGenerator.prototype.generate = function (options) {
    var possibilities = this.countPossibilities();
    var onePercentOfPossibilities = Math.floor(possibilities / 100);
    var counter = 0;

    var bestDecks = {'Fire': {}, 'Water': {}, 'Earth': {}, 'Light': {}, 'Dark': {}, 'No affinity bonus': {}};

    if (options.hasOwnProperty('affinitiesLimit')) {
        for (var affinity in bestDecks) {
            if (options.affinitiesLimit.indexOf(affinity) === -1) {
                delete bestDecks[affinity];
            }
        }
    }

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

            var deck = new Deck([leaderHero].concat(result), options);
            for (var affinity in bestDecks) {
                var deckValues = deck.calculate(affinity);

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

    var combinations = 1;
    var heroesCount = this.heroes.length;

    // (n-1) * (n-2) * (n-3) * (n-4) / 4!
    for (var i = 1; i <= 4; ++i) {
        combinations = combinations * (heroesCount - i) / i;
    }

    return heroesCount * combinations;
};
