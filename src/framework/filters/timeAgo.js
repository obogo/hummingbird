/* global filters, utils */
internal('framework.filters.timeAgo', ['framework', 'toTimeAgo'], function (framework, toTimeAgo) {
    return framework.filters.timeAgo = function (module) {
        module.filter('timeAgo', function () {
            return function (date) {
                date = new Date(date);
                var ago = ' ago';
                var returnVal = toTimeAgo(date);
                var interval = returnVal.interval;
                switch (returnVal.ago) {
//            case 'y':
//                return returnVal.interval + ' years' + ago;
//            case 'mo':
//                return returnVal.interval + ' months' + ago;
                    case 'd':
                        return interval + ' days' + ago;
                    case 'h':
                        return interval + ' hours' + ago;
                    case 'm':
                        return interval + ' mins' + ago;
                    case 's':
                        return interval + ' secs' + ago;
                    default:
                        return 'just now';
                }
            };
        });
    }
});


