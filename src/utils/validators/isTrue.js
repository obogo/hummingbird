define('isTrue', function () {
    var emptyStr = '';
    var isTrue = function () {
        return {
            operators: ['eq', 'neq', '~eq', '~neq', 'gt', 'lt', 'gte', 'lte'],
            test: function (valA, operator, valB) {
                if (!isNaN(valA) && !isNaN(valB)) { // if both are numeric, convert to numeric for testing
                    valA = Number(valA);
                    valB = Number(valB);
                } else { // if undefined make it an empty string
                    valA = valA === undefined ? emptyStr : valA;
                    valB = valB === undefined ? emptyStr : valB;
                }
                switch (operator) {
                    case 'eq':
                        return (valA + emptyStr) === (valB + emptyStr);
                    case 'neq':
                        return (valA + emptyStr) !== (valB + emptyStr);
                    case '~eq':
                        return (valA + emptyStr).toLowerCase() === (valB + emptyStr).toLowerCase();
                    case '~neq':
                        return (valA + emptyStr).toLowerCase() !== (valB + emptyStr).toLowerCase();
                    case 'gt':
                        return (valA > valB);
                    case 'lt':
                        return (valA < valB);
                    case 'gte':
                        return (valA >= valB);
                    case 'lte':
                        return (valA <= valB);
                }
            }
        };
    };

    return isTrue;
});