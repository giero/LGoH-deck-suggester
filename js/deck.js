function Deck(heroes, options) {
    this.heroes = heroes;
    this.options = options;

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
                || (typeof hero.species === 'string'
                    ? this.leaderTarget === hero.species
                    : hero.species.some((function (species) {
                        return this.leaderTarget === species
                    }).bind(this))
                );
        } else {
            return this.leaderTarget.every(function (value) {
                return ([hero.affinity, hero.type, hero.species]
                    .concat(Object.keys(hero.eventSkills))
                    .indexOf(value) >= 0);
            });
        }

    }).bind(this);

    this.commanderBonuses = {};
    if (options.hasOwnProperty('event') && options.event === 'Commander') {
        this.collectCommanderBonuses();
    }

    this.teamMeetsRequirements = true;
    if (options.hasOwnProperty('counterSkills')) {
        this.teamMeetsRequirements = this.checkCounterSkillsRequirements();
    }
}

Deck.prototype.calculate = function (affinity) {
    var deckValues = {
        power: 0,
        attack: 0
    };

    if (!this.teamMeetsRequirements) {
        return deckValues;
    }

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

        if (this.options.hasOwnProperty('event')) {
            if (this.options.event === 'Slayer' && hero.eventSkills.hasOwnProperty('Slayer')) {
                hero.attack *= hero.eventSkills.Slayer;
            } else if (this.options.event === 'Commander' && this.commanderBonuses.hasOwnProperty(hero.affinity)) {
                hero.attack *= this.commanderBonuses[hero.affinity];
            }
        }

        deckValues.attack += hero.attack;
        deckValues.power += hero.power;
    }

    return deckValues;
};

Deck.prototype.collectCommanderBonuses = function () {
    for (var i = this.heroes.length - 1; i >= 0; --i) {
        var hero = this.heroes[i];

        if (!hero.eventSkills.hasOwnProperty('Commander')) {
            continue;
        }

        if (!this.commanderBonuses.hasOwnProperty(hero.affinity)) {
            this.commanderBonuses[hero.affinity] = 0;
        }

        this.commanderBonuses[hero.affinity] += hero.eventSkills.Commander;
    }
};

Deck.prototype.checkCounterSkillsRequirements = function () {
    var deckCounterSkills = [];
    for (var i = this.heroes.length - 1; i >= 0; --i) {
        var hero = this.heroes[i];

        deckCounterSkills.push(hero.counterSkill);
    }

    return this.options.counterSkills.every(function (skill) {
        return deckCounterSkills.indexOf(skill) >= 0;
    });
};