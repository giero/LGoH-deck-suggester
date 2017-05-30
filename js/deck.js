function Deck(heroes, options) {
    if (heroes[5] !== undefined && !heroes[5].hasOwnProperty('id')) {
        heroes.splice(5, 1);
    }
    this.heroes = heroes;
    this.options = options;

    this.leaderTarget = this.heroes[0].leaderAbility.target;
    this.leaderStats = this.heroes[0].leaderAbility.stats;
    this.leaderStatValue = this.heroes[0].leaderAbility.value / 100;

    this.secondLeaderTarget = this.heroes[5] ? this.heroes[5].leaderAbility.target : undefined;
    this.secondLeaderStats = this.heroes[5] ? this.heroes[5].leaderAbility.stats : undefined;
    this.secondLeaderStatValue = this.heroes[5] ? this.heroes[5].leaderAbility.value / 100 : undefined;

    this.teamMeetsRequirements = this.checkRequirements();
    this.commanderBonuses = this.collectCommanderBonuses();
}

Deck.prototype.getStats = function () {
    var stats = {attack: 0, recovery: 0, health: 0, power: 0};

    for (var i = this.heroes.length - 1; i >= 0; --i) {
        stats.attack += this.heroes[i].attack;
        stats.recovery += this.heroes[i].recovery;
        stats.health += this.heroes[i].health;
        stats.power += Math.round(this.heroes[i].attack / 3 + this.heroes[i].recovery + this.heroes[i].health / 5);
    }

    return stats;
};

Deck.prototype.calculate = function (affinity) {
    var deckValues = {power: 0, attack: 0, attack_and_health: 0};

    if (!this.teamMeetsRequirements) {
        return deckValues;
    }

    for (var i = this.heroes.length - 1; i >= 0; --i) {
        var hero = new Hero(this.heroes[i]); // copy for local stats modifications

        this.applyAffinityBonus(hero, affinity);
        this.applyLeaderAbilityBonus(
            hero,
            {target: this.leaderTarget, stats: this.leaderStats, statValue: this.leaderStatValue}
        );
        if (this.heroes[5]) {
            this.applyLeaderAbilityBonus(
                hero,
                {target: this.secondLeaderTarget, stats: this.secondLeaderStats, statValue: this.secondLeaderStatValue}
            );
        }

        this.applyEventBonus(hero);

        deckValues.attack += hero.attack;
        deckValues.power += hero.power;
        deckValues.attack_and_health += hero.attack_and_health;
    }

    return deckValues;
};

Deck.prototype.collectCommanderBonuses = function () {
    if (!(this.options.hasOwnProperty('event') && this.options.event === 'Commander')) {
        return {};
    }

    var commanderBonuses = {};
    for (var i = this.heroes.length - 1; i >= 0; --i) {
        var hero = this.heroes[i];

        if (!hero.eventSkills.hasOwnProperty('Commander')) {
            continue;
        }

        if (!commanderBonuses.hasOwnProperty(hero.affinity)) {
            commanderBonuses[hero.affinity] = 0;
        }

        commanderBonuses[hero.affinity] += hero.eventSkills.Commander;
    }
    return commanderBonuses;
};

Deck.prototype.checkRequirements = function () {
    if (!this.options.hasOwnProperty('counterSkills')) {
        return true;
    }

    var deckCounterSkills = [];
    for (var i = this.heroes.length - 1; i >= 0; --i) {
        var hero = this.heroes[i];

        deckCounterSkills.push(hero.counterSkill);
    }

    return this.options.counterSkills.every(function (skill) {
        return deckCounterSkills.indexOf(skill) >= 0;
    });
};

Deck.prototype.applyAffinityBonus = function (hero, affinity) {
    var affinityCounterMap = {
        'Fire': 'Earth',
        'Earth': 'Water',
        'Water': 'Fire',
        'Light': 'Dark',
        'Dark': 'Light'
    };

    // apply affinity bonus / counter bonus
    if (affinityCounterMap[hero.affinity] === affinity) {
        // hero counters opponent
        hero.attack <<= 1;
    } else if (affinityCounterMap[affinity] === hero.affinity) {
        // opponent counters hero
        hero.attack >>= 1;
    }
};

Deck.prototype.applyLeaderAbilityBonus = function (hero, leaderBonus) {
    if (!hero.canApplyLeaderStat(leaderBonus.target)) {
        return;
    }

    for (var ls = leaderBonus.stats.length - 1; ls >= 0; --ls) {
        // this is terrible - I know T_T
        // but it has to be that way - array access for objects is so slow ...
        // and I need it to run as fast as it can be

        switch (leaderBonus.stats[ls]) {
            case 'attack':
                hero.attack *= leaderBonus.statValue;
                break;
            case 'health':
                hero.health *= leaderBonus.statValue;
                break;
            case 'recovery':
                hero.recovery *= leaderBonus.statValue;
                break;
            default:
                throw new Error("Invalid stat " + leaderBonus.stats[ls]);
        }
    }
};

Deck.prototype.applyEventBonus = function (hero) {
    if (!this.options.hasOwnProperty('event')) {
        return;
    }

    if (this.options.event === 'Slayer' && hero.eventSkills.hasOwnProperty('Slayer')) {
        hero.attack *= hero.eventSkills.Slayer;
    } else if (this.options.event === 'Commander' && this.commanderBonuses.hasOwnProperty(hero.affinity)) {
        hero.attack *= this.commanderBonuses[hero.affinity];
    }
};
