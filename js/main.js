var teamHeroes = new Team();
var allHeroes = new Team();
var affinities = ['Fire', 'Water', 'Earth', 'Light', 'Dark'];

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
            teamHeroes: teamHeroes,
            affinities: affinities
        };
    },
    computed: {
        heroes: function () {
            return allHeroes.getHeroes();
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
        },
        addRandomHeroToTeam: function (e) {
            e.preventDefault();

            var n = e.shiftKey ? 10 : 1;

            for (var i = 0; i < n; i++) {
                var hero = $.extend(
                    {},
                    allHeroes.heroes[Math.floor(Math.random() * allHeroes.heroes.length)],
                    {
                        attack: Math.floor(Math.random() * 1200) + 100,
                        recovery:Math.floor(Math.random() * 900) + 100,
                        health: Math.floor(Math.random() * 2400) + 100
                    }
                );
                teamHeroes.addHero(hero);
            }
        }
    }
});

new Vue({
    el: '#app',
    data: {
        teamHeroes: teamHeroes,
        bestDecks: {
            'Fire': {},
            'Earth': {},
            'Water': {},
            'Light': {},
            'Dark': {}
        },
        workersProgress: {
            'Fire': -1,
            'Earth': -1,
            'Water': -1,
            'Light': -1,
            'Dark': -1
        },
        progressClass: {
            'Fire': 'progress-bar progress-bar-danger',
            'Earth': 'progress-bar progress-bar-success',
            'Water': 'progress-bar progress-bar-info',
            'Light': 'progress-bar progress-bar-warning',
            'Dark': 'progress-bar progress-bar-active'
        }
    },
    computed: {
        possibilities: function () {
            var dg = new DeckGenerator(this.teamHeroes.getHeroes());
            return dg.countPossibilities();
        },
        workers: function () {
            var self = this;
            var workers = {};

            $.each(affinities, function (index, affinity){
                workers[affinity] = new Worker('js/deck_worker.js');
                workers[affinity].addEventListener('message', function(e) {
                    if (e.data.hasOwnProperty('affinity')) {
                        if (e.data.hasOwnProperty('deck')) {
                            self.bestDecks[e.data.affinity] = e.data.deck;
                        } else if (e.data.hasOwnProperty('progress')) {
                            self.workersProgress[e.data.affinity] = e.data.progress;
                        }
                    } else {
                        console.log('error?', e.data);
                    }
                }, false);
            });

            return workers;
        }
    },
    methods: {
        calculateDecks: function () {
            this.bestDecks =  {
                'Fire': {},
                'Earth': {},
                'Water': {},
                'Light': {},
                'Dark': {}
            };
            this.workersProgress = {
                'Fire': -1,
                'Earth': -1,
                'Water': -1,
                'Light': -1,
                'Dark': -1
            };
            for (var affinity in this.workers) {
                if (this.workers.hasOwnProperty(affinity)) {
                    this.workers[affinity].postMessage({
                        affinity: affinity,
                        heroes: this.teamHeroes.getHeroes()
                    });
                }
            }
        }
    },
    mounted: function () {
        $('#page-nav a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
    }
});
