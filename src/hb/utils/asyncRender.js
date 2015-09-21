internal('asyncRender', ['dispatcher', 'hb.eventStash'], function(dispatcher, events) {
    var UP = 'up';
    var DOWN = 'down';

    events.ASYNC_RENDER_CHUNK_END = 'async::chunk_end';
    events.ASYNC_RENDER_COMPLETE = 'async::complete';

    /**
     * @type AsyncRender
     * @property {Function} dispatch
     */
    function AsyncRender() {
        this.down = DOWN;
        this.up = UP;
        this.direction =  DOWN;
        this.index = 0;
        this.len = 0;
        this.maxLen = 0;
        this.size = 0;
        this.complete = false;
        this.atChunkEnd = false;
        dispatcher(this);
    }
    var p = AsyncRender.prototype;
    p.setup = function(direction, size, maxLen) {
        this.direction = direction;
        this.size = size;
        this.len = 0;
        this.maxLen = maxLen;
        this.atChunkEnd = false;
        this.complete = false;
        this.index = direction === DOWN ? 0 : maxLen - 1;
    };
    p.inc = function() {
        if (this.complete || this.atChunkEnd) {
            return;
        }
        if (this.direction === DOWN) {
            if (this.index < this.len) {
                this.index += 1;
                if (this.index === this.len) {
                    this.finishChunk();
                }
            } else {
                this.finishChunk();
            }
        } else {//UP
            if (this.index > this.maxLen - this.len - 1) {
                this.index -= 1;
            }
            if(this.index <= this.maxLen - this.len - 1){
                this.finishChunk();
            }
        }
        //this.index += this.direction === DOWN ? (this.index === this.len ? 0 : 1) : -1;
    };
    p.finishChunk = function() {
        if (!this.complete && !this.atChunkEnd) {
            this.atChunkEnd = true;
            if ((this.index === -1 || this.index === this.maxLen) && this.len === this.maxLen) {
                this.finish();
            }
            this.dispatch(events.ASYNC_RENDER_CHUNK_END);// this fired at the end to avoid infinite loop if trying to process synchronously
        }
    };
    p.next = function() {
        if (this.complete) {
            this.dispatch(events.ASYNC_RENDER_COMPLETE);
            this.direction = DOWN;
            return false;
        }
        var increase = Math.min(this.size, this.maxLen);
        if (!increase) {
            return false;
        }
        if (this.len + increase > this.maxLen) {
            increase = this.maxLen - this.len;
        }
        if (this.direction === UP) {
            this.index = this.maxLen - this.len - 1;
        }
        this.len += increase;
        this.atChunkEnd = false;
        return true;
    };
    p.finish = function() {
        this.complete = true;
    };

    return {
        create: function () {
            return new AsyncRender();
        }
    };
});