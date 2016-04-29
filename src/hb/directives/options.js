//! pattern /hb\-options=("|')/
internal('hbOptions', ['hb.directive', 'each'], function (directive, each) {
    directive('hbOptions', function ($app) {
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                var options = el.options;

                if(!options) {
                    return;
                }

                function updateOptions(newOptions) {
                    newOptions = newOptions || [];
                    each(newOptions, onEachOption);
                    while(options.length > newOptions.length) {
                        options.remove(options.length - 1);
                    }
                }

                function onEachOption(option, index) {
                    // handle strings only. convert to objects.
                    option = option && option.text !== undefined ? option : {text:option};
                    if (option.value === undefined) {
                        option.value = option.text;
                    }
                    var currentOption = options[index];
                    if (!currentOption) {
                        currentOption = document.createElement("option");
                        options.add(option);
                    }
                    if (currentOption.text !== option.text || currentOption.value !== option.value) {
                        currentOption.text = option.text;
                        currentOption.value = option.value;
                    }
                }

                scope.$watch(alias.value, updateOptions);
            }]
        };
    });
});
