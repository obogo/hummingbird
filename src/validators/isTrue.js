validators.isTrue = function () {
    return {
        operators: ['eq', 'neq', '~eq', '~neq', 'gt', 'lt', 'gte', 'lte'],
        test: function (valA, operator, valB) {
            if (!isNaN(valA) && !isNaN(valB)) { // if both are numeric, convert to numeric for testing
                valA = Number(valA);
                valB = Number(valB);
            } else { // if undefined make it an empty string
                valA = valA === undefined ? '' : valA;
                valB = valB === undefined ? '' : valB;
            }
            switch (operator) {
                case 'eq':
                    return (valA + '') === (valB + '');
                case 'neq':
                    return (valA + '') !== (valB + '');
                case '~eq':
                    return (valA + '').toLowerCase() === (valB + '').toLowerCase();
                case '~neq':
                    return (valA + '').toLowerCase() !== (valB + '').toLowerCase();
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
}