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
};

Team.prototype.addHeroes = function (heroes) {
    for (var i = 0, hl = heroes.length; i < hl; ++i) {
        this.addHero(heroes[i]);
    }
};

Team.prototype.removeHero = function (id) {
    for (var i = this.heroes.length - 1; i >= 0; --i) {
        if (this.heroes[i].id === id) {
            this.heroes.splice(i, 1);
            return true;
        }
    }
    return false;
};

Team.prototype.getHeroEvolution = function (hero) {
    return {
        evolveFrom: !!hero.evolveFrom ? this.find(hero.evolveFrom) : null,
        evolveInto: !!hero.evolveInto ? this.find(hero.evolveInto) : null
    };
};

Team.prototype.getHeroes = function (filters, sort) {
    var heroes = this.heroes.slice();

    if (sort) {
        heroes.sort(function (a, b) {
            var lValue = undefined,
                rValue = undefined;

            switch (sort) {
                case 'power':
                    lValue = b.power;
                    rValue = a.power;
                    break;
                case 'defender-skill':
                    lValue = a.defenderSkill;
                    rValue = b.defenderSkill;
                    break;
                case 'counter-skill':
                    lValue = a.counterSkill;
                    rValue = b.counterSkill;
                    break;
                case 'name':
                default:
                    lValue = a.name + a.rarity;
                    rValue = b.name + b.rarity;
                    break;
            }

            if (lValue < rValue) {
                return -1;
            } else if (lValue > rValue) {
                return 1;
            }
            return 0;
        });
    }

    if (filters && Object.keys(filters).length !== 0) {
        return heroes.filter(function (hero) {
            for (var filter in filters) {
                if (filters.hasOwnProperty(filter)) {
                    if (!hero.hasOwnProperty(filter)) {
                        throw new Error('Unknown hero property (' + filter + ')');
                    }
                    if (hero[filter] !== filters[filter]) {
                        return false;
                    }
                }
            }
            return true;
        });
    }

    return heroes;
};

Team.prototype.getHeroesByAffinity = function () {
    var affinityHeroes = {
        Fire: [],
        Water: [],
        Earth: [],
        Light: [],
        Dark: []
    };
    for (var i = 0, hl = this.heroes.length; i < hl; ++i) {
        affinityHeroes[this.heroes[i].affinity].push(this.heroes[i]);
    }

    return affinityHeroes;
};

Team.prototype.getUniqueHeroesProperties = function (property, filter) {
    if (!this.heroes.length) {
        return [];
    }

    if (!property || !this.heroes[0].hasOwnProperty(property)) {
        throw new Error('Unknown hero property (' + property + ')');
    }

    return this.heroes
    // get all properties
        .map(function (hero) {
            return hero[property];
        })
        // get unique list
        .filter(function (value, index, self) {
            if (filter && Array.isArray(filter)) {
                return value && self.indexOf(value) === index && filter.indexOf(value) === -1;
            } else {
                return value && self.indexOf(value) === index;
            }
        })
        // obvious ;)
        .sort();
};

Team.prototype.find = function (id) {
    for (var i = 0; i < this.heroes.length; ++i) {
        if (this.heroes[i].id === id || this.heroes[i].coreId === id) {
            return this.heroes[i];
        }
    }

    return null;
};

Team.prototype.save = function () {
    if (typeof(Storage) === 'undefined') {
        return;
    }

    this.storage.setItem('heroes::' + this.name, this.serialize());
};

Team.prototype.load = function () {
    if (typeof(Storage) === 'undefined') {
        return;
    }

    this.heroes = [];
    this.addHeroes(
        JSON.parse(this.storage.getItem('heroes::' + this.name)) || []
    );

    return !!this.heroes.length;
};

Team.prototype.loadFromString = function (config) {
    if (typeof config === 'string' && config.length) {
        try {
            this.heroes = [];
            this.addHeroes(
                JSON.parse(config) || []
            );
            return true;
        } catch (e) {
        }
    }

    return false;
};

Team.prototype.serialize = function () {
    return JSON.stringify(this.heroes);
};