(function () {
    'use strict';
    var candidatesByOik = {};
    var oikByUik = {};
    var moByUik = {};
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
    $.get('http://isergey.github.io/vote/candidate-oik.csv').then(function (data) {
        var res = Papa.parse(data);
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
        return $.get('http://isergey.github.io/vote/oik-uik.csv');
    }).then(function (data) {
        var res = Papa.parse(data);
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
        return $.get('http://isergey.github.io/vote/vote-places.csv');
    }).then(function (data) {
        var res = Papa.parse(data);
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
        // var uik = oikByUik[$houseSelect.select2('data')[0].uik];
        // console.log('uik', uik);
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
            '<th>Партия</th>',
            '</tr>',
        ];
        // console.log(uikData);
        // console.log(oikData);
        candidates.filter(function (candidate) {
            // console.log(candidate,  candidate.mo, oikData.mo, candidate.mo === oikData.mo);
            return candidate.mo === oikData.mo;
        }).forEach(function (candidate) {
            // console.log(candidate);
            // console.log(oikData);
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
            '<h3>Место голосования</h3>',
            '<table class="table">',
            '<tr>',
            '<th>Муниципалитет</th>',
            '<td>' + voitePlace.mo + '</td>',
            '</tr><tr>',
            '<th>УИК</th>',
            '<td>' + voitePlace.uik + '</td>',
            '</tr><tr>',
            '<th>Адрес</th>',
            '<td>' + voitePlace.address + '</td>',
            '</tr><tr>',
            '<th>Место голосования</th>',
            '<td>' + voitePlace.place + '</td>',
            '</tr>',
            '</table>'
        ];
        
        $votePlaceContainer.html(tpl.join(''));
    }
})();