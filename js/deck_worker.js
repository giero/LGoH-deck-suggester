onmessage = function(e) {
    importScripts('deck.js', 'deck_generator.js');

    var dg = new DeckGenerator(e.data);
    var generated = dg.generate();
    console.log(generated);
    this.postMessage(JSON.stringify(generated));
};
