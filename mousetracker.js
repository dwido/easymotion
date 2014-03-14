var MouseTracker = function MouseTracker (options, context) {
    // private properties
    var defaults = {
            sampleRate: 10, // sample rate to sample mouse
            reportRate: 100 // call to onMove
        },
        attached = false,
        timeout,
        samples, // record samples
        interval,
        last;

    if (!options) {
        options = {};
    }

    _.defaults(options, defaults);
    
    // Events
    // this.onMove = function (A, B);
    this.attach = function () {
        $(window).mousemove(this.onMousemove.bind(this));
        attached = true;
    }
    this.detach = function () {
        $(window).unbind("mousemove");
        attached = false;
    }
    // this function is throttled for efficiency so tracking the mouse
    // will be taking less processing
    this.onMousemove = _.throttle(function (e) {
        if (!interval) {
            samples = [];
            interval = setInterval(after.bind(this), 100);
            samples.push({x: e.pageX, y: e.pageY});
        } else {
            last = {x: e.pageX, y: e.pageY};
        }
    }, options.sampleRate)

    this.mouseStopped = function () {
        console.log('mouse stopped');
        if (options.onStop) {
            options.onStop.call(context, samples);
        }
    }

    // private functions
    var after = function () {
        console.log('in after')
        if (samples.length >= 100) {
            samples = samples.slice(80); // make sure no more than 100 samples
        }
        // check if the last two samples are the same 
        // if so fire onmousestop event
        var lastSample  = _.last(samples);
        if (last.x === lastSample.x && last.y === lastSample.y) {
            this.mouseStopped();
            if (!attached) return;
            // only add to samples if still attached
        }

        samples.push(last);
        if (options.onSample) {
            options.onSample.call(context, samples);
        }
    }

    this.isAttached = function () {
        return attached;
    }

    this.reset = function () {
        samples = [];
    }
};

