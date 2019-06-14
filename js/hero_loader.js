function HeroLoader() {
    this.url = 'https://docs.google.com/spreadsheets/d/1fAMeBL5d2XfhqOo1QTJjknlfXvoFd91oLsbGiZ5VKnE/pub?gid=160864184&single=true&output=tsv';
}

HeroLoader.prototype.load = function (callback) {
    var self = this;

    $.get(this.url, function (data) {
        var lines = data.split("\n");
        // var headers = lines[0].split("\t");
        var result = [];

        for (var i = 1; i < lines.length; i++) {
            var currentLine = lines[i].split("\t");
            var obj;

            try {
                obj = self.parse(currentLine);
            } catch (e) {
                callback && callback(e.message);
                return;
            }

            result.push(obj);

        }

        callback && callback(result);
    });
};

HeroLoader.prototype.validateRow = function (heroData) {
    if (!(/^\*{1,6}$/.test(heroData[2]))) {
        throw new Error('Invalid value or number of stars for ' + heroData[1]);
    }

    var errorMessage = function (stat, statValue) {
        return 'Invalid ' + stat + ' (' + statValue + ' (?))'
    };

    if (['fire', 'earth', 'water', 'light', 'dark'].indexOf(heroData[0]) < 0) {
        throw new Error(errorMessage('affinity', heroData[0]));
    }

    if (heroData[3] === 'Attackers') {
        console.log(heroData);
    }
    if (['Attacker', 'Balanced', 'Defender', 'Guardian', 'Healer', 'Mage', 'Warrior', 'Seer'].indexOf(heroData[3]) < 0) {
        throw new Error(errorMessage('class', heroData[3]));
    }

    var races = ['Celestial', 'Corrupt', 'Creature', 'Demigod', 'Dragon', 'Dren', 'Dwarf', 'Fable', 'Giant', 'God', 'Human', 'Legend', 'Spirit', 'Honored', 'Ancient', 'Technological', 'Goblin', 'Mystic', 'Special', 'Elf'];
    if (heroData[4].indexOf(' ') > 0) {
        var validRace = heroData[4].split(' ').every(function (race) {
            return races.indexOf(race) >= 0;
        });

        if (!validRace) {
            throw new Error(errorMessage('race', heroData[4]));
        }
    } else if (races.indexOf(heroData[4]) < 0) {
        throw new Error(errorMessage('race', heroData[4]));
    }

    if (!skills.defenderSkills.hasOwnProperty(heroData[9])) {
        throw new Error(errorMessage('defender skill', heroData[9]));
    }

    if (!skills.counterSkill.hasOwnProperty(heroData[10])) {
        throw new Error(errorMessage('counter skill', heroData[10]));
    }
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
        var countableSkills = {11: 'Slayer', 12: 'Bounty Hunter', 13: 'Commander'};
        var skillValue;


        for (var id in countableSkills) {
            if (row[id].length) {
                matches = lvlRegex.exec(row[id]);
                if (matches === null) {
                    throw new Error('Invalid ' + countableSkills[id] + ' value for ' + row[1] + ". Should be '2x', '3x', '4x' or '5x' (current event cards will lose their high multiplier eventually).");
                }
                skillValue = parseInt(matches[1]);

                if (skillValue < 2 || skillValue > 5) {
                    throw new Error('Invalid ' + countableSkills[id] + ' value for ' + row[1] + ". Should be '2x', '3x', '4x' or '5x' (current event cards will lose their high multiplier eventually).");
                }

                eventSkills[countableSkills[id]] = skillValue;
            }
        }

        if (row[14].length) {
            if (row[14] !== 'yes') {
                throw new Error('Invalid Warden value for ' + row[1] + ". Only allowed value is 'yes'.");
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
        } else if (leaderAbilityMatches = /^([^:]+): ((\d+)% ((Damage|HP|REC)( and (Damage|HP|REC))?) for (all )?((\w+( \w+)?) Heroes in GvG attacks))$/.exec(leaderAbilityDescription)) {
            // maybe someday
            leaderAbilityTarget = '';

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
        } else if (leaderAbilityMatches = /^([^:]+): ((\d+)% (Damage|HP|RCV|REC), (Damage|HP|RCV|REC) and (Damage|HP|RCV|REC) for (all )?(\w+( \w+)?) Heroes)$/.exec(leaderAbilityDescription)) {
            leaderAbilityTarget = leaderAbilityMatches[8].replace(/s$/, '');
            leaderAbilityTarget = leaderAbilityTarget.indexOf(' ') >= 0
                ? leaderAbilityTarget.split(' ')
                : leaderAbilityTarget;

            leaderAbilityValues[convertStats(leaderAbilityMatches[4])] = leaderAbilityMatches[3] / 100;
            leaderAbilityValues[convertStats(leaderAbilityMatches[5])] = leaderAbilityMatches[3] / 100;
            leaderAbilityValues[convertStats(leaderAbilityMatches[6])] = leaderAbilityMatches[3] / 100;
        } else {
            throw new Error('Invalid leader ability format "' + leaderAbilityDescription + '"');
        }

        return {
            'name': leaderAbilityMatches[1],
            'description': leaderAbilityMatches[2],
            'modifiers': leaderAbilityValues,
            'target': leaderAbilityTarget
        };
    }

    try {
        this.validateRow(heroData);
        return {
            coreId: generateId(heroData[1], heroData[2]),
            name: heroData[1],
            affinity: ucFirst(heroData[0]),
            type: heroData[3],
            species: heroData[4],
            attack: /^\d+$/.test(heroData[5]) ? parseInt(heroData[5]) : 0,
            recovery: /^\d+$/.test(heroData[6]) ? parseInt(heroData[6]) : 0,
            health: /^\d+$/.test(heroData[7]) ? parseInt(heroData[7]) : 0,
            rarity: heroData[2].length,
            awakening: 5,
            eventSkills: extractEventSkills(heroData),
            defenderSkill: heroData[9],
            counterSkill: heroData[10],
            leaderAbility: extractLeaderAbility(heroData[8]),
            evolveFrom: heroData[16].length ? generateId(heroData[16]) : '',
            evolveInto: heroData[17].length ? generateId(heroData[17]) : ''
        };
    } catch (e) {
        throw new Error('[' + heroData[0] + '] ' + heroData[1] + ' ' + heroData[2] + '<br /><br />' + e.message);
    }
};
