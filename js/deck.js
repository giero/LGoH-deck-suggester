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
    this.leaderStat = {
        'Damage': 'attack',
        'REC': 'recovery',
        'HP': 'health'
    }[this.heroes[0].leaderAbility.stat];
    this.leaderStatValue = this.heroes[0].leaderAbility.value / 100;
}

Deck.prototype.calculate = function (property, affinity) {
    var deckValue = 0;

    for (var i = 0; i < this.heroes.length; i++) {
        var hero = new Hero(this.heroes[i]); // copy for local stats modifications

        var heroCountersOpponent = this.affinityCounterMap[hero.affinity] === affinity;
        var opponentCountersHero = this.affinityCounterMap[affinity] === hero.affinity;

        // apply affinity bonus or counter bonus
        if (heroCountersOpponent) {
            hero.attack <<= 1;
        } else if (opponentCountersHero) {
            hero.attack >>= 1;
        }

        if (this.leaderStat === 'attack' || property === 'power') {
            // apply leader ability
            switch (this.leaderTarget) {
                case hero.affinity:
                case hero.type:
                case hero.species:
                    hero[this.leaderStat] = Math.round(hero[this.leaderStat] * this.leaderStatValue);
                    break;
            }
        }

        deckValue += hero[property];
    }
    return deckValue;
};
