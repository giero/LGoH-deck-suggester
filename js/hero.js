function Hero(stats) {
    $.extend(this, stats);
    Object.defineProperty(this, 'power', {
        get: function() { return Math.round(this.attack / 3 + this.recovery + this.health / 5) }
    });
}

