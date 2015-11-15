"use strict";var//jshint ignore:line
/*
 * EVENTMANAGER MODULE
 * Manages all keyboard related events - button functionality, language switching, etc.
 * */
EventManager = { //jshint ignore:line
    // Module-specific constants
    SHIFT_CLASS: "." + SPEC_BTN_CLASS + ".shift",

    // Language/layout switching functionality.
    loadLanguageSwitcher: function() {
        $("." + LANG_BTN_CLASS).click(function() {
            var $this = $(this),
                newLang = $this.data("lang");

            $("." + Core.selectedLanguage + LNG_CLASS_POSTFIX).addClass(HIDE_CLASS);
            $("." + newLang + LNG_CLASS_POSTFIX).removeClass(HIDE_CLASS);
            $("." + LANG_BTN_CLASS + "." + SELECTED_ITEM_CLASS).removeClass(SELECTED_ITEM_CLASS);
            $this.addClass(SELECTED_ITEM_CLASS);

            Core.selectedLanguage = newLang;
        });
    },

    // CAPSLOCK functionality.
    loadCapsLockEvent: function() {
        var lngClass = "." + Core.selectedLanguage + LNG_CLASS_POSTFIX,
            capsLockClass = "." + SPEC_BTN_CLASS + ".capslock";

        this.onLocalButtonClick(capsLockClass, function () {
            var $this = $(this),
                $parent = $this.closest(lngClass), // Modify only selected layout

                // We are checking if the button is selected (has the respective class)
                isCapsLockOn = $this.hasClass(SELECTED_ITEM_CLASS);

            if (isCapsLockOn) {
                $this.removeClass(SELECTED_ITEM_CLASS);
            } else {
                $this.addClass(SELECTED_ITEM_CLASS);
            }

            // Set all buttons to upper or lower case
            EventManager.traverseLetterButtons($parent, !isCapsLockOn);
        });
    },

    // SHIFT functionality.
    loadShiftEvent: function() {
        var lngClass = "." + Core.selectedLanguage + LNG_CLASS_POSTFIX;

        this.onLocalButtonClick(EventManager.SHIFT_CLASS, function () {
            var $parent = $(this).closest(lngClass);

            EventManager.traverseInputButtons($parent, true, "shift");

            Core.shift = true;
            // Not using $(this) since we have to change all shift buttons
            $(EventManager.SHIFT_CLASS).addClass(SELECTED_ITEM_CLASS);
        });
    },

    // Returns all the buttons in their normal state (Opposite of .loadShiftEvent())
    unshift: function() {
        var lngClass = "." + Core.selectedLanguage + LNG_CLASS_POSTFIX,
            $shiftButtons = $(EventManager.SHIFT_CLASS),
            $parent = $shiftButtons.closest(lngClass);

        this.traverseInputButtons($parent, false, "normal");

        Core.shift = false;
        $shiftButtons.removeClass(SELECTED_ITEM_CLASS);
    },

    // Provides layout/language localized click event.
    onLocalButtonClick: function (button, handler) {
        Visualization.$base
            .find("." + Core.selectedLanguage + LNG_CLASS_POSTFIX)
            .find(button)
            .click(handler);
    },

    // Traverses through all of the letter/normal buttons.
    traverseLetterButtons: function ($parent, shouldBeUpper) {
        $parent.find("." + NORM_BTN_CLASS).each(function() {
            var $this = $(this),
                value = $this.data("val");

            if (shouldBeUpper) {
                value = value.toUpperCase();
            } else {
                value = value.toLowerCase();
            }

            $this.html(value).data("val", value);
        });
    },

    // Traverses all input buttons.
    traverseInputButtons: function ($parent, shouldBeUpper, shiftBtnValueSource) {
        this.traverseLetterButtons($parent, shouldBeUpper);

        $parent.find("." + SHFT_BTN_CLASS).each(function() {
            var $this = $(this),

                /* Select the source of the wanted button state
                 * Can be 'normal' or in 'shift' mode */
                value = $this.data(shiftBtnValueSource);

            $this.html(value).data("val", value);
        });
    },

    // BACKSPACE functionality.
    loadBackspaceEvent: function() {
        $("." + SPEC_BTN_CLASS + ".backspace").click(function() {
            EventManager.onDirectTextManip(
                function(selection, currentContent) {
                    var backspaceCaretOffset;

                    if (selection.start === selection.end) {
                        backspaceCaretOffset = 1;
                    } else {
                        backspaceCaretOffset = 0;
                    }

                    return {
                        updatedContent: Helpers.backspaceStrManipulation(currentContent, selection, backspaceCaretOffset),
                        caretOffset: -backspaceCaretOffset
                    };
                }
            );
        });
    },


    loadInputButtonEvent: function() {
        Visualization.$base
            .find("." + NORM_BTN_CLASS)
            .add("." + SHFT_BTN_CLASS)
            .add("." + SPEC_BTN_CLASS + ".space")
            .add("." + SPEC_BTN_CLASS + ".tab")
            .click(function() {
                var selectedBtnVal = $(this).data("val");

                EventManager.onDirectTextManip(
                    function(selection, currentContent) {
                        return {
                            updatedContent: Helpers.insertCharacter(currentContent, selection, selectedBtnVal),
                            caretOffset: 1
                        };
                    });

                if (Core.shift) {
                    EventManager.unshift();
                }
            });
    },

    onDirectTextManip: function(btnFunctionality) {
        var activeElemNative,
            currentContent,
            btnPressResult,
            selection;

        if (EventManager.$activeElement) {
            EventManager.resetActiveElementFocus();

            currentContent = EventManager.$activeElement.val() || "";
            activeElemNative = EventManager.$activeElement[0];

            selection = {
                start: activeElemNative.selectionStart,
                end: activeElemNative.selectionEnd
            };

            btnPressResult = btnFunctionality(selection, currentContent);

            EventManager.$activeElement.val(btnPressResult.updatedContent);
            Helpers.setCaretPosition(activeElemNative, selection.start + btnPressResult.caretOffset);
        }
    },

    // Changes the active element on each new cursor focus
    activeElementListener: function() {
        // Those are the allowed active elements
        $("input, textarea").focus(function() {
            EventManager.$activeElement = $(this);
        });
    },

    resetActiveElementFocus: function() {
        this.$activeElement.blur(function () {
            setTimeout(function () {
                EventManager.$activeElement.focus(function(event) {
                    event.stopPropagation();
                });
            }, 25);
        });
    },

    // Used for selecting which events to load at once.
    loadEvents: function() {
        this.activeElementListener();
        this.loadLanguageSwitcher();
        this.loadInputButtonEvent();
        this.loadBackspaceEvent();
        this.loadCapsLockEvent();
        this.loadShiftEvent();
    }
};