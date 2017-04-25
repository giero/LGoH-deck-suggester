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
    var result = 0;
    var leaderTarget = this.leaderAblility.target;
    var leaderStat = this.leaderAblilityStatMap[this.leaderAblility.stat];
    var debug = [];
    for (var i = 0; i < this.heroes.length; i++) {
        var hero = {
            name: this.heroes[i].name,
            affinity: this.heroes[i].affinity,
            attack: this.heroes[i].attack,
            recovery: this.heroes[i].recovery,
            health: this.heroes[i].health,
            type: this.heroes[i].type,
            species: this.heroes[i].species
        };

        debug.push(hero.name + ': ' + hero.affinity + ' vs ' + affinity + '(' + (this.affinityCounterMap[hero.affinity] === affinity) + ', ' + (this.affinityCounterMap[affinity] === hero.affinity) + ')');
        if (this.affinityCounterMap[hero.affinity] === affinity) {
            debug.push(hero.name + ': attack ' + hero.attack + ' -> ' + Math.round(hero.attack * 1.5));
            hero.attack = Math.round(hero.attack * 1.5);
        }

        if (this.affinityCounterMap[affinity] === hero.affinity) {
            debug.push(hero.name + ': attack ' + hero.attack + ' -> ' + Math.round(hero.attack * 0.5));
            hero.attack = Math.round(hero.attack * 0.5);
        }

        if ([hero.affinity, hero.type, hero.species].indexOf(leaderTarget) > -1) {
            debug.push(hero.name + ': ' + leaderStat + ' ' + hero[leaderStat] + ' -> ' + Math.round(hero[leaderStat] * (this.leaderAblility.value / 100)) + ' by leaders ' + leaderStat + ' x'+ (this.leaderAblility.value / 100));
            hero[leaderStat] = Math.round(hero[leaderStat] * (this.leaderAblility.value / 100));
        }
        result += hero[property];
    }
    return {
        result: result,
        debug: debug
    };
};