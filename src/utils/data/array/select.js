/**
 * Apply selectedItem and selectedIndex functions to a target wrapped on an array.
 * @param p
 */
utils.data.array.select = function (list, target) {
    var selectedItem,
        selectedIndex = -1;

    function select(item, index) {
        if (selectedItem !== item || selectedIndex !== index) {
            selectedItem = item;
            selectedIndex = index;
            if (target.dispatch) {
                target.dispatch(target.constructor.name + '::selectionChange', selectedItem);
            }
        }
    }

    function getSelectedItem() {
        return selectedItem;
    }

    function setSelectedItem(app) {
        var index = list.indexOf(app);
        if (index !== -1) {
            select(app, index);
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

    target = target || {};
    target.getSelectedItem = getSelectedItem;
    target.setSelectedItem = setSelectedItem;
    target.getSelectedIndex = getSelectedIndex;
    target.setSelectedIndex = setSelectedIndex;
    return target;
};