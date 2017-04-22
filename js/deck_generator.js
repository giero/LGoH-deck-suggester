function DeckGenerator(heroes) {
    this.heroes = heroes;
}

DeckGenerator.prototype.generate = function () {
    var combination = [];
    var result = new Array(5);
    var best = {
        value: 0,
        heroes: [],
        calc: 0
    };

    function combinations(heroes, len, offset, result) {
        if (len === 0) {
            var d = new Deck(result);
            var value = d.calculate('power');
            best['calc']++;
            if (value > best.value) {
                best['value'] = value;
                best['heroes'] = JSON.parse(JSON.stringify(d.heroes));
            }

            return;
        }

        for (var i = offset; i <= heroes.length - len; i++){
            result[result.length - len] = heroes[i];
            combinations(heroes, len-1, i+1, result);
        }
    }

    combinations(this.heroes, 5, 0, result);

    return best;
};


/*
public class Combination {
    public static void main(String[] args){
    String[] arr = {"A","B","C","D","E","F"};
    combinations2(arr, 3, 0, new String[3]);
}

static void combinations2(String[] arr, int len, int startPosition, String[] result){
    if (len == 0){
        System.out.println(Arrays.toString(result));
        return;
    }
    for (int i = startPosition; i <= arr.length-len; i++){
        result[result.length - len] = arr[i];
        combinations2(arr, len-1, i+1, result);
    }
}
}
    */