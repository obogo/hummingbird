/**
 * Apply selectedItem and selectedIndex functions to a target wrapped on an array.
 * @param p
 */
define('selection', ['matchIndexOf'], function (matchIndexOf) {

    return function selection(list, target) {
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
            var index = matchIndexOf(list, item);
            if (index !== -1) {
                select(list[index], index);
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
        target.getList = getList;
        target.setList = setList;
        return target;

    };
});
