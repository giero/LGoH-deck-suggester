function DeckGenerator(heroes) {
    this.heroes = heroes;
}

DeckGenerator.prototype.generate = function () {
    var result = new Array(5);
    var bestDecks = {
        'Fire': {
            value: 0,
            heroes: []
        },
        'Water': {
            value: 0,
            heroes: []
        },
        'Earth': {
            value: 0,
            heroes: []
        },
        'Light': {
            value: 0,
            heroes: []
        },
        'Dark': {
            value: 0,
            heroes: []
        }
    };

    function combinations(heroes, len, offset, result) {
        if (len === 0) {
            var d = new Deck(result);
            for (var affinity in bestDecks) {
                var value = d.calculate('power', affinity);

                if (value > bestDecks[affinity].value) {
                    bestDecks[affinity]['value'] = value;
                    bestDecks[affinity]['heroes'] = JSON.parse(JSON.stringify(d.heroes));
                }
            }

            return;
        }

        for (var i = offset; i <= heroes.length - len; i++) {
            result[result.length - len] = heroes[i];
            combinations(heroes, len - 1, i + 1, result);
        }
    }

    combinations(this.heroes, 5, 0, result);

    return bestDecks;
};

DeckGenerator.prototype.countPossibilities = function () {
    var result = 1;
    var heroesCount = this.heroes.length;

    for (var i = 1; i <= 5; ++i) {
        result *= (heroesCount - i + 1) / i;
    }

    return result;
};
