function Deck(heroes) {
    this.heroes = heroes;
    this.leaderAblility = heroes[0].leaderAbility;

    this.leaderAblilityStatMap = {
        'Damage': 'attack',
        'REC': 'recovery',
        'HP': 'health'
    };

    this.affinityStrongCounterMap = {
        'Fire': 'Earth',
        'Earth': 'Water',
        'Water': 'Fire',
        'Light': 'Dark',
        'Dark': 'Light'
    };

    this.affinityWeakCounterMap = {
        'Earth': 'Fire',
        'Water': 'Earth',
        'Fire': 'Water'
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

DeckGenerator.prototype.generate = function (affinity) {
    console.log('GENERATOR STARTED for ' + affinity);
    var result = new Array(5);
    var possibilities = this.countPossibilities();
    var counter = 0;
    var bestDeck = {
        deck: {
            value: 0,
            heroes: []
        }
    };

    function combinations(heroes, len, offset, result) {
        if (len === 0) {
            this.postMessage({
                affinity: affinity,
                progress: (++counter / possibilities) * 100
            });

            var d = new Deck(result);
            var value = d.calculate('attack', affinity);

            if (value > bestDeck.deck.value) {
                bestDeck = {
                    deck: {
                        value: value,
                        heroes: JSON.parse(JSON.stringify(result))
                    }
                };
            }

            return;
        }

        for (var i = offset; i <= heroes.length - len; i++) {
            result[result.length - len] = heroes[i];
            combinations(heroes, len - 1, i + 1, result);
        }
    }

    combinations(this.heroes, 5, 0, result);

    bestDeck['affinity'] = affinity;

    console.log('GENERATOR ENDED for ' + affinity);

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

this.addEventListener('message', function(e) {
    var dg = new DeckGenerator(e.data.heroes);
    var generated = dg.generate(e.data.affinity);
    this.postMessage(generated);
}, false);
