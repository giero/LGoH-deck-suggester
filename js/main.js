var teamHeroes = new Team('user', localStorage);
var allHeroes = new Team('all', sessionStorage);

teamHeroes.load();

if (false === allHeroes.load()) {
    $.getJSON("data/heroes_all.json", function (json) {
        for (var i = 0; i < json.length; ++i) {
            var hero = new Hero(json[i]);
            // all imported heroes are awaken at level 5
            // we don't need such power ;)
            hero.attack >>= 1;
            hero.recovery >>= 1;
            hero.health >>= 1;
            allHeroes.addHero(hero);
        }
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
            teamHeroes.save();

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
                teamHeroes.save();
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
                $('#team-hero-' + stat).val(parseInt(hero[stat]));
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
            allHeroes: allHeroes,
            bestDecks: {},
            progress: -1,
            worker: undefined,
            event: '',
            counterSkills: [],
            friendsLeaders: [],
            affinitiesLimit: [],
            affinityOptions: ['Fire', 'Water', 'Earth', 'Light', 'Dark', 'No affinity bonus'],
            affinities: ['Fire', 'Water', 'Earth', 'Light', 'Dark']
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
                } else {
                    self.bestDecks = data;

                    if (typeof(Storage) !== "undefined") {
                        localStorage.setItem('calculated::data', JSON.stringify(data));
                    }
                    ga('send', 'event', 'Decks', 'calculations', 'possibilities', self.possibilities);

                    self.stopCalculations();
                }
            };

            return this.worker;
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
        calculateDecks: function (e) {
            $('#calculate-decks').hide();
            $('#stop-calculations').show();

            var options = {};
            if (this.event) {
                options.event = this.event;
            }
            if (this.counterSkills.length) {
                options.counterSkills = this.counterSkills;
            }

            if (this.affinitiesLimit.length) {
                options.affinitiesLimit = this.affinitiesLimit;
            }

            if (this.friendsLeaders.length) {
                options.friendsLeaders = [];
                for (var i = this.friendsLeaders.length - 1; i >= 0; --i) {
                    options.friendsLeaders.push(this.allHeroes.find(this.friendsLeaders[i]));
                }
            }

            this.bestDecks = {};
            this.deckWorker.postMessage({
                heroes: this.teamHeroes.getHeroes(),
                options: options
            });
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
