'use strict';
describe("module", function () {
    it("should create a new module", function() {
        expect(hb.module('test', true)).toBeDefined();
    });

    it("should throw an error if no name is provided", function() {
        var err;
        try{
            hb.module();
        } catch(e) {
            err = e;
        }
        expect(err).toBeDefined();
    });

    it("should cache the module by name", function() {
        var mod = hb.module('test', true);
        expect(hb.module('test')).toBe(mod);
    });

    it("should create the injection for module", function() {
        var mod = hb.module('test', true);
        expect(mod.injector.val('module')).toBe(mod);
    });

    it("should set with the module name", function() {
        var mod = hb.module('test', true), mine = {};
        mod.val('mine', mine);
        expect(mod.val('mine')).toBe(mine);
    });
});