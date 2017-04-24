function Deck(heroes) {
    this.heroes = heroes;
    this.leaderAblility = heroes[0].leaderAbility;

    this.leaderAblilityStatMap = {
        'Damage': 'attack',
        'REC': 'recovery',
        'HP': 'health'
    };

    this.affinityCounterMap = {
        'Fire': 'Earth,',
        'Earth': 'Water',
        'Water': 'Fire',
        'Light': 'Dark',
        'Dark': 'Light'
    };
}

Deck.prototype.calculate = function (property, affinity) {
    var result = 0;

    for (var i = 0; i < this.heroes.length; i++) {
        var hero = $.extend({}, this.heroes[i]);
        var leaderTarget = this.leaderAblility.target;
        var leaderStat = this.leaderAblilityStatMap[this.leaderAblility.stat];

        if (this.affinityCounterMap[hero.affinity] === affinity) {
            hero.attack = Math.round(hero.attack * 1.5);
        } else if (this.affinityCounterMap[affinity] === hero.affinity) {
            hero.attack = Math.round(hero.attack * 0.5);
        }

        if ($.inArray(leaderTarget, [hero.affinity, hero.type, hero.species]) > -1) {
            hero[leaderStat] = Math.round(hero[leaderStat] * (this.leaderAblility.value / 100));
        }
        result += hero[property];
    }
    return result;
};