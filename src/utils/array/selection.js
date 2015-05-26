/**
 * Apply selectedItem and selectedIndex functions to a target wrapped on an array.
 * @param p
 */
define('selection', function () {

    var selection = function (list, target) {
        var selectedItem,
            selectedIndex = -1;

        function select(item, index) {
            var previous;
            if (selectedItem !== item || selectedIndex !== index) {
                previous = selectedItem;
                selectedItem = item;
                selectedIndex = index;
                if (target.dispatch) {
                    target.dispatch(target.constructor.name + '::selectionChange', selectedItem, previous);
                }
            }
        }

        function getSelectedItem() {
            return selectedItem;
        }

        function setSelectedItem(item) {
            var index = list.indexOf(item);
            if (index !== -1) {
                select(item, index);
            }
        }

        function getSelectedIndex() {
            return selectedIndex;
        }

        function setSelectedIndex(index) {
            if (list[index]) {
                select(list[index], index);
            }
        }

        function setList(newList) {
            list = newList;
            selectedItem = null;
            selectedIndex = -1;
        }

        function getList() {
            return list;
        }

        target = target || {};
        target.getSelectedItem = getSelectedItem;
        target.setSelectedItem = setSelectedItem;
        target.getSelectedIndex = getSelectedIndex;
        target.setSelectedIndex = setSelectedIndex;
        target.setList = setList;
        return target;

    };

    return selection;

});
