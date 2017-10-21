define('store', ['dispatcher'], function(dispatcher) {
    function Store(storeOptions) {
        dispatcher(this);
        this.state = storeOptions.state;
        this.$storeOptions = storeOptions || {};
        this.$storeOptions.mutations = this.$storeOptions.mutations || {};
        this.$storeOptions.actions = this.$storeOptions.actions || {};
        this.$storeOptions.getters = this.$storeOptions.getters || {};

        this.mutations = {};
        this.getters = {};

        for (var mutationName in storeOptions.mutations) {
            if (storeOptions.mutations.hasOwnProperty(mutationName)) {
                this.registerMutation(mutationName, storeOptions.mutations[mutationName]);
            }
        }
        for (var actionName in storeOptions.actions) {
            if (storeOptions.actions.hasOwnProperty(actionName)) {
                this.registerAction(actionName, storeOptions.actions[actionName]);
            }
        }
        for (var getterName in storeOptions.getters) {
            if (storeOptions.getters.hasOwnProperty(getterName)) {
                this.registerGetter(getterName, storeOptions.getters[getterName]);
            }
        }
    }

    Store.prototype.registerMutation = function (type, mutator) {
        var self = this;
        var state = this.state;
        this.mutations[type] = function (payload) {
            mutator(state, payload);
            self.dispatch('$mutation', {
                type: type,
                payload: payload
            });
        };
    };

    Store.prototype.registerAction = function (type, action) {
        this.on(type, function (evt, payload) {
            action(this, payload);
        });
    };

    Store.prototype.registerGetter = function(type, getter) {
        var state = this.state;
        Object.defineProperty(this.getters, type, {
            get: function() {
                return getter(state);
            }
        });
    };

    Store.prototype.subscribe = function(handler) {
        var state = this.state;
        return this.on('$mutation', function(evt, mutation) {
            handler(mutation, state);
        });
    };

    Store.prototype.commit = function (mutation, payload) {
        this.mutations[mutation](payload);
    };

    var stores = {};
    Store.get = function(name) {
        if(!stores[name]) {
            throw new Error('No store found with name "' + name + '"');
        }
        return stores[name];
    };

    Store.register = function(name, storeOptions) {
        if(stores[name]) {
            throw new Error('Store already exists with name "' + name + '"');
        }

        stores[name] = new Store(storeOptions);
        return stores[name];
    };

    return Store;
});