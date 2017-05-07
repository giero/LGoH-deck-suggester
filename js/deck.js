function Deck(heroes) {
    this.heroes = heroes;
    this.leaderAblility = heroes[0].leaderAbility;

    this.leaderAblilityStatMap = {
        'Damage': 'attack',
        'REC': 'recovery',
        'HP': 'health'
    };

    this.affinityCounterMap = {
        'Fire': 'Earth',
        'Earth': 'Water',
        'Water': 'Fire',
        'Light': 'Dark',
        'Dark': 'Light'
    };

}

Deck.prototype.calculate = function (property, affinity) {
    var result = 0,
        leaderTarget = this.leaderAblility.target,
        leaderStat = this.leaderAblilityStatMap[this.leaderAblility.stat],
        heroCountersOpponent,
        opponentCountersHero,
        debug = [];

    for (var i = 0; i < this.heroes.length; i++) {
        var hero = new Hero(this.heroes[i]);

        heroCountersOpponent = this.affinityCounterMap[hero.affinity] === affinity;
        opponentCountersHero = this.affinityCounterMap[affinity] === hero.affinity;

        debug.push(hero.name + ': ' + hero.affinity + ' vs ' + affinity + '(' + (heroCountersOpponent) + ', ' + (opponentCountersHero) + ')');

        if (heroCountersOpponent) {
            debug.push(hero.name + ': attack ' + hero.attack + ' -> ' + (hero.attack << 1));
            hero.attack <<= 1;
        } else if (opponentCountersHero) {
            debug.push(hero.name + ': attack ' + hero.attack + ' -> ' + (hero.attack >> 1));
            hero.attack >>= 1;
        }

        // apply leader ability
        if ([hero.affinity, hero.type, hero.species].indexOf(leaderTarget) > -1) {
            var newStatValue = Math.round(hero[leaderStat] * (this.leaderAblility.value / 100));
            debug.push(
                hero.name + ': ' + leaderStat + ' ' + hero[leaderStat] + ' -> ' + newStatValue + ' by leaders ' + leaderStat + ' x'+ (this.leaderAblility.value / 100)
            );
            hero[leaderStat] = newStatValue;
        }

        result += hero[property];
    }
    return {
        result: result,
        debug: debug
    };
};