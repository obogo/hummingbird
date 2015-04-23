hb.define('asyncRenderSpec', ['asyncRender'], function(asyncRender) {
    describe('asyncRender', function () {
        it("should create a new AsyncRender", function() {
            expect(asyncRender.create()).not.toBe(asyncRender.create());
        });

        describe("down", function() {

            it("should count forward in chunks if the direction is down", function () {
                var ar = asyncRender.create();
                ar.setup(ar.down, 2, 10);
                ar.next();
                expect(ar.direction).toBe(ar.down);
                expect(ar.index).toBe(0);
                expect(ar.len).toBe(2);
                expect(ar.maxLen).toBe(10);
            });
            
            it("should count even if there is only one item", function() {
                var ar = asyncRender.create();
                ar.setup(ar.down, 2, 1);
                ar.next();
                ar.inc();
                expect(ar.index).toBe(1);
                expect(ar.atChunkEnd).toBe(true);
                expect(ar.complete).toBe(true);
            });

            it("should increment 1 when counting down", function () {
                var ar = asyncRender.create();
                ar.setup(ar.down, 2, 10);
                ar.next();
                ar.inc();
                expect(ar.index).toBe(1);
            });

            it("should increment 1 until the end is reached", function () {
                var ar = asyncRender.create();
                ar.setup(ar.down, 2, 10);
                ar.next();
                ar.inc();
                ar.inc();
                ar.inc();
                expect(ar.index).toBe(2);
            });

            it("should fire an event when the end is reached", function () {
                var ar = asyncRender.create(),
                    complete = false;
                ar.setup(ar.down, 2, 10);
                ar.on('async::chunk_end', function () {
                    complete = true;
                });
                ar.next();
                ar.inc();
                ar.inc();
                ar.inc();
                expect(complete).toBe(true);
            });

            it("should run the cycle", function () {
                var ar = asyncRender.create(),
                    chunks = 0,
                    complete = false;
                ar.setup(ar.down, 2, 10);
                ar.on('async::chunk_end', function () {
                    //console.log('end');
                    ar.next();
                    chunks += 1;
                });
                ar.on('async::complete', function () {
                    //console.log('complete');
                    complete = true;
                });
                ar.next();
                while (!complete) {
                    ar.inc();
                    //console.log("index", ar.index, "len", ar.len, "maxLen", ar.maxLen);
                }
                expect(chunks).toBe(5);
                expect(complete).toBe(true);
                expect(ar.complete).toBe(true);
                expect(ar.index).toBe(ar.maxLen);
            });
        });

        describe("up", function() {

            it("should count backward in chunks if the direction is up", function () {
                var ar = asyncRender.create();
                ar.setup('up', 2, 10);
                ar.next();
                expect(ar.direction).toBe('up');
                expect(ar.index).toBe(9);
                expect(ar.len).toBe(2);
                expect(ar.maxLen).toBe(10);
                //console.log(JSON.stringify(ar, null, 2));
            });

            it("should increment 1 when counting up", function () {
                var ar = asyncRender.create();
                ar.setup('up', 2, 10);
                ar.next();
                ar.inc();
                expect(ar.index).toBe(8);
            });

            it("should increment 1 until the end is reached", function () {
                var ar = asyncRender.create();
                ar.setup('up', 2, 10);
                ar.next();
                ar.inc();
                ar.inc();
                ar.inc();
                expect(ar.index).toBe(7);
            });

            it("should fire an event when the end is reached", function () {
                var ar = asyncRender.create(),
                    complete = false;
                ar.setup('up', 2, 10);
                ar.on('async::chunk_end', function () {
                    complete = true;
                });
                ar.next();
                ar.inc();
                ar.inc();
                ar.inc();
                expect(complete).toBe(true);
            });

            it("should run the cycle", function () {
                var ar = asyncRender.create(),
                    chunks = 0,
                    complete = false;
                ar.setup('up', 2, 10);
                ar.on('async::chunk_end', function () {
                    ar.next();
                    chunks += 1;
                });
                ar.on('async::complete', function () {
                    complete = true;
                });
                ar.next();
                while (!complete) {
                    ar.inc();
                }
                expect(chunks).toBe(5);
                expect(complete).toBe(true);
                expect(ar.complete).toBe(true);
                expect(ar.index).toBe(-1);
                //console.log(JSON.stringify(ar, null, 2));
            });

            it("should handle 1 item correctly", function () {
                var ar = asyncRender.create(),
                    chunks = 0,
                    complete = false;
                ar.setup('up', 2, 1);
                ar.on('async::chunk_end', function () {
                    ar.next();
                    chunks += 1;
                });
                ar.on('async::complete', function () {
                    complete = true;
                });
                ar.next();
                while (!complete) {
                    ar.inc();
                }
                expect(chunks).toBe(1);
                expect(complete).toBe(true);
                expect(ar.complete).toBe(true);
                expect(ar.index).toBe(-1);
                //console.log(JSON.stringify(ar, null, 2));
            });
        });
    })
});