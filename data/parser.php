<?php
/**
 * @param $filename
 * @param $delimiter
 *
 * @return array|bool
 */
function csvToArray($filename = '', $delimiter = ',')
{
    if (!file_exists($filename) || !is_readable($filename)) {
        die('Cannot read the file!');
    }

    $header = null;
    $data = array();
    if (($handle = fopen($filename, 'r')) !== false) {
        while (($row = fgetcsv($handle, 1000, $delimiter)) !== false) {
            if (!$header) {
                $header = $row;
            } elseif (count($header) != count($row)) {
                var_dump('Mismatched columns!', $header, $row);
                die();
            } else {
                $data[] = array_combine($header, $row);
            }
        }
        fclose($handle);
    }

    $dbData = [];

    foreach ($data as $index => $row) {
        $rarity = strlen($row['stars']);
        $affinity = ucfirst($row['affinity']);
        $name = $row['name'];
        $liderAbility = $row['leader ability'];

        list(
            $leaderAbilityName,
            $leaderAbilityDescription,
            $leaderAbilityValues,
            $leaderAbilityTarget
            ) = extractLiderAbility($liderAbility, $name);

        $dbData[] = [
            'id' => $index + 1,
            'name' => $name,
            'affinity' => $affinity,
            'type' => $row['class'],
            'species' => $row['race'],
            'attack' => (int)$row['attack'],
            'recovery' => (int)$row['recovery'],
            'health' => (int)$row['health'],
            'rarity' => $rarity,
            'eventSkills' => array_merge(
                !empty($row['slayer']) && preg_match('/^(\d)x$/', $row['slayer'], $sMatches)
                    ? ['Slayer' => (int)$sMatches[1]] : [],
                !empty($row['bounty hunter']) && preg_match('/^(\d)x$/', $row['bounty hunter'], $bhMatches)
                    ? ['Bounty Hunter' => (int)$bhMatches[1]] : [],
                !empty($row['commander']) && preg_match('/^(\d)x$/', $row['commander'], $cMatches)
                    ? ['Commander' => (int)$cMatches[1]] : []
            ),
            'defenderSkill' => $row['defender skill'],
            'counterSkill' => $row['counter skill'],
            'leaderAbility' => [
                'name' => $leaderAbilityName,
                'description' => $leaderAbilityDescription,
                'values' => $leaderAbilityValues,
                'target' => $leaderAbilityTarget,
            ],
            'evolveFrom' => '',
            'evolveTo' => '',
        ];
    }

    return $dbData;
}

/**
 * @param string $stats
 * @return string
 */
function convertStats($stats)
{
    return str_replace(
        ['Damage', 'ATK', 'REC', 'HP'],
        ['attack', 'attack', 'recovery', 'health'],
        $stats
    );
}

/**
 * @param $liderAbilityData
 * @param $heroName
 * @return array
 */
function extractLiderAbility($liderAbilityData, $heroName)
{
    $leaderAbilityMatches = [];
    $leaderAbilityValues = [];
    if (preg_match(
        '/^([^:]+): ((\d+)% ((Damage|HP|REC)( and (Damage|HP|REC))?) for (all )?((\w+( \w+)?) Heroes))$/',
        $liderAbilityData,
        $leaderAbilityMatches
    )) {
        $leaderAbilityTarget = rtrim($leaderAbilityMatches[10], 's');
        $leaderAbilityTarget = strpos($leaderAbilityTarget, ' ') !== false
            ? explode(' ', $leaderAbilityTarget)
            : $leaderAbilityTarget;

        foreach (explode(' and ', convertStats($leaderAbilityMatches[4])) as $stat) {
            $leaderAbilityValues[$stat] = $leaderAbilityMatches[3] / 100;
        }
    } elseif (preg_match(
        '/^([^:]+): ((\d+)% ((Damage|HP|REC)( and (Damage|HP|REC))?) for (all )?((\w+( \w+)?) Bounty Hunters))$/',
        $liderAbilityData,
        $leaderAbilityMatches
    )) {
        $leaderAbilityTarget = rtrim($leaderAbilityMatches[10], 's');
        $leaderAbilityTarget = explode(' ', $leaderAbilityTarget);
        $leaderAbilityTarget[] = 'Bounty Hunter';

        foreach (explode(' and ', convertStats($leaderAbilityMatches[4])) as $stat) {
            $leaderAbilityValues[$stat] = $leaderAbilityMatches[3] / 100;
        }
    } elseif (preg_match(
        '/^([^:]+): ((\d+)% (ATK|HP|REC), (\d+)% (ATK|HP|REC) and (ATK|HP|REC) for (\w+( \w+)?) Heroes)$/',
        $liderAbilityData,
        $leaderAbilityMatches
    )
    ) {
        $leaderAbilityTarget = rtrim($leaderAbilityMatches[8], 's');
        $leaderAbilityTarget = strpos($leaderAbilityTarget, ' ') !== false
            ? explode(' ', $leaderAbilityTarget)
            : $leaderAbilityTarget;

        $leaderAbilityValues[convertStats($leaderAbilityMatches[4])] = $leaderAbilityMatches[3] / 100;
        $leaderAbilityValues[convertStats($leaderAbilityMatches[6])] = $leaderAbilityMatches[5] / 100;
        $leaderAbilityValues[convertStats($leaderAbilityMatches[7])] = $leaderAbilityMatches[5] / 100;
    } else {
        var_dump(
            'Invalid leader ability format for '.$heroName.' ('.$liderAbilityData.')',
            $leaderAbilityMatches
        );
        die();
    }

    return array($leaderAbilityMatches[1], $leaderAbilityMatches[2], $leaderAbilityValues, $leaderAbilityTarget);
}

echo json_encode(csvToArray('heroes_all.tsv', "\t"), JSON_PRETTY_PRINT);
