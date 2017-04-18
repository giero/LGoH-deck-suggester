$(function () {
    var affinityTeamCounter = {};

    $('#page-nav a, #team-nav a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    $('#add-to-team').on('click', function (e) {
        e.preventDefault();

        var selectedOption = $('#team-hero-name :selected'),
            attack = $('#team-hero-attack').val(),
            recovery = $('#team-hero-recovery').val(),
            health = $('#team-hero-health').val(),

            heroName = selectedOption.val(),
            heroAffinity = selectedOption.parent().attr('label').toLowerCase();

        affinityTeamCounter.hasOwnProperty(heroAffinity)
            ? affinityTeamCounter[heroAffinity]++
            : affinityTeamCounter[heroAffinity] = 1;

        $('#team-' + heroAffinity + '-affinity').find('tbody').append(
            '<tr><td>' + affinityTeamCounter[heroAffinity] + '</td><td>'+heroName+'</td><td>'+attack+'</td><td>'+recovery+'</td><td>'+health+'</td><td><span class="glyphicon glyphicon-remove text-danger" aria-hidden="true"></span></td></tr>'
        );
    });

    $('#clear-team-form').on('click', function (e) {
        e.preventDefault();
        $('#team-adding')[0].reset();

        $('#team-hero-name').val([]);
        $('#team-hero-name').trigger('change.abs.preserveSelected');
        $('#team-hero-name').selectpicker('refresh');
    });
});