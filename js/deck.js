function Deck(heroes) {
    this.heroes = heroes;

    this.affinityCounterMap = {
        'Fire': 'Earth',
        'Earth': 'Water',
        'Water': 'Fire',
        'Light': 'Dark',
        'Dark': 'Light'
    };

    this.leaderTarget = this.heroes[0].leaderAbility.target;
    this.leaderStats = this.heroes[0].leaderAbility.stats;
    this.leaderStatValue = this.heroes[0].leaderAbility.value / 100;

    this.canApplyLeaderStat = (function (hero) {
        if (typeof this.leaderTarget === 'string') {
            // this is faster way than do the same thing as in 'else' statement for every hero
            return this.leaderTarget === hero.affinity
                || this.leaderTarget === hero.type
                || this.leaderTarget === hero.species;
        } else {
            return this.leaderTarget.every(function (value) {
                return ([hero.affinity, hero.type, hero.species]
                    .concat(Object.keys(hero.eventSkills))
                    .indexOf(value) >= 0);
            });
        }

    }).bind(this);
}

Deck.prototype.calculate = function (affinity) {
    var deckValues = {
        power: 0,
        attack: 0
    };

    for (var i = this.heroes.length - 1; i >= 0; --i) {
        var hero = new Hero(this.heroes[i]); // copy for local stats modifications

        // apply affinity bonus / counter bonus
        if (this.affinityCounterMap[hero.affinity] === affinity) {
            // hero counters opponent
            hero.attack <<= 1;
        } else if (this.affinityCounterMap[affinity] === hero.affinity) {
            // opponent counters hero
            hero.attack >>= 1;
        }

        // apply leader ability
        if (this.canApplyLeaderStat(hero)) {
            for (var ls = this.leaderStats.length - 1; ls >= 0; --ls) {
                var leaderStat = this.leaderStats[ls];
                hero[leaderStat] = Math.floor(hero[leaderStat] * this.leaderStatValue);
            }
        }

        // TODO: apply Slayer event

        deckValues.attack += hero.attack;
        deckValues.power += hero.power;
    }

    return deckValues;
};

