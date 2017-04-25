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
        4 => 2,
        5 => 3,
        6 => 4,
    ];

    foreach ($data as $index => $row) {
        $rarity = strlen($row['stars']);
        $affinity = ucfirst($row['affinity']);

        if (!preg_match('/([\w ]+): (\d+)% (\w+) for all (\w+( \w+)*) Heroes/',
            $row['leader ability'],
            $leaderAbilityMatches)
        ) {
            die('Invalid leader ability format for '.$row['name'].'('.$row['leader ability'].')');
        }

        $dbData[] = [
            'id' => $index + 1,
            'name' => $row['name'],
            'affinity' => $affinity,
            'type' => $row['class'],
            'species' => $row['race'],
            'attack' => '',
            'recovery' => '',
            'health' => '',
            'rarity' => $rarity,
            'eventSkills' => $row['race'] == 'Legend' && $rarity > 3
                ? [
                    $legendMap[$rarity].'x Slayer',
                    $legendMap[$rarity].'x Bounty Hunter',
                    $legendMap[$rarity].'x '.$affinity.' Commander',
                ]
                : [],
            'defenderSkill' => $row['defender skill'],
            'counterSkill' => $row['counter skill'],
            'leaderAbility' => [
                'fullName' => $row['leader ability'],
                'name' => $leaderAbilityMatches[1],
                'value' => $leaderAbilityMatches[2],
                'stat' => $leaderAbilityMatches[3],
                'target' => strpos(' ', $leaderAbilityMatches[4]) !== false
                    ? array_map(function ($target) {
                        return ucfirst($target);
                    }, explode(' ', $leaderAbilityMatches[4]))
                    : ucfirst($leaderAbilityMatches[4]),
            ],
            'evolveFrom' => '',
            'evolveTo' => '',
        ];
    }

    return $dbData;
}

echo json_encode(csvToArray('heroes_all.tsv', "\t"), JSON_PRETTY_PRINT);
