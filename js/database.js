function Database() {
    this.config = {
        apiKey: "AIzaSyDynzM8igTMnCKm1FO1rQwrUI5g-HXbCiw",
        authDomain: "lgoh-deck-suggester.firebaseapp.com",
        databaseURL: "https://lgoh-deck-suggester.firebaseio.com",
        projectId: "lgoh-deck-suggester",
        storageBucket: "",
        messagingSenderId: "168189621995"
    };
}

Database.prototype.init = function () {
    firebase.initializeApp(this.config);

    return this;
};

Database.prototype.loadHeroes = function (team, callback) {
    team.heroes = [];
    firebase.database().ref('heroes').once('value').then(function(snapshot) {
        snapshot.val().forEach(function (heroStat) {
            team.addHero(heroStat);
        });

        callback && callback();
    });

    return this;
};

Database.prototype.save = function (data, callback) {
    firebase.database().ref('heroes')
        .set(data)
        .then(callback || function () {});

    return this;
};
