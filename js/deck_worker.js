onmessage = function(e) {
    importScripts('hero.js', 'deck.js', 'deck_generator.js');

    var dg = new DeckGenerator(e.data.heroes);
    var generated = dg.generate(e.data.options);
    this.postMessage(generated);
};
