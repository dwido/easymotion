+function ($) {
    'use strict';

    // EASYMOTION CLASS DEFINITION
    // ==========================

    var targets = [],
        positions,  // positions of targets
        easymotion;


    // Track mouse events, calculate movement, start, stop events
    function EasyMotion(element, options) {
        var mouseTracker = new MouseTracker({
            onStart: function () {
                console.log('mouse start');
            },
            onSample: function (samples) {
                var lastSample = _.last(samples);
                console.log('mouse on sample, last sample: x:' + lastSample.x + ' y:' + lastSample.y);
                this.onSample(samples);
            },
            onStop: function (samples) {
                var lastSample = _.last(samples);
                console.log('mouse stop, last sample: x:' + lastSample.x + ' y:' + lastSample.y);
            }
        }, this)
        
        this.addItem = function ($el) {
            targets.push($el);
            if (!mouseTracker.isAttached()) {
                mouseTracker.attach();
            }
            this.setTargetsLocation();
        }
        this.removeItem = function ($el) {
            var itemIndex = targets.indexOf($el);
            if (itemIndex > -1) {
                targets.splice(itemIndex, 1);
            }
            if (!targets.length && mouseTracker.isAttached()) {
                mouseTracker.detach();
            }
        }

        // assumes triangle where:
        // A - start Point
        // B - sample Point (end)
        // C - target Point
        //
        // based on that calculate lambda which is the angle 
        // the cursor moves towards the target
        // small lambda with smaller distance will be used to determined
        // the best candidate from the targets
        this.onSample = function(samples) {
            var b, // startDistance the vertice across from B
                a,
                c,
                alpha, // endDistance; the vertice across from A
                candidates = [],
                n = samples.length,
                start = samples[n - 2], // before last sample
                last = samples[n - 1]; // last sample

            positions.forEach(function (position) {
                b = Math.sqrt(Math.pow((start.x - position.offset.left), 2) + Math.pow((start.y - position.offset.top), 2));
                a = Math.sqrt(Math.pow((last.x - position.offset.left), 2) + Math.pow((last.y - position.offset.top), 2));
                c = Math.sqrt(Math.pow((last.x - start.x), 2) + Math.pow((last.y - start.y), 2));

                alpha = Math.acos((Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) / (2 * a * b))
                // convert to degrees
                alpha = alpha * (180 / Math.PI);
                //position.el.text('a: ' + Math.floor(a) + 'b: ' + Math.floor(b) + 'c:' + Math.floor(c) + ' alpha: ' + alpha);
                if (a < b && alpha < 5) {
                    candidates.push({el: position.el, alpha: alpha});
                } else {
                    position.el.removeClass('on-target');
                }
                candidates.sort(function (a, b) {
                    return a - b;
                })
                if (candidates.length) {
                    candidates[0].el.addClass('on-target');
                }
            }.bind(this))
            // clear the timeout to continue tracking
            //clearTimeout(this.timeout);
            //this.timeout = null;
        }
        this.setTargetsLocation = function () {
            positions = [];
            for(var i = 0; i < targets.length; i++) {
                positions.push({
                    el: targets[i],
                    offset: targets[i].offset()
                });
            }
        }
    }

    function EasyMotionItem($element, options) {
        this.$el = $element;
        easymotion.addItem($element);
    }

    EasyMotionItem.prototype.remove = function ($el) {
        easymotion.removeItem(this.$el);
    }


    $.fn.easymotion = function (option) {
        return this.each(function () {
            var $this = $(this),
               data = $this.data('dw.easymotion'),
               options = typeof option == 'object' && option;
            if (!data) $this.data('dw.easymotion', data = new EasyMotionItem($this, options));
            if (typeof option == 'string') data[option]()
        })
    }
    
    $(window).on('load', function () {
        easymotion = new EasyMotion();

        $('[data-easymotion="target"]').each(function () {
            var $target = $(this);
            $target.easymotion($target.data());
        })
    })
}(jQuery);
