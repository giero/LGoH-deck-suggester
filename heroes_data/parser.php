<?php
/**
 * @link http://gist.github.com/385876
 */
function csv_to_array($filename = '', $delimiter = ',')
{
    if (!file_exists($filename) || !is_readable($filename)) {
        return false;
    }

    $header = null;
    $data = array();
    if (($handle = fopen($filename, 'r')) !== false) {
        while (($row = fgetcsv($handle, 1000, $delimiter)) !== false) {
            if (!$header) {
                $header = $row;
            } else {
                if (count($header) != count($row)) {
                    var_dump($header, $row);die();
                }
                $data[] = array_combine($header, $row);
            }
        }
        fclose($handle);
    }

    $dbData = [];


    foreach ($data as $row) {
        $dbData[] = [
            'name' => $row['name'],
            'affinity' => ucfirst($row['affinity']),
            'type' => $row['class'],
            'species' => $row['race'],
            'attack' => '',
            'recovery' => '',
            'health' => '',
            'rarity' => strlen($row['stars']),
            'defenderSkill' => $row['defender skill'],
            'counterSkill' => $row['counter skill'],
            'leaderAbility' => $row['leader ability'],
            'combatAbility' => $row['combat ability'],
            'evolveFrom' => '',
            'evolveTo' => '',
        ];
    }

    return $dbData;
}

echo json_encode(csv_to_array('heroes_all.tsv', "\t"));