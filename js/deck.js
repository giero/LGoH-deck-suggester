function Deck(heroes) {
    this.heroes = heroes;

    this.affinityCounterMap = {
        'Fire': 'Earth',
        'Earth': 'Water',
        'Water': 'Fire',
        'Light': 'Dark',
        'Dark': 'Light'
    };

    this.leaderTarget = this.heroes[0].leaderAbility.target.indexOf(' ') >= 0
        ? this.heroes[0].leaderAbility.target.split(' ')
        : this.heroes[0].leaderAbility.target;
    this.leaderStat = {
        'Damage': 'attack',
        'REC': 'recovery',
        'HP': 'health'
    }[this.heroes[0].leaderAbility.stat];
    this.leaderStatValue = this.heroes[0].leaderAbility.value / 100;

    this.canApplyLeaderStat = (function (hero) {
        if (typeof this.leaderTarget === 'string') {
            // this is faster way than do the same thing as in 'else' statement for every hero
            return this.leaderTarget === hero.affinity
                || this.leaderTarget === hero.type
                || this.leaderTarget === hero.species;
        } else {
            return this.leaderTarget.every(function (value) {
                return ([hero.affinity, hero.type, hero.species].indexOf(value) >= 0);
            });
        }

    }).bind(this);
}

Deck.prototype.calculate = function (affinity) {
    var deckValues = {
        power: 0,
        attack: 0,
        recovery: 0,
        health: 0
    };

    for (var i = this.heroes.length - 1; i >= 0; --i) {
        var hero = new Hero(this.heroes[i]); // copy for local stats modifications

        var heroCountersOpponent = this.affinityCounterMap[hero.affinity] === affinity;
        var opponentCountersHero = this.affinityCounterMap[affinity] === hero.affinity;

        // apply affinity bonus / counter bonus
        if (heroCountersOpponent) {
            hero.attack <<= 1;
        } else if (opponentCountersHero) {
            hero.attack >>= 1;
        }

        // apply leader ability
        if (this.canApplyLeaderStat(hero)) {
            hero[this.leaderStat] = Math.floor(hero[this.leaderStat] * this.leaderStatValue);
        }

        // TODO: apply Slayer event

        // it's faster than doing the same thing in a loop - believe me :?
        deckValues.power += hero.power;
        deckValues.attack += hero.attack;
        deckValues.recovery += hero.recovery;
        deckValues.health += hero.health;
    }
    return deckValues;
};

