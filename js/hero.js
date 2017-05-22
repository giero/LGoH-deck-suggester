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

Object.defineProperty(Hero.prototype, 'power', {
    get: function () {
        return this.attack && this.recovery && this.health
            ? Math.round(this.attack / 3 + this.recovery + this.health / 5)
            : 0;
    }
});

Object.defineProperty(Hero.prototype, 'attack and health', {
    get: function () {
        return this.attack && this.health
            ? this.attack + this.health
            : 0;
    }
});