var teamHeroes = new Team('user', localStorage);
var allHeroes = new Team('all', sessionStorage);

teamHeroes.load();

if (false === allHeroes.load()) {
    $.getJSON("data/heroes_all.json", function (json) {
        json.forEach(function (heroStat) {
            allHeroes.addHero(heroStat);
        });
        allHeroes.save();
    });
}

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
                team.removeHero($(e.target).parents('tr').attr('data-hero-id'));
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
                fire: teamHeroes.getHeroes({'affinity': 'Fire'}, true).length,
                water: teamHeroes.getHeroes({'affinity': 'Water'}, true).length,
                earth: teamHeroes.getHeroes({'affinity': 'Earth'}, true).length,
                light: teamHeroes.getHeroes({'affinity': 'Light'}, true).length,
                dark: teamHeroes.getHeroes({'affinity': 'Dark'}, true).length,
                all: teamHeroes.getHeroes({}, true).length
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
                var eventSkill = kv.name.match(/^eventSkills\[([A-Za-z ]+)\]$/);

                if (eventSkill !== null) {
                    if (!formParams.hasOwnProperty('eventSkills')) {
                        formParams.eventSkills = {};
                    }

                    if (kv.value !== '') {
                        formParams.eventSkills[eventSkill[1]] = parseInt(kv.value);
                    }

                } else {
                    formParams[kv.name] = parseInt(kv.value);
                }
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
        },
        clearTeam: function (e) {
            e.preventDefault();

            teamHeroes.heroes = [];
            teamHeroes.save();
        }
    },
    mounted: function () {
        var self = this;

        // fill by default hero stats values
        $('#team-hero-id').on('hidden.bs.select', function (e) {
            var heroId = $(this).find('option:selected').val();

            if (!heroId) {
                return;
            }

            var hero = self.allHeroes.find(heroId);

            for (var stat in {'attack': null, 'recovery': null, 'health': null}) {
                $('#team-hero-' + stat).val(parseInt(hero[stat]) >> 1);
            }

            var eventSkillsMap = {'Slayer': 'slayer', 'Bounty Hunter': 'bounty-hunter', 'Commander': 'commander'};
            for (var skill in eventSkillsMap) {
                if (hero.eventSkills.hasOwnProperty(skill)) {
                    $('#team-hero-' + eventSkillsMap[skill]).val(hero.eventSkills[skill]);
                    $('#team-hero-' + eventSkillsMap[skill]).selectpicker('refresh');
                }
            }
        });
    }
});

Vue.component('computed-decks', {
    template: '#computed-decks',
    data: function () {
        return {
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
            workers: {},
            workersActive: 0,
            event: '',
            counterSkills: [],
            affinitiesLimit: [],
            affinityOptions: ['Fire', 'Water', 'Earth', 'Light', 'Dark', 'No affinity bonus'],
            progressClass: {
                'Fire': 'progress-bar progress-bar-danger',
                'Earth': 'progress-bar progress-bar-success',
                'Water': 'progress-bar progress-bar-info',
                'Light': 'progress-bar progress-bar-warning',
                'Dark': 'progress-bar progress-bar-active',
                'No affinity bonus': 'progress-bar progress-bar-default'
            }
        }
    },
    computed: {
        possibilities: function () {
            var dg = new DeckGenerator(this.teamHeroes.getHeroes());
            return dg.countPossibilities();
        },
        counterSkillsOptions: function () {
            return this.teamHeroes.getUniqueHeroesProperties('counterSkill', ['None', 'Unknown']);
        }
    },
    updated: function () {
        $('[data-toggle="popover"]').popover();
        $('[data-toggle="tooltip"]').tooltip();
    },
    methods: {
        deckWorkers: function () {
            var self = this;
            var affinities = this.affinitiesLimit.length ? this.affinitiesLimit : this.affinityOptions;

            $.each(affinities, function (index, affinity) {
                if (self.workers.hasOwnProperty(affinity) && self.workers[affinity] instanceof Worker) {
                    self.workers[affinity].terminate();
                    self.workers[affinity] = undefined;
                }

                self.workers[affinity] = new Worker('js/deck_worker.js');

                self.workers[affinity].onmessage = function (e) {
                    var data = e.data;
                    if (!(data instanceof Object)) {
                        self.workersProgress[affinity] = data;
                    } else {
                        self.bestDecks = $.extend(self.bestDecks, data);
                        self.stopCalculations(affinity);
                    }
                };

            });

            return this.workers;
        },
        calculateDecks: function (e) {
            $('#calculate-decks').hide();
            $('#stop-calculations').show();

            var affinities = this.affinitiesLimit.length ? this.affinitiesLimit : this.affinityOptions;
            var options = {};
            if (this.event) {
                options.event = this.event;
            }
            if (this.counterSkills.length) {
                options.counterSkills = this.counterSkills;
            }

            this.bestDecks = {
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

            var deckWorkers = this.deckWorkers();
            for (var i = 0; i < affinities.length; ++i) {
                var affinity = affinities[i];

                options.affinitiesLimit = [affinity];

                this.workersActive++;
                deckWorkers[affinity].postMessage({
                    heroes: this.teamHeroes.getHeroes(),
                    options: options
                });
            }


        },
        stopCalculations: function (affinity) {
            var stopAffinityWorker = (function (a) {
                if (this.workers[a] instanceof Worker) {
                    this.workers[a].terminate();
                    this.workers[a] = undefined;
                    this.workersProgress[a] = -1;
                    this.workersActive--;
                }
            }).bind(this);

            if (affinity) {
                stopAffinityWorker(affinity);
            } else {
                for (var i = 0; i < this.affinityOptions.length; ++i) {
                    affinity = this.affinityOptions[i];
                    stopAffinityWorker(affinity);
                }
            }

            if (this.workersActive <= 0) {
                $('#calculate-decks').show();
                $('#stop-calculations').hide();
                this.workersActive = 0;
            }
        }
    },
    mounted: function () {
        $('#page-nav a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });

        if (typeof(Storage) !== "undefined" && localStorage.hasOwnProperty('calculated::data')) {
            this.bestDecks = JSON.parse(localStorage.getItem('calculated::data'))
        }

        $('[data-toggle="popover"]').popover();
        $('[data-toggle="tooltip"]').tooltip();

        $('#page-nav a[href="#decks"]').on('shown.bs.tab', function (e) {
            $('#calculation-counter-skill').selectpicker('refresh');
        });
    }
});

new Vue({
    el: '#app',
    data: {
        teamHeroes: teamHeroes
    },
    mounted: function () {
        $('#team').find('.hero-editable-stat').editable({
            highlight: false,
            success: function (response, newValue) {
                var $this = $(this);
                var heroId = $this.parents('tr').attr('data-hero-id');
                var hero = teamHeroes.find(heroId);
                var stat = $this.attr('data-stat');

                hero[stat] = parseInt(newValue);
                teamHeroes.save();
            },
            validate: function (value) {
                if (!value.match(/^\d+$/)) {
                    return 'This value should be a number.';
                }
            }
        });

        $('.team-actions-menu').on('click', 'a', function (e) {
            e.preventDefault();

            // undo default navigation click behavior
            var $this = $(this);
            $this.parent('li').removeClass('active');
            $this.parents('.dropdown-right').addClass('active');

            // do some actions
            var action = $this.data('action');
            switch (action) {
                case 'import':
                case 'export':
                case 'save':
                case 'load':
                case 'delete':
                    teamOperations[action]();
                    break;
                default:
                    throw new Error("Unknown/unhandled action '" + action + "'")
            }
        });
    }
});
