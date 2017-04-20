var team = new Team();

$.getJSON("data/heroes_all.json", function(json) {
    json.forEach(function (heroStat) {
        team.addHero(heroStat);
    });
});

Vue.component('hero-list', {
    template: '#hero-list',
    props: ['affinity'],
    data: function () {
        return { team: team, searchKey: ''};
    },
    computed : {
        filteredHeroes: function () {
            var self = this;
            return self.team.getHeroes({'affinity': this.affinity}).filter(function (hero) {
                return hero.name.toLowerCase().indexOf(self.searchKey.toLowerCase()) !== -1;
            });
        }
    }
});

new Vue({
    el: '#heroes'
});

$('#page-nav a, #team-nav a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
});