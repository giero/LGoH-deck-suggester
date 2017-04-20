function Hero(stats) {
    $.extend(this, stats);

    this.power = Math.round(this.attack / 3 + this.recovery + this.health / 5);
}
