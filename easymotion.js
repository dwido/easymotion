+function ($) {
    'use strict';

    // EASYMOTION CLASS DEFINITION
    // ==========================

    var targets = [],
        positions,  // positions of targets
        easymotion;


    // Track mouse events, calculate movement, start, stop events
    function EasyMotion(element, options) {
        var defaults = {
            popDistance: 50,
            bubble: $('[data-easymotion=bubble]')
        }
        options = options || {};
        _.defaults(options, defaults);
        var mouseTracker = new MouseTracker({
            onStart: function () {
                console.log('mouse start');
            },
            onSample: function (samples) {
                var lastSample = _.last(samples);
                //console.log('mouse on sample, last sample: x:' + lastSample.x + ' y:' + lastSample.y);
                this.onSample(samples);
            },
            onStop: function (samples) {
                var lastSample = _.last(samples);
                //console.log('mouse stop, last sample: x:' + lastSample.x + ' y:' + lastSample.y);
                mouseTracker.reset();
                this.popCandidate(samples);
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
            var candidates = this.calcCandidates(samples);
            targets.forEach(function(target) {
                target.removeClass('on-target');
            })
            if (candidates.length) {
                candidates[0].el.addClass('on-target');
            }
        };

        this.calcCandidates = function (samples) {
            var a, b, c, // vertices
                A, B, C, //points
                alpha, // endDistance; the vertice across from A
                candidates = [],
                n = samples.length,
                start = samples[0], // before last sample
                last = samples[n - 1]; // last sample

            positions.forEach(function (position) {
                A = start;
                B = last;
                C = {
                    x: position.offset.left,
                    y: position.offset.top
                };
                b = Math.sqrt(Math.pow((A.x - C.x), 2) + Math.pow((A.y - C.y), 2));
                a = Math.sqrt(Math.pow((B.x - C.x), 2) + Math.pow((B.y - C.y), 2));
                c = Math.sqrt(Math.pow((B.x - A.x), 2) + Math.pow((B.y - A.y), 2));

                alpha = Math.acos((Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) / (2 * a * b))
                // convert to degrees
                alpha = alpha * (180 / Math.PI);
                //position.el.text('a: ' + Math.floor(a) + 'b: ' + Math.floor(b) + 'c:' + Math.floor(c) + ' alpha: ' + alpha);
                if (a < b && alpha < 5) {
                    candidates.push({
                        el: position.el, 
                        triangle: {
                            alpha: alpha,
                            a: a,
                            b: b,
                            c: c,
                            A: A,
                            B: B,
                            C: C
                        }
                    });
                }
                candidates.sort(function (a, b) {
                    return a.triangle.alpha - b.triangle.alpha;
                })
            }.bind(this))

            return candidates;
        };

        this.setTargetsLocation = function () {
            positions = [];
            for(var i = 0; i < targets.length; i++) {
                positions.push({
                    el: targets[i],
                    offset: targets[i].offset()
                });
            }
        };

        this.popCandidate = function (samples) {
            var candidates = this.calcCandidates(samples),
                topCandidate,
                t,
                ratio,
                offsetX,    // offset X from last mouse location (B)
                offsetY,
                position;    // offset Y from last mouse location (B)

            if (!candidates.length) return;
            
            
            topCandidate = candidates[0];
            t = topCandidate.triangle;
            
            // calculate  location of bubble
            ratio = options.popDistance / t.a;
            offsetX = (t.C.x - t.B.x) * ratio 
            offsetY = (t.C.y - t.B.y) * ratio 

            position = {
                left: t.B.x + offsetX,
                top: t.B.y + offsetY
            }

            options.bubble.offset(position).addClass('pop');
            topCandidate.el.addClass('easymotion-bubbled');
            options.bubble.click(function() {
                topCandidate.el.removeClass('easymotion-bubbled').removeClass('on-target');
                topCandidate.el.click();
                options.bubble.removeClass('pop');
                mouseTracker.reset().attach();
                options.bubble.unbind("click");
                return false;
            })
            options.bubble.mouseover(function () {
                topCandidate.el.addClass('easymotion-bubbled-mouseover');
            })
            options.bubble.mouseout(function () {
                topCandidate.el.removeClass('easymotion-bubbled-mouseover');
            })

            mouseTracker.detach();

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
