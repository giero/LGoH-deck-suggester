function Hero(props) {
    this.id = props.id;
    this.coreId = props.coreId;
    this.name = props.name;
    this.rarity = props.rarity;
    this.awakening = props.awakening || 0;

    this.affinity = props.affinity;
    this.type = props.type;
    this.species = props.species;

    this.attack = props.attack;
    this.recovery = props.recovery;
    this.health = props.health;

    this.eventSkills = props.eventSkills;
    this.defenderSkill = props.defenderSkill;
    this.counterSkill = props.counterSkill;
    this.leaderAbility = props.leaderAbility;

    this.evolveFrom = props.evolveFrom;
    this.evolveInto = props.evolveInto;
}

Object.defineProperty(Hero.prototype, 'rarityStarsHTML', {
    get: function () {
        return "<span class='rarity-star glyphicon glyphicon-star'></span>".repeat(this.rarity);
    }
});

Object.defineProperty(Hero.prototype, 'power', {
    get: function () {
        if (!(this.attack && this.recovery && this.health)) {
            return 0;
        }

        if (this.eventSkills.hasOwnProperty('Warden')) {
            return Math.round(this.attack / 2 + this.recovery * 1.5 + this.health * .3);
        }

        return Math.round(this.attack / 3 + this.recovery + this.health / 5);
    }
});

Object.defineProperty(Hero.prototype, 'attack_and_health', {
    get: function () {
        return this.attack && this.health
            ? this.attack + this.health
            : 0;
    }
});

Hero.prototype.matchesWithStat = function (stat) {
    return this.affinity === stat
        || this.type === stat
        || this.species === stat
        || this.eventSkills.hasOwnProperty(stat)
        // it's required for example for species like "God Honored"
        // and leader ability can be for God or Honored heroes only
        // TODO: maybe will be faster to add another attribute for Technological/Honored etc?
        || (this.name === 'Vulcan Fireshaper' || this.name === 'Vulcan Flameblood') && this.species.indexOf(stat) >= 0;

};

Hero.prototype.canApplyLeaderStats = function (leaderTarget) {
    if (typeof leaderTarget === 'string') {
        return this.matchesWithStat(leaderTarget);
    } else {
        for (var lt = leaderTarget.length - 1; lt >= 0; --lt) {
            if (!this.matchesWithStat(leaderTarget[lt])) {
                return false;
            }
        }
        return true;
    }
};
