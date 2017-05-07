function Hero(hero) {
    for (var stat in hero) {
        if (hero.hasOwnProperty(stat)) {
            this[stat] = hero[stat];
        }
    }
    this.power = this.attack && this.recovery && this.health
        ? Math.round(this.attack / 3 + this.recovery + this.health / 5)
        : null;
}
