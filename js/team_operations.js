var teamOperations = {
    getSavedTeams: function () {
        var savedTeams = [];
        for (var key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                var teamName = key.match(/^team::(.+)$/);
                if (teamName !== null) {
                    savedTeams.push(teamName[1]);
                }
            }
        }

        if (!savedTeams.length) {
            return [];
        }

        var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
        savedTeams.sort(collator.compare);
        savedTeams = savedTeams.map(function (name) {
            return {text: name, value: name};
        });

        return savedTeams;
    },
    import: function () {
        bootbox
            .prompt({
                title: "Paste previous exported string with your team configuration.",
                inputType: 'textarea',
                callback: function (config) {
                    if (config === null) {
                        return;
                    }

                    var importedTeam = LZString.decompressFromEncodedURIComponent(config);
                    if (!teamHeroes.loadFromString(importedTeam)) {
                        bootbox.alert({
                            message: 'Invalid input string :('
                        });
                    } else {
                        teamHeroes.save();
                    }
                }
            })
            .init(function () {
                var $textarea = $('.modal').find('textarea.bootbox-input-textarea');
                $textarea.css('height', '300px');
            });
    },
    export: function () {
        bootbox
            .alert({
                title: "Copy this string to a text file, to save your team configuration.",
                message: "<textarea class='bootbox-input bootbox-input-textarea form-control'></textarea>"
            })
            .init(function () {

                var $textarea = $('.modal').find('textarea.bootbox-input-textarea');
                $textarea.css('height', '300px');
                $textarea.val(LZString.compressToEncodedURIComponent(localStorage.getItem('heroes::user')));
                setTimeout(function () {
                    $textarea.select();
                }, 1000);
            });
    },
    save: function () {
        bootbox.prompt({
            title: "Save your current team under specified name.",
            callback: function (name) {
                if (name === null) {
                    return;
                }

                localStorage.setItem('team::' + name, teamHeroes.serialize());
            }
        });
    },
    load: function () {
        var savedTeams = this.getSavedTeams();

        if (!savedTeams.length) {
            bootbox.alert({
                message: "You don't have any saved teams."
            });
        } else {
            bootbox
                .prompt({
                    title: "Select team to load.<br />" +
                    "<small class='text-danger'><strong>Warning!</strong> Current team will be replaced by loaded team!</small>",
                    inputType: 'select',
                    inputOptions: savedTeams,
                    callback: function (name) {
                        if (name === null) {
                            return;
                        }

                        localStorage.setItem('heroes::user', localStorage.getItem('team::' + name));
                        teamHeroes.load();
                    }
                })
                .init(function () {
                    $('.modal').find('select.bootbox-input-select').selectpicker();
                });
        }
    },
    delete: function () {
        var savedTeams = this.getSavedTeams();

        if (!savedTeams.length) {
            bootbox.alert({
                message: "You don't have any saved teams."
            });
        } else {
            bootbox
                .prompt({
                    title: "Selected teams will be removed from your browser.<br />" +
                    "<small class='text-danger'><strong>Warning!</strong> This action cannot be undone!</small>",
                    inputType: 'checkbox',
                    inputOptions: savedTeams,
                    callback: function (names) {
                        if (names === null) {
                            return;
                        }

                        names.forEach(function (name) {
                            localStorage.removeItem('team::' + name);
                        });
                    }
                });
        }
    }
};
