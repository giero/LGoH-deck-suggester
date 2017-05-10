var teamHeroes = new Team();
var allHeroes = new Team();
var staredName = function (name, rarity) {
    return name + "&nbsp;" + "<span style='color: #FFB404;' class='glyphicon glyphicon-star'></span>".repeat(rarity);
};

Number.prototype.format = function (n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

$.getJSON("data/heroes_all.json", function (json) {
    json.forEach(function (heroStat) {
        allHeroes.addHero(heroStat);
    });
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
        },
        methods: {
            removeHeroFromList: function (e) {
                if (e.target.dataset.hasOwnProperty('heroId')) {
                    team.removeHero(e.target.dataset.heroId);
                }
            }
        },
        filters: {
            staredName: staredName
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
                dark: teamHeroes.getHeroes({'affinity': 'Dark'}).length,
                all: teamHeroes.getHeroes().length
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
                dark: allHeroes.getHeroes({'affinity': 'Dark'}).length,
                all: allHeroes.getHeroes().length
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
                $.extend({}, allHeroes.find(formParams.id), formParams, {id: teamHeroes.heroes.length})
            );

            $form[0].reset();
            this.refreshSelect();
        },
        addRandomHeroToTeam: function (e) {
            e.preventDefault();

            var n = e.shiftKey ? 10 : 1;

            for (var i = 0; i < n; i++) {
                var hero = $.extend(
                    {},
                    allHeroes.heroes[Math.floor(Math.random() * allHeroes.heroes.length)],
                    {
                        id: teamHeroes.heroes.length,
                        attack: Math.floor(Math.random() * 1200) + 100,
                        recovery: Math.floor(Math.random() * 900) + 100,
                        health: Math.floor(Math.random() * 2400) + 100
                    }
                );
                teamHeroes.addHero(hero);
            }
        }
    },
    mounted: function () {
        var self = this;

        // fill by default hero stats values
        $('#team-adding').find('select').on('hidden.bs.select', function (e) {
            var heroId = $(this).find('option:selected').val();
            var hero = self.allHeroes.find(heroId);

            for (var stat in {'attack': null, 'recovery': null, 'health': null}) {
                $('#team-hero-' + stat).val(hero[stat]);
            }
        });
    },
    filters: {
        staredName: staredName
    }
});

Vue.component('computed-decks', {
    template: '#computed-decks',
    data: function () {
        return {
            teamHeroes: teamHeroes,
            bestDecks: {},
            progress: -1,
            worker: undefined
        }
    },
    computed: {
        possibilities: function () {
            var dg = new DeckGenerator(this.teamHeroes.getHeroes());
            return dg.countPossibilities();
        },
        deckWorker: function () {
            var self = this;

            if (this.worker instanceof Worker) {
                this.worker.terminate();
                this.worker = undefined;
            }

            this.worker = new Worker('js/deck_worker.js');

            this.worker.onmessage = function (e) {
                var data = e.data;
                if (!(data instanceof Object)) {
                    self.progress = data;
                } else if (data.hasOwnProperty('Fire')) {
                    self.bestDecks = data;
                    self.stopCalculations();
                } else {
                    console.log('error?', e.data);
                }
            };

            return this.worker;
        }
    },
    updated: function () {
        $('[data-toggle="popover"]').popover();
    },
    methods: {
        calculateDecks: function (e) {
            $('#calculate-decks').hide();
            $('#stop-calculations').show();

            this.bestDecks = {};
            this.deckWorker.postMessage(this.teamHeroes.getHeroes());
        },
        stopCalculations: function () {
            $('#calculate-decks').show();
            $('#stop-calculations').hide();

            if (this.worker instanceof Worker) {
                this.worker.terminate();
                this.worker = undefined;
                this.progress = -1;
            }
        }
    },
    mounted: function () {
        $('#page-nav a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
    },
    filters: {
        staredName: staredName
    }
});

new Vue({
    el: '#app',
    data: {
        teamHeroes: teamHeroes
    }
});
