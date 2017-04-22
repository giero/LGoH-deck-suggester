function Deck(heroes) {
    this.heroes = heroes;
}

Deck.prototype.calculate = function (property) {
    var result = 0;

    for (var i = 0; i < this.heroes.length; i++) {
        result += this.heroes[i][property];
    }

    return result;
};