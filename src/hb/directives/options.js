//! pattern /hb\-options=("|')/
define('hbOptions', ['hb.directive', 'each'], function (directive, each) {
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
                    option = option && option.label !== undefined ? option : {label:option};
                    if (option.value === undefined) {
                        option.value = option.label;
                    }
                    var currentOption = options[index];
                    if (!currentOption) {
                        currentOption = document.createElement("option");
                        options.add(currentOption);
                    }
                    if (currentOption.label !== option.label || currentOption.value !== option.value) {
                        currentOption.label = option.label;
                        currentOption.value = option.value;
                    }
                }

                scope.$watch(alias.value, updateOptions);
            }]
        };
    });
});
