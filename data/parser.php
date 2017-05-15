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
    $legendMap = [
        2 => 2,
        3 => 2,
        4 => 2,
        5 => 3,
        6 => 4,
    ];

    foreach ($data as $index => $row) {
        $rarity = strlen($row['stars']);
        $affinity = ucfirst($row['affinity']);

        if (!preg_match('/^([^:]+): ((\d+)% ((\w+)( and (\w+))?) for (all )?((\w+( \w+)?) Heroes|\w+ Bounty Hunters))$/',
            $row['leader ability'],
            $leaderAbilityMatches)
        ) {
            var_dump(
                'Invalid leader ability format for '.$row['name'].' ('.$row['leader ability'].')',
                $leaderAbilityMatches
            );
            die();
        }

        if (isset($leaderAbilityMatches[10])) {
            $leaderAbilityTarget = rtrim($leaderAbilityMatches[10], 's');
            $leaderAbilityTarget = strpos($leaderAbilityTarget, ' ') !== false
                ? explode(' ', $leaderAbilityTarget)
                : $leaderAbilityTarget;
        } else {
            $leaderAbilityTarget = rtrim($leaderAbilityMatches[9], 's');
            $leaderAbilityTarget = strpos($leaderAbilityTarget, ' ') !== false
                ? explode(' ', $leaderAbilityTarget, 2)
                : $leaderAbilityTarget;
        }

        $dbData[] = [
            'id' => $index + 1,
            'name' => $row['name'],
            'affinity' => $affinity,
            'type' => $row['class'],
            'species' => $row['race'],
            'attack' => (int)$row['attack'],
            'recovery' => (int)$row['recovery'],
            'health' => (int)$row['health'],
            'rarity' => $rarity,
            'eventSkills' => $row['race'] == 'Legend' && $rarity >= 2
                ? [
                    'Slayer' => "{$legendMap[$rarity]}x",
                    'Bounty Hunter' => "{$legendMap[$rarity]}x",
                    'Commander' => "{$affinity} {$legendMap[$rarity]}x",
                ]
                : [],
            'defenderSkill' => $row['defender skill'],
            'counterSkill' => $row['counter skill'],
            'leaderAbility' => [
                'fullName' => $row['leader ability'],
                'name' => $leaderAbilityMatches[1],
                'description' => $leaderAbilityMatches[2],
                'value' => (int)$leaderAbilityMatches[3],
                'stats' => explode(
                    ' and ',
                    str_replace(
                        ['Damage', 'REC', 'HP'],
                        ['attack', 'recovery', 'health'],
                        $leaderAbilityMatches[4]
                    )
                ),
                'target' => $leaderAbilityTarget
            ],
            'evolveFrom' => '',
            'evolveTo' => '',
        ];
    }

    return $dbData;
}

echo json_encode(csvToArray('heroes_all.tsv', "\t"), JSON_PRETTY_PRINT);
