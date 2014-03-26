/* ========================================================================
 * David Buchbut: easymotion.js v0.1
 * ========================================================================
 * Licensed under MIT (https://github.com/dwido/easymotion)
 * ======================================================================== 
 * easy motion is a jquery plugin to predict mouse movements and allow 
 * use to have short cuts 
 * move your mouse slowly towards a clickable item once stopped a little
 * bubble will apear between the mouse and the clickable and the user can
 * short cut it */

+function ($) {
    'use strict';

    // EASYMOTION CLASS DEFINITION
    // ==========================

    var targets = [],
        positions,  // positions of targets
        easymotion;


    function EasyMotion(element, options) {
        var defaults = {
            popDistance: 50,
            bubble: $('[data-easymotion=bubble]')
        }
        options = options || {};
        _.defaults(options, defaults);

        // Track mouse events, calculate movement, start, stop events
        var mouseTracker = new MouseTracker({
            onStart: function () {
                console.log('mouse start');
            },
            onSample: function (samples) {
                this.onSample(samples);
            },
            onStop: function (samples) {
                mouseTracker.reset();
                this.popCandidate(samples);
            }
        }, this)
        
        // when a new clickable is added as a target
        this.addItem = function ($el) {
            targets.push($el);
            if (!mouseTracker.isAttached()) {
                mouseTracker.attach();
            }

            // calculate the location of clickables
            this.setTargetsLocation();
        }

        // remove clickable
        this.removeItem = function ($el) {
            var itemIndex = targets.indexOf($el);
            if (itemIndex > -1) {
                targets.splice(itemIndex, 1);
            }
            if (!targets.length && mouseTracker.isAttached()) {
                mouseTracker.detach();
            }
        }

        this.onSample = function(samples) {
            var candidates = this.calcCandidates(samples);
            targets.forEach(function(target) {
                // add css class to allow the user to customize the apparence
                target.removeClass('on-target');
            })
            if (candidates.length) {
                candidates[0].el.addClass('on-target');
            }
        };

        // calculate which target the mouse is moving towards using geometric
        // calculations:
        //
        // assumes triangle where:
        // A - start Point
        // B - sample Point (end)
        // C - target Point
        //
        // based on that calculate lambda which is the angle 
        // the cursor moves towards the target
        // small lambda with smaller distance will be used to determined
        // the best candidate from the targets
        this.calcCandidates = function (samples) {
            var a, b, c, // vertices
                A, B, C, //points
                alpha, // endDistance; the vertice across from A
                candidates = [],
                n = samples.length,
                start = samples[0], // before last sample
                last = samples[n - 1]; // last sample

            positions.forEach(function (position) {
                // calculate the triangle between mouse and clickable
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

        // save the location of all targets for efficiency
        this.setTargetsLocation = function () {
            positions = [];
            for(var i = 0; i < targets.length; i++) {
                positions.push({
                    el: targets[i],
                    offset: targets[i].offset()
                });
            }
        };

        // show a popup between the mouse and the clickable
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
