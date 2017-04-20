function Team() {
    this.heroes = [];
}

Team.prototype.addHero = function (hero) {
    if (!hero instanceof Hero) {
        hero = new Hero(hero);
    }

    this.heroes.push(hero);
    this.heroes.sort(function (h1, h2) {
        if (h1.name < h2.name )
            return -1;
        if (h1.name > h2.name )
            return 1;
        return 0;
    });
};

Team.prototype.getHeroes = function (filters) {
    if (filters) {
        return this.heroes.filter(function (hero) {
            for(var filter in filters){
                if (filters.hasOwnProperty(filter)) {
                    if (!hero.hasOwnProperty(filter)) {
                        throw new Error('Unknown hero property (' + filter + ')');
                    }
                    if(hero[filter] !== filters[filter]){ return false; }
                }
            }
            return true;
        });
    }

    return this.heroes;
};

Team.prototype.getUniqueHeroesProperties = function (property) {
    if (!property || !this.heroes[0].hasOwnProperty(property)) {
        throw new Error('Unknown hero property (' + property + ')');
    }

    return this.heroes
        .map(function (hero) {
            return hero[property];
        })
        .filter(function (value, index, self) {
            return value && self.indexOf(value) === index;
        })
        .sort();
};
