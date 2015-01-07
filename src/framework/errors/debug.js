internal('hb.errors.build', ['hb'], function (hb) {
    hb.errors.MESSAGES = {
        E1: 'Trying to assign multiple scopes to the same dom element is not permitted.',
        E2: 'Unable to find element',
        E3: 'Exceeded max digests of ',
        E4: 'parent element not found in %o',
        E5: 'property is not of type object',
        E6a: 'Error evaluating: "',
        E6b: '" against %o',
        E7: '$digest already in progress.',
        E8: 'Name required to instantiate module',
        E9: 'Injection not found for ',
        E10: 'This element has already been compiled',
    };
});
