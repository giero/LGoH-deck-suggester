function Skills() {
    this.defenderSkills = {};
    this.counterSkill = {};
}

Skills.prototype.getAsInfoHTML = function (skill) {
    var description;
    switch (true) {
        case this.defenderSkills.hasOwnProperty(skill):
            description = this.defenderSkills[skill];
            break;
        case this.counterSkill.hasOwnProperty(skill):
            description = this.counterSkill[skill];
            break;
        default:
            description = '';
            break;
    }

    return "<span class='glyphicon glyphicon-info-sign text-info pull-right' " +
        "data-toggle='popover' " +
        "data-trigger='hover' " +
        "data-placement='top' " +
        "data-container='body' " +
        "data-content='" + description + "'></span>";
};
