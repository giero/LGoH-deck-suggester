function Deck(heroes, options) {
    this.heroes = heroes;
    this.options = options;

    this.leaderTarget = this.heroes[0].leaderAbility.target;
    this.leaderStatModifiers = this.heroes[0].leaderAbility.modifiers;

    this.teamMeetsRequirements = this.checkRequirements();
    this.commanderBonuses = this.collectCommanderBonuses();
}

Deck.prototype.getStats = function () {
    var stats = {attack: 0, recovery: 0, health: 0, power: 0};

    for (var i = this.heroes.length - 1; i >= 0; --i) {
        var hero = new Hero(this.heroes[i]);

        stats.attack += hero.attack;
        stats.recovery += hero.recovery;
        stats.health += hero.health;
        stats.power += hero.power;
    }

    return stats;
};

Deck.prototype.calculate = function (opponentAffinity) {
    var deckStats = {power: 0, attack: 0, attack_and_health: 0};

    if (!this.teamMeetsRequirements) {
        return deckStats;
    }

    for (var i = this.heroes.length - 1; i >= 0; --i) {
        var hero = new Hero(this.heroes[i]); // copy for local stats modifications

        this.applyAffinityBonus(hero, opponentAffinity);
        this.applyLeaderAbilityBonus(hero);
        this.applyEventBonus(hero);

        deckStats.attack += hero.attack;
        deckStats.power += hero.power;
        deckStats.attack_and_health += hero.attack_and_health;
    }

    return deckStats;
};

Deck.prototype.collectCommanderBonuses = function () {
    if (this.options.event !== 'Commander') {
        return {};
    }

    var commanderBonuses = {};
    for (var i = this.heroes.length - 1; i >= 0; --i) {
        var hero = this.heroes[i];

        if (!hero.eventSkills.Commander) {
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
    if (!this.options.counterSkills) {
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

Deck.prototype.applyAffinityBonus = function (hero, opponentAffinity) {
    function counters(current, opponent) {
        // strange construction - I know, but at least it's fast enough ;)
        switch (current) {
            case 'Fire':
                return opponent === 'Earth';
            case 'Earth':
                return opponent === 'Water';
            case 'Water':
                return opponent === 'Fire';
            case 'Light':
                return opponent === 'Dark';
            case 'Dark':
                return opponent === 'Light';
            default:
                return false;
        }
    }

    // apply affinity bonus / counter bonus
    if (counters(hero.affinity, opponentAffinity)) {
        // hero counters opponent
        hero.attack <<= 1;
    } else if (counters(opponentAffinity, hero.affinity)) {
        // opponent counters hero
        hero.attack >>= 1;
    }
};

Deck.prototype.applyLeaderAbilityBonus = function (hero) {
    if (!this.leaderTarget || !hero.canApplyLeaderStats(this.leaderTarget)) {
        return;
    }

    for (var ls in this.leaderStatModifiers) {
        // this is terrible - I know T_T
        // but it has to be that way - array access for objects is so slow ...
        // and I need it to run as fast as it can be

        switch (ls) {
            case 'attack':
                hero.attack *= this.leaderStatModifiers.attack;
                break;
            case 'health':
                hero.health *= this.leaderStatModifiers.health;
                break;
            case 'recovery':
                hero.recovery *= this.leaderStatModifiers.recovery;
                break;
            default:
                throw new Error("Invalid stat " + ls);
        }
    }
};

Deck.prototype.applyEventBonus = function (hero) {
    if (!this.options.event) {
        return;
    }

    if (this.options.event === 'Slayer' && hero.eventSkills.Slayer) {
        hero.attack *= hero.eventSkills.Slayer;
    } else if (this.options.event === 'Commander' && this.commanderBonuses.hasOwnProperty(hero.affinity)) {
        hero.attack *= this.commanderBonuses[hero.affinity];
    }
};
