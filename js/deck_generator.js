function DeckGenerator(heroes) {
    this.heroes = heroes;
}

DeckGenerator.prototype.generate = function (options) {
    // var generatorStart = new Date();

    var possibilities = this.countPossibilities();
    var onePercentOfPossibilities = Math.floor(possibilities / 100);
    var counter = 0;
    var affinities = ['Fire', 'Water', 'Earth', 'Light', 'Dark', 'No affinity bonus'];
    var bestDecks = {};

    for (var i = 0; i < affinities.length; ++i) {
        var affinity = affinities[i];

        if (!options.affinitiesLimit || options.affinitiesLimit.indexOf(affinity) >= 0) {
            bestDecks[affinity] = {
                power: {value: 0, heroes: [], stats: 0},
                attack: {value: 0, heroes: [], stats: 0},
                attack_and_health: {value: 0, heroes: [], stats: 0}
            };
        }
    }

    function combinations(leaderHero, heroes, len, offset, result) {
        if (len === 0) {
            if (!(++counter % onePercentOfPossibilities)) {
                this.postMessage(Math.round(counter / possibilities * 100));
            }

            var deck = new Deck(
                [leaderHero, result[0], result[1], result[2], result[3]], //way faster way than .concat
                options
            );
            for (var affinity in bestDecks) {
                var deckStats = deck.calculate(affinity);

                if (deckStats.power > bestDecks[affinity].power.value) {
                    bestDecks[affinity].power = {
                        value: deckStats.power,
                        heroes: deck.heroes,
                        stats: deck.getStats()
                    };
                }
                if (deckStats.attack > bestDecks[affinity].attack.value) {
                    bestDecks[affinity].attack = {
                        value: deckStats.attack,
                        heroes: deck.heroes,
                        stats: deck.getStats()
                    };
                }
                if (deckStats.attack_and_health > bestDecks[affinity].attack_and_health.value) {
                    bestDecks[affinity].attack_and_health = {
                        value: deckStats.attack_and_health,
                        heroes: deck.heroes,
                        stats: deck.getStats()
                    };
                }
            }

            return;
        }

        for (var i = offset, rl = result.length, hl = heroes.length; i <= hl - len; i++) {
            result[rl - len] = heroes[i];
            combinations(leaderHero, heroes, len - 1, i + 1, result);
        }
    }

    var sortedHeroes = this.heroes.sort(function (a, b) {
        if (a.coreId === b.coreId) {
            return a.attack - b.attack;
        }

        return a.name.localeCompare(b.name);
    });

    // for every hero as leader check every four other cards possibilities
    var sortedHeroesLimit = sortedHeroes.length - 1;
    for (var h = sortedHeroesLimit; h >= 0; --h) {
        // var start = new Date();

        // if new leader has the same skill as previous, we can skip it,
        // because result will be the same
        if (h < sortedHeroesLimit && sortedHeroes[h].coreId === sortedHeroes[h+1].coreId) {
            counter += onePercentOfPossibilities;
            continue;
        }

        var heroes = sortedHeroes.slice();
        var leaderHero = heroes[h];
        heroes.splice(h, 1);
        combinations(leaderHero, heroes, 4, 0, new Array(4));

        // console.log(leaderHero.name, new Date() - start);
    }
    // console.log('GENERATOR ENDED after ' + (new Date() - generatorStart));
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
