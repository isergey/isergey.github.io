(function () {
    'use strict';
    var candidatesByOik = {};
    var oikByUik = {};
    var votePlaces = {};
    function sortCandidates(row1, row2) {
        if (row1[3] !== 'Объединенные Демократы' && row2[3] === 'Объединенные Демократы') {
            return 1;
        }

        if (row1[3] === 'Объединенные Демократы' && row2[3] !== 'Объединенные Демократы') {
            return -1;
        }
        
        return 0;
    }
    $.get('/vote/candidate-oik.csv').then(function (data) {
        var res = Papa.parse(data, {
            delimiter: ';',
        });
        res.data.sort(sortCandidates).forEach(function (row) {
            var candidates = candidatesByOik[row[2]];
            if (candidates === undefined) {
                candidates = [];
                candidatesByOik[row[2]] = candidates;
            }
            candidates.push({
                fio: row[0],
                mo: row[1],
                oik: row[2],
                party: row[3],
            });
        });
        return $.get('/vote/oik-uik.csv');
    }).then(function (data) {
        var res = Papa.parse(data, {
            delimiter: ';',
        });
        // console.log('data', res.data.map(i => i).forEeach);
        res.data.filter(function (item) {
            return item[0] !== '';
        }).forEach(function (row) {
            row[2].split(',').forEach(function (uik) {
                oikByUik[uik] = {
                    oik: row[1],
                    mo: row[0],
                }
            });
        });
        return $.get('/vote/vote-places.csv');
    }).then(function (data) {
        var res = Papa.parse(data, {
            delimiter: ';',
        });
        res.data.forEach(function (row) {
           votePlaces[row[1]] = {
               mo: row[0],
               uik: row[1],
               address: row[2],
               place:row[3],
           };
        });
    }).catch(function (error) {
        console.error(error);
        drawError('При загрузке данных возникла ошибка');
    });

    var $districtSelect = $('#sv-app-district-select');
    $districtSelect.select2({
        placeholder: 'Выберите район',

    });

    var $streetSelect = $('#sv-app-street-select');
    $streetSelect.select2({
        placeholder: 'Выберите улицу',
        ajax: {
            url: 'https://okrug.od.spb.ru/addresses/search_address/',
            dataType: 'json',
            data: function (params) {
                var query = {
                    district: $districtSelect.val(),
                    term: params.term
                }
                return query;
            },
            processResults: function (data) {
                return {
                  results: data.results
                };
              }
        },
        
    });

    var $houseSelect = $('#sv-app-house-select');
    $houseSelect.select2({
        placeholder: 'Выберите дом',
        ajax: {
            url: 'https://okrug.od.spb.ru/addresses/search_house/',
            dataType: 'json',
            data: function (params) {
                var query = {
                    address: $streetSelect.val(),
                    term: params.term
                }
                return query;
            },
            processResults: function (data) {
                return {
                  results: data.results
                };
              }
        },
        
    });

    $districtSelect.on('change', function () {
        console.log($districtSelect.val());
    });

    $houseSelect.on('change.select2', function () {
        var uikData = $houseSelect.select2('data')[0];
        var uik = uikData.uik;
        var oikData = oikByUik[uikData.uik];
        if (oikData === undefined) {
            drawError('Кандидаты для УИК ' + uik + ' не найдены');
            return;
        } else {
            clearError();
        }
        drawCandidates(candidatesByOik[oikData.oik], uikData, oikData);
        drawVotePlace(votePlaces[uik]);
    });

    var $errorContainer = $('#sv-error');
    function drawError(message) {
        $errorContainer.html('<div class="alert alert-danger">' + message  + '</div>');
        $candidatesContainer.html('');
        $votePlaceContainer.html('');
    }

    function clearError() {
        $errorContainer.html('');
    }

    var $candidatesContainer = $('#sv-candidates');

    function drawCandidates(candidates, uikData, oikData) {
        var tpl = [
            '<h3>Кандидаты</h3>',
            '<table class="table">',
            '<tr>',
            '<th>Кандидат</th>',
            '<th>Проект или партия</th>',
            '</tr>',
        ];
        candidates.filter(function (candidate) {
            // console.log(candidate,  candidate.mo, oikData.mo, candidate.mo === oikData.mo);
            return candidate.mo.trim().split(' ').join('').toLowerCase() === oikData.mo.trim().split(' ').join('').toLowerCase();
        }).forEach(function (candidate) {
            var candidateTpl = [
                '<tr>',
                ['<td>', candidate.fio, '</td>'].join(''),
                ['<td>', candidate.party, '</td>'].join(''),
                '</tr>',
            ];
            tpl.push(candidateTpl.join(''));
        });
        tpl.push('</table>');
        $candidatesContainer.html(tpl.join(''))
    }

    var $votePlaceContainer = $('#sv-vote-place');
    function drawVotePlace(voitePlace) {
        var tpl = [
            '<h3>Место для голосования</h3>',
            '<table class="table">',
            '<tr>',
            '<th>Ваш муниципалитет</th>',
            '<td>' + voitePlace.mo + '</td>',
            '</tr><tr>',
            '<th>Ваш УИК</th>',
            '<td>' + voitePlace.uik + '</td>',
            '</tr><tr>',
            '<th>Адрес помещения для голосования</th>',
            '<td>' + voitePlace.address + '</td>',
            '</tr><tr>',
            '<th>Где находится</th>',
            '<td>' + voitePlace.place + '</td>',
            '</tr>',
            '</table>'
        ];
        
        $votePlaceContainer.html(tpl.join(''));
    }
})();