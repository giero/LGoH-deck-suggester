$(function() {
    $('#page-nav a, #team-nav a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });
});