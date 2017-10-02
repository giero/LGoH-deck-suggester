function HeroLoader() {
    this.url = 'https://docs.google.com/spreadsheets/d/1fAMeBL5d2XfhqOo1QTJjknlfXvoFd91oLsbGiZ5VKnE/pub?gid=160864184&single=true&output=tsv';
}

HeroLoader.prototype.load = function (callback) {
    var self = this;

    $.get(this.url, function (data) {
        var lines = data.split("\n");
        var headers = lines[0].split("\t");
        var result = [];

        for (var i = 1; i < lines.length; i++) {

            var currentLine = lines[i].split("\t");

            for (var j = 0; j < headers.length; j++) {
                var obj = self.parse(currentLine);
            }

            result.push(obj);

        }

        callback && callback(result);
    });
};

HeroLoader.prototype.parse = function (heroData) {
    function generateId(name, stars) {
        var idLen = 8;

        if (stars) {
            return md5(name + ' ' + stars).substr(0, idLen);
        } else {
            return md5(name).substr(0, idLen);
        }
    }

    function ucFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function extractEventSkills(row) {
        var eventSkills = {};
        var lvlRegex = /^(\d)x$/;
        var matches;
        var countableSkills = {12: 'Slayer', 13: 'Bounty Hunter', 14: 'Commander'};
        var skillValue;


        for (var id in countableSkills) {
            if (row[id].length) {
                matches = lvlRegex.exec(row[id]);
                if (matches === null) {
                    throw new Error('Invalid ' + countableSkills[id] + ' value for ' + row[1] + ". Should be '2x', '3x' or '4x'");
                }
                skillValue = parseInt(matches[1]);

                if (skillValue < 2 || skillValue > 4) {
                    throw new Error('Invalid ' + countableSkills[id] + ' value for ' + row[1] + ". Should be '2x', '3x' or '4x'");
                }

                eventSkills['Slayer'] = skillValue;
            }
        }

        if (row[15].length) {
            if (row[15] !== 'yes') {
                throw new Error('Invalid Warden value for ' + row[1] + ". Only allowed value is 'yes'");
            }

            eventSkills['Warden'] = true;
        }

        return eventSkills;
    }

    function convertStats(stats) {
        var statMap = {
            'Damage': 'attack',
            'ATK': 'attack',
            'REC': 'recovery',
            'RCV': 'recovery',
            'HP': 'health'
        };

        var re = new RegExp(Object.keys(statMap).join("|"), "gi");
        return stats.replace(re, function (matched) {
            return statMap[matched];
        });
    }

    function extractLeaderAbility(leaderAbilityDescription) {
        var leaderAbilityMatches;
        var leaderAbilityValues = {};
        var leaderAbilityTarget;


        if (leaderAbilityMatches = /^([^:]+): ((\d+)% ((Damage|HP|REC)( and (Damage|HP|REC))?) for (all )?((\w+( \w+)?) Heroes))$/.exec(leaderAbilityDescription)) {
            leaderAbilityTarget = leaderAbilityMatches[10].replace(/s$/, '');
            leaderAbilityTarget = leaderAbilityTarget.indexOf(' ') >= 0
                ? leaderAbilityTarget.split(' ')
                : leaderAbilityTarget;

            convertStats(leaderAbilityMatches[4]).split(' and ').forEach(function (stat) {
                leaderAbilityValues[stat] = parseFloat(leaderAbilityMatches[3]) / 100;
            });
        } else if (leaderAbilityMatches = /^([^:]+): ((\d+)% ((Damage|HP|REC)( and (Damage|HP|REC))?) for (all )?((\w+( \w+)?) Bounty Hunters))$/.exec(leaderAbilityDescription)) {
            leaderAbilityTarget = leaderAbilityMatches[10].replace(/s$/, '');
            leaderAbilityTarget = leaderAbilityTarget.split(' ');
            leaderAbilityTarget.push('Bounty Hunter');

            convertStats(leaderAbilityMatches[4]).split(' and ').forEach(function (stat) {
                leaderAbilityValues[stat] = parseFloat(leaderAbilityMatches[3]) / 100;
            });
        } else if (leaderAbilityMatches = /^([^:]+): ((\d+)% (ATK|HP|REC), (\d+)% (ATK|HP|REC) and (ATK|HP|REC) for (\w+( \w+)?) Heroes)$/.exec(leaderAbilityDescription)) {
            leaderAbilityTarget = leaderAbilityMatches[8].replace(/s$/, '');
            leaderAbilityTarget = leaderAbilityTarget.indexOf(' ') >= 0
                ? leaderAbilityTarget.split(' ')
                : leaderAbilityTarget;

            leaderAbilityValues[convertStats(leaderAbilityMatches[4])] = parseFloat(leaderAbilityMatches[3]) / 100;
            leaderAbilityValues[convertStats(leaderAbilityMatches[6])] = parseFloat(leaderAbilityMatches[5]) / 100;
            leaderAbilityValues[convertStats(leaderAbilityMatches[7])] = parseFloat(leaderAbilityMatches[5]) / 100;
        } else if (leaderAbilityMatches = /^([^:]+): ((\d+)% (Damage|HP|RCV|REC), (Damage|HP|RCV|REC) and (Damage|HP|RCV|REC) for (\w+( \w+)?) Heroes)$/.exec(leaderAbilityDescription)) {
            leaderAbilityTarget = leaderAbilityMatches[8].replace(/s$/, '');
            leaderAbilityTarget = leaderAbilityTarget.indexOf(' ') >= 0
                ? leaderAbilityTarget.split(' ')
                : leaderAbilityTarget;

            leaderAbilityValues[convertStats(leaderAbilityMatches[4])] = leaderAbilityMatches[3] / 100;
            leaderAbilityValues[convertStats(leaderAbilityMatches[5])] = leaderAbilityMatches[3] / 100;
            leaderAbilityValues[convertStats(leaderAbilityMatches[6])] = leaderAbilityMatches[3] / 100;
        } else {
            throw new Error('Invalid leader ability format for "' + leaderAbilityDescription + '"');
        }

        return {
            'name': leaderAbilityMatches[1],
            'description': leaderAbilityMatches[2],
            'modifiers': leaderAbilityValues,
            'target': leaderAbilityTarget
        };
    }

    (function checkFields(row) {
        if (!(/^\*{1,6}$/.test(row[2]))) {
            throw new Error('Invalid value or number of stars for ' + heroData[1]);
        }

        if (['fire', 'earth', 'water', 'light', 'dark'].indexOf(heroData[0]) < 0) {
            throw new Error('Invalid affinity for ' + heroData[1]);
        }
    })(heroData);

    return {
        coreId: generateId(heroData[1], heroData[2]),
        name: heroData[1],
        affinity: ucFirst(heroData[0]),
        type: heroData[4],
        species: heroData[5],
        attack: /^\d+$/.test(heroData[6]) ? parseInt(heroData[6]) : 0,
        recovery: /^\d+$/.test(heroData[7]) ? parseInt(heroData[7]) : 0,
        health: /^\d+$/.test(heroData[8]) ? parseInt(heroData[8]) : 0,
        rarity: heroData[2].length,
        awakening: 5,
        eventSkills: extractEventSkills(heroData),
        defenderSkill: heroData[10],
        counterSkill: heroData[11],
        leaderAbility: extractLeaderAbility(heroData[9]),
        evolveFrom: heroData[17].length ? generateId(heroData[17]) : '',
        evolveInto: heroData[18].length ? generateId(heroData[18]) : ''
    };
};
