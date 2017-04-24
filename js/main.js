var teamHeroes = new Team();
var allHeroes = new Team();

Number.prototype.format = function (n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

$.getJSON("data/heroes_all.json", function (json) {
    json.forEach(function (heroStat) {
        allHeroes.addHero(heroStat);
    });

    for (var i = 0; i < 25; i++) {
        var hero = $.extend(
            {},
            allHeroes.heroes[Math.floor(Math.random() * allHeroes.heroes.length)],
            {
                attack: Math.floor(Math.random() * 1000),
                recovery: Math.floor(Math.random() * 300),
                health: Math.floor(Math.random() * 1000)
            }
        );
        teamHeroes.addHero(hero);
    }
});

function getHeroesTableComponent(team) {
    return {
        template: '#heroes-table',
        props: ['affinity'],
        data: function () {
            return {team: team, searchKey: ''};
        },
        computed: {
            filteredHeroes: function () {
                var self = this;
                return self.team.getHeroes(!!this.affinity ? {'affinity': this.affinity} : {}).filter(function (hero) {
                    return hero.name.toLowerCase().indexOf(self.searchKey.toLowerCase()) !== -1;
                });
            }
        }
    }
}

Vue.component('heroes-table', {
    template: '#heroes-table',
    props: ['affinity']
});

Vue.component('team-heroes-list', {
    template: '#heroes-list',
    data: function () {
        return {
            listId: 'team-heroes-list'
        };
    },
    components: {
        'heroes-table': getHeroesTableComponent(teamHeroes)
    },
    computed: {
        counter: function () {
            return {
                fire: teamHeroes.getHeroes({'affinity': 'Fire'}).length,
                water: teamHeroes.getHeroes({'affinity': 'Water'}).length,
                earth: teamHeroes.getHeroes({'affinity': 'Earth'}).length,
                light: teamHeroes.getHeroes({'affinity': 'Light'}).length,
                dark: teamHeroes.getHeroes({'affinity': 'Dark'}).length
            }
        }
    },
    mounted: function () {
        $('#team-heroes-list a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
    }
});

Vue.component('all-heroes-list', {
    template: '#heroes-list',
    data: function () {
        return {
            listId: 'all-heroes-list'
        };
    },
    components: {
        'heroes-table': getHeroesTableComponent(allHeroes)
    },
    computed: {
        counter: function () {
            return {
                fire: allHeroes.getHeroes({'affinity': 'Fire'}).length,
                water: allHeroes.getHeroes({'affinity': 'Water'}).length,
                earth: allHeroes.getHeroes({'affinity': 'Earth'}).length,
                light: allHeroes.getHeroes({'affinity': 'Light'}).length,
                dark: allHeroes.getHeroes({'affinity': 'Dark'}).length
            }
        }
    },
    mounted: function () {
        $('#all-heroes-list a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
    }
});

Vue.component('team-adding-form', {
    template: '#team-adding-form',
    data: function () {
        return {
            allHeroes: allHeroes,
            teamHeroes: teamHeroes
        };
    },
    computed: {
        heroes: function () {
            return allHeroes.getHeroes();
        },
        affinities: function () {
            return ['Fire', 'Water', 'Earth', 'Light', 'Dark'];
        }
    },
    updated: function () {
        this.refreshSelect();
    },
    methods: {
        refreshSelect: function () {
            $('#team-adding').find('select').selectpicker('refresh');
        },
        addHeroToTeam: function (e) {
            e.preventDefault();

            var $form = $(e.target),
                formParams = {};

            $.each($form.serializeArray(), function (_, kv) {
                formParams[kv.name] = kv.value;
            });

            teamHeroes.addHero(
                $.extend({}, allHeroes.heroes[formParams.id], formParams)
            );

            $form[0].reset();
            this.refreshSelect();
        }
    }
});

new Vue({
    el: '#app',
    data: {
        teamHeroes: teamHeroes,
        bestDecks: {}
    },
    computed: {
        dg: function () {
            return new DeckGenerator(this.teamHeroes.getHeroes());
        },
        possibilities: function () {
            return this.dg.countPossibilities();
        }
    },
    methods: {
        calculateDecks: function () {
            this.bestDecks = this.dg.generate();
        }
    },
    mounted: function () {
        $('#page-nav a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
    }
});
