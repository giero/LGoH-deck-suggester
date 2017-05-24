function Hero(props) {
    this.id = props.id;
    this.name = props.name;
    this.rarity = props.rarity;

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
    this.evolveTo = props.evolveTo;
}

Hero.prototype.matchesWithStat = function (stat) {
    return this.affinity === stat
        || this.type === stat
        // it's required for example for Vulcan Fireshaper - species: "God Honored",
        // and leader ability can be for God or Honored heroes only
        || this.species.indexOf(stat) >= 0
        || Object.keys(this.eventSkills).indexOf(stat) >= 0;
};

Object.defineProperty(Hero.prototype, 'power', {
    get: function () {
        return this.attack && this.recovery && this.health
            ? Math.round(this.attack / 3 + this.recovery + this.health / 5)
            : 0;
    }
});

Object.defineProperty(Hero.prototype, 'attack_and_health', {
    get: function () {
        return this.attack && this.health
            ? this.attack + this.health
            : 0;
    }
});