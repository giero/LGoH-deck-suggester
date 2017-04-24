function Deck(heroes) {
    this.heroes = heroes;
    this.leaderAblility = heroes[0].leaderAbility;

    this.leaderAblilityStatMap = {
        'Damage': 'attack',
        'REC': 'recovery',
        'HP': 'health'
    };

    this.affinityStrongCounterMap = {
        'Fire': 'Earth,',
        'Earth': 'Water',
        'Water': 'Fire',
        'Light': 'Dark',
        'Dark': 'Light'
    };

    this.affinityWeakCounterMap = {
        'Earth': 'Fire',
        'Water': 'Earth',
        'Fire': 'Water',
        'Dark': 'Light',
        'Light': 'Dark'
    };

}

Deck.prototype.calculate = function (property, affinity) {
    var result = 0;
    var leaderTarget = this.leaderAblility.target;
    var leaderStat = this.leaderAblilityStatMap[this.leaderAblility.stat];

    for (var i = 0; i < this.heroes.length; i++) {
        var hero = {
            affinity: this.heroes[i].affinity,
            attack: this.heroes[i].attack,
            recovery: this.heroes[i].recovery,
            health: this.heroes[i].health,
            type: this.heroes[i].type,
            species: this.heroes[i].species
        };

        if (this.affinityStrongCounterMap[hero.affinity] === affinity) {
            hero.attack = Math.round(hero.attack * 1.5);
        } else if (this.affinityWeakCounterMap[affinity] === hero.affinity) {
            hero.attack = Math.round(hero.attack * 0.5);
        }

        if ([hero.affinity, hero.type, hero.species].indexOf(leaderTarget) > -1) {
            hero[leaderStat] = Math.round(hero[leaderStat] * (this.leaderAblility.value / 100));
        }
        result += hero[property];
    }
    return result;
};

function DeckGenerator(heroes) {
    this.heroes = heroes;
}

DeckGenerator.prototype.generate = function () {
    console.log('GENERATOR STARTED');
    var result = new Array(5);
    var possibilities = this.countPossibilities();
    var counter = 0;
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
            this.postMessage({progress: (++counter / possibilities) * 100});

            var d = new Deck(result);
            for (var affinity in bestDecks) {
                var value = d.calculate('attack', affinity);

                if (value > bestDecks[affinity].value) {
                    bestDecks[affinity] = {
                        value: value,
                        heroes: JSON.parse(JSON.stringify(result))
                    };
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

    console.log('GENERATOR ENDED');

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

this.addEventListener('message', function(e) {
    var dg = new DeckGenerator(e.data);
    var generated = dg.generate();
    this.postMessage(generated);
}, false);
