onmessage = function(e) {
    importScripts('hero.js', 'deck.js', 'deck_generator.js');

    var dg = new DeckGenerator(e.data);
    var generated = dg.generate();
    this.postMessage(generated);
};
