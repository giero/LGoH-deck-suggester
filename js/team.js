function Team(name, dataStorage) {
    this.name = name;
    this.storage = dataStorage;
    this.heroes = [];
}

Team.prototype.addHero = function (hero) {
    if (!(hero instanceof Hero)) {
        hero = new Hero(hero);
    }

    this.heroes.push(hero);
    this.save();
};

Team.prototype.removeHero = function (id) {
    for (var i = this.heroes.length - 1; i >= 0 ; --i) {
        if (this.heroes[i].id == id) {
            this.heroes.splice(i, 1);
            this.save();
            break;
        }
    }
};

Team.prototype.getHeroes = function (filters, sort) {
    var heroes = this.heroes.slice();

    if (!!sort) {
        heroes.sort(function (a, b) {
            if ( a.name < b.name ) {
                return -1;
            } else if ( a.name > b.name ) {
                return 1;
            }
            return 0;
        });
    }

    if (filters && Object.keys(filters).length !== 0) {
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

Team.prototype.getUniqueHeroesProperties = function (property, filter) {
    if (!this.heroes.length) {
        return [];
    }

    if (!property || !this.heroes[0].hasOwnProperty(property)) {
        throw new Error('Unknown hero property (' + property + ')');
    }

    return this.heroes
        .map(function (hero) {
            return hero[property];
        })
        .filter(function (value, index, self) {
            if (Array.isArray(filter)) {
                return value && self.indexOf(value) === index && filter.indexOf(value) === -1;
            } else {
                return value && self.indexOf(value) === index;
            }
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

Team.prototype.save = function () {
    if (typeof(Storage) === 'undefined') {
        return;
    }

    this.storage.setItem('heroes::' + this.name , JSON.stringify(this.heroes));
};

Team.prototype.load = function () {
    if (typeof(Storage) === 'undefined') {
        return;
    }

    this.heroes = JSON.parse(this.storage.getItem('heroes::' + this.name)) || [];

    return !!this.heroes.length;
};

Team.prototype.loadFromString = function(config) {
    if (typeof config === 'string' && config.length) {
        try {
            this.heroes = JSON.parse(config) || [];
            this.save();

            return true;
        } catch (e) {
        }
    }

    return false;
};