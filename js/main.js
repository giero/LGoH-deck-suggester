var database = new Database();

var teamHeroes = new Team('user', localStorage);
var allHeroes = new Team('all', sessionStorage);

teamHeroes.load();
database
    .init()
    .loadHeroes(allHeroes, function () {
        // overwrite some saved hero stats if sth was changed in db
        teamHeroes.heroes.forEach(function (hero) {
            var mainHero = allHeroes.find(hero.coreId);
            $.extend(hero, {
                affinity: mainHero.affinity,
                type: mainHero.type,
                species: mainHero.species,

                defenderSkill: mainHero.defenderSkill,
                counterSkill: mainHero.counterSkill,
                leaderAbility: mainHero.leaderAbility
            });
        });
    });

var skills = new Skills();
$.getJSON("data/skills_all.json", function (json) {
    skills.defenderSkills = json.defenderSkill;
    skills.counterSkill = json.counterSkill;
});

function getHeroesTableComponent(team, options) {
    return {
        template: '#heroes-table',
        props: ['affinity'],
        data: function () {
            return $.extend({
                skills: skills,
                team: team,
                searchKey: '',
                sort: ''
            }, options);
        },
        computed: {
            filteredHeroes: function () {
                var self = this;
                return self.team
                    .getHeroes(
                        !!this.affinity ? {'affinity': this.affinity} : {},
                        this.sort
                    )
                    .filter(function (hero) {
                        return hero.name.toLowerCase().indexOf(self.searchKey.toLowerCase()) !== -1;
                    });
            }
        },
        methods: {
            removeHeroFromList: function (e) {
                if (team.removeHero(parseInt($(e.target).parents('tr').attr('data-hero-id')))) {
                    team.save()
                }
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
        'heroes-table': getHeroesTableComponent(teamHeroes, {editable: true, listId: 'team-heroes-list', sort: 'power'})
    },
    computed: {
        counter: function () {
            var affinityHeroes = teamHeroes.getHeroesByAffinity();
            return {
                Fire: affinityHeroes['Fire'].length,
                Water: affinityHeroes['Water'].length,
                Earth: affinityHeroes['Earth'].length,
                Light: affinityHeroes['Light'].length,
                Dark: affinityHeroes['Dark'].length,
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
        'heroes-table': getHeroesTableComponent(allHeroes, {editable: false, listId: 'all-heroes-list'})
    },
    computed: {
        counter: function () {
            var affinityHeroes = allHeroes.getHeroesByAffinity();
            return {
                Fire: affinityHeroes['Fire'].length,
                Water: affinityHeroes['Water'].length,
                Earth: affinityHeroes['Earth'].length,
                Light: affinityHeroes['Light'].length,
                Dark: affinityHeroes['Dark'].length,
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
        affinityHeroes: function () {
            return allHeroes.getHeroesByAffinity();
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
                formParams = {
                    eventSkills: {}
                };

            $.each($form.serializeArray(), function (_, formField) {
                if (formField.value === '') {
                    return;
                }

                var eventSkill = formField.name.match(/^eventSkills\[([A-Za-z ]+)\]$/);
                if (eventSkill !== null) {
                    formParams.eventSkills[eventSkill[1]] = parseInt(formField.value);
                } else if (formField.name === 'coreId') {
                    formParams[formField.name] = formField.value;
                } else {
                    formParams[formField.name] = parseInt(formField.value);
                }
            });

            var nextId = teamHeroes.heroes.length
                ? teamHeroes.heroes[teamHeroes.heroes.length - 1].id + 1
                : 1;
            var coreHero = allHeroes.find(formParams.coreId);
            coreHero.awakening = 0; //default core hero awakening level is 5

            if (coreHero.eventSkills.hasOwnProperty('Warden')) {
                formParams.eventSkills.Warden = true;
            }

            teamHeroes.addHero(
                $.extend({}, coreHero, formParams, {id: nextId})
            );
            teamHeroes.save();

            $form.get(0).reset();
            this.refreshSelect();
        },
        clearTeam: function (e) {
            e.preventDefault();

            bootbox.confirm(
                "Are you sure you want to clear your heroes?",
                function (confirmed) {
                    if (confirmed) {
                        teamHeroes.heroes = [];
                        teamHeroes.save();
                    }
                });
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
                $('#team-hero-' + eventSkillsMap[skill])
                    .val(hero.eventSkills.hasOwnProperty(skill) ? hero.eventSkills[skill] : '')
                    .selectpicker('refresh');
            }

            $('#team-hero-attack').select();
        })
    }
});

Vue.component('computed-decks', {
    template: '#computed-decks',
    data: function () {
        return {
            teamHeroes: teamHeroes,
            bestDecks: {},
            progress: -1,
            worker: undefined,

            maxStats: false,
            maxRarity: false,
            maxAwakening: false,

            event: '',
            counterSkills: [],
            affinitiesLimit: [],
            affinityOptions: ['Fire', 'Water', 'Earth', 'Light', 'Dark', 'No affinity bonus'],

            calculationStarted: null,
            calculationStopped: null
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

                    self.calculationStopped = new Date();

                    ga('send', 'timing', 'calculations', 'perform', self.calculationStopped - self.calculationStarted);

                    if (typeof(Storage) !== "undefined") {
                        localStorage.setItem('calculated::data', JSON.stringify(data));
                    }

                    self.cleanupWorker();
                }
            };

            return this.worker;
        },
        counterSkillsOptions: function () {
            return this.teamHeroes.getUniqueHeroesProperties('counterSkill', ['None', 'Unknown']);
        }
    },
    methods: {
        calculateDecks: function (e) {
            $('#calculate-decks').hide();
            $('#stop-calculations').show();

            this.bestDecks = {};

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

            var heroes = this.teamHeroes.getHeroes();
            if (this.maxStats) {
                for (var i = heroes.length - 1; i >= 0; --i) {
                    var hero = new Hero(heroes[i]);

                    if (this.maxRarity) {
                        while (hero.evolveInto) {
                            hero = new Hero(allHeroes.find(hero.evolveInto));
                            hero.awakening = 0;
                        }
                    }

                    var coreHero = allHeroes.find(hero.coreId);
                    var coreHeroStats = {
                        attack: coreHero.attack >> 1,
                        recovery: coreHero.recovery >> 1,
                        health: coreHero.health >> 1
                    };

                    if (coreHeroStats.attack === 0 || coreHeroStats.recovery === 0 || coreHeroStats.health === 0) {
                        // not all stats are filled in spreadsheet :(
                        // maybe i'll make some notice for users or sth...
                        var errorMessage = 'No max stats for ' + coreHero.name + ' (' + coreHero.rarity + '*)';
                        ga('send', 'exception', {
                            'exDescription': errorMessage,
                            'exFatal': false
                        });
                        continue;
                    }

                    if (this.maxAwakening) {
                        hero.awakening = 5;
                    }

                    var awakenModifier = hero.awakening !== 0 ? 1 + 0.2 * hero.awakening : 1;
                    hero.attack = Math.round(coreHeroStats.attack * awakenModifier);
                    hero.recovery = Math.round(coreHeroStats.recovery * awakenModifier);
                    hero.health = Math.round(coreHeroStats.health * awakenModifier);

                    heroes[i] = hero;
                }
            }

            ga('send', 'event', 'calculations', 'perform', 'cards', teamHeroes.heroes.length);
            this.calculationStarted = new Date();
            this.calculationStopped = null;

            this.deckWorker.postMessage({
                heroes: heroes,
                options: options
            });
        },
        stopCalculations: function () {
            this.calculationStopped = new Date();
            ga('send', 'timing', 'calculations', 'interrupt', this.calculationStopped - this.calculationStarted);

            this.cleanupWorker();
        },
        cleanupWorker: function () {
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

        $('#page-nav > li > a:not(.dropdown-toggle)').click(function (e) {
            e.preventDefault();
            ga('send', {
                hitType: 'pageview',
                title: $(this).text()
            });
        });

        $('#heroes > p.bg-danger > strong > a, #contact a').click(function () {
            ga('send', 'link', 'click', $(this).attr('href'));
        });

        if (typeof(Storage) !== "undefined" && localStorage.hasOwnProperty('calculated::data')) {
            this.bestDecks = JSON.parse(localStorage.getItem('calculated::data'))
        }

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
    methods: {
        updateHeroesPool: function () {
            var dialog = bootbox.dialog({
                title: 'Updating heroes database ...',
                message: '<p><i class="fa fa-spin fa-spinner"></i>... updating ...</p>'
            });

            dialog.init(function () {
                (new HeroLoader()).load(function (heroesData) {
                    if (!Array.isArray(heroesData)) {
                        dialog.find('.bootbox-body').html("... and it's  failed for <strong>" + heroesData + '</strong>');

                        ga('send', 'event', 'db', 'failed');
                    } else {
                        database.save(heroesData, function () {
                            database.loadHeroes(allHeroes);
                            dialog.find('.bootbox-body').html("... and it's done :)");

                            ga('send', 'event', 'db', 'updated');
                        });
                    }
                });
            });
        }
    },
    mounted: function () {
        $('#team-heroes-list-content').editable({
            selector: '.hero-editable-stat',
            highlight: false,
            display: false,
            success: function (response, newValue) {
                var $this = $(this);
                var heroId = $this.parents('tr').data('hero-id');
                var hero = teamHeroes.find(heroId);

                if (hero === null) {
                    return;
                }

                var stat = $this.data('stat');

                hero[stat] = parseInt(newValue);

                ga('send', 'event', 'card', 'edit');

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

                    ga('send', 'event', 'action', action);
                    break;
                default:
                    throw new Error("Unknown/unhandled action '" + action + "'")
            }
        });

        $('body')
            .tooltip({
                selector: '[data-toggle="tooltip"]',
                trigger: 'hover'
            })
            .popover({
                selector: '[data-toggle="popover"]',
                trigger: 'hover | click'
            });
    }
});
