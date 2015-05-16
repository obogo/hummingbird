define('hb.eventStash', function() {
    var events = new (function EventStash() {});// type cast it.
    events.HB_READY = "hb::ready";
    return events;
});