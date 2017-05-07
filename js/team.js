function Team() {
    this.heroes = [];
}

Team.prototype.addHero = function (hero) {
    if (!(hero instanceof Hero)) {
        hero = new Hero(hero);
    }

    this.heroes.push(hero);
};

Team.prototype.removeHero = function (id) {
    console.log('remove id ' + id);
    for (var i = this.heroes.length - 1; i >= 0 ; --i) {
        if (this.heroes[i].id == id) {
            this.heroes.splice(i, 1);
            break;
        }
    }
};

Team.prototype.getHeroes = function (filters) {
    var heroes = this.heroes.slice();

    heroes.sort(function (a, b) {
        if ( a.name < b.name ) {
            return -1;
        } else if ( a.name > b.name ) {
            return 1;
        }
        return 0;
    });

    if (filters) {
        return heroes.filter(function (hero) {
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

    return heroes;
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

Team.prototype.find = function (id) {
    for (var i = 0; i < this.heroes.length; ++i) {
        if (this.heroes[i].id == id) {
            return this.heroes[i];
        }
    }

    return null;
};