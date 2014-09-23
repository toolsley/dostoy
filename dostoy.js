/**
 * dostoy - A silly interactive retro console library for the HTML5 canvas
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Toolsley.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 **/

var dostoy = function () {

    var charSet = [];
    var fontHeight = 0;

    var curX = 0;
    var curY = 0;

    var maxX = 0;
    var maxY = 0;

    var foregroundColor = 7;
    var backgroundColor = 0;

    var ctx = null;

    var cursor = true;
    var flipflop = true;

    var applicationInputHandler = null;
    var shellInputHandler = null;

    var shiftState = false;
    var inputBuffer = "";

    var prompt = ">";

    var interactive = true;


    var ansiColors = [ // quickbasic order
        [0, 0, 0],
        [0, 0, 170],
        [0, 170, 0],
        [0, 170, 170],
        [170, 0, 0],
        [170, 0, 170],
        [170, 85, 0],
        [170, 170, 170],
        [85, 85, 85],
        [85, 85, 255],
        [85, 255, 85],
        [85, 255, 255],
        [255, 85, 85],
        [255, 85, 255],
        [255, 255, 85],
        [255, 255, 255]
    ];


    var byte2bits = function (a) {
        var tmp = "";
        for (var i = 128; i >= 1; i /= 2)
            tmp += a & i ? '1' : '0';
        return tmp;
    }

    var initCharSet = function (font, width) {

        var fontBuffer = null;

        if (typeof font == "Uint8Array") {

            fontBuffer = font;

        } else {

            var rawLength = font.length;

            fontBuffer = new Uint8Array(new ArrayBuffer(rawLength));
            for (i = 0; i < rawLength; i++) {
                fontBuffer[i] = font.charCodeAt(i);
            }
        }

        for (var x = 0; x < fontBuffer.length / width; x++) {
            var charI = ctx.createImageData(8, width);
            for (var i = 0; i < width; i++) {
                var bitString = byte2bits(fontBuffer[(x * width) + i]);
                for (var j = 0; j < 8; j++) {
                    charI.data[((i * 8) + j) * 4 + 0] = bitString[j] == "1" ? 255 : 0;
                    charI.data[((i * 8) + j) * 4 + 1] = bitString[j] == "1" ? 255 : 0;
                    charI.data[((i * 8) + j) * 4 + 2] = bitString[j] == "1" ? 255 : 0;
                    charI.data[((i * 8) + j) * 4 + 3] = 255;
                }
            }
            charSet.push(charI);
        }

    }


    var onCommand = function (inputBuffer) {
        if (applicationInputHandler) {
            applicationInputHandler(inputBuffer);
        } else {
            shellInputHandler(inputBuffer);
        }

    }

    var cls = function () {
        curX = 0;
        curY = 0;
        ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "rgba(" + ansiColors[backgroundColor][0] + "," + ansiColors[backgroundColor][1] + "," + ansiColors[backgroundColor][0] + ",1)";
        ctx.fill();

    }
    var initCanvas = function (canvas) {
        ctx = canvas.getContext("2d");
        cls();
    }

    var chr = function (code) {
        var codes = code.split(",");
        var out = "";
        for (var i = 0, icode; icode = codes[i]; i++)
            out += String.fromCharCode(icode);

        return out;
    }

    var newLine = function () {
        cursorBlink(false);
        if (curY + 1 > maxY) {
            ctx.putImageData(ctx.getImageData(0, fontHeight, ctx.canvas.width, ctx.canvas.height - fontHeight), 0, 0);
            ctx.rect(0, maxY * fontHeight, ctx.canvas.width, fontHeight);
            ctx.fillStyle = "rgba(" + ansiColors[backgroundColor][0] + "," + ansiColors[backgroundColor][1] + "," + ansiColors[backgroundColor][0] + ",1)";
            ctx.fill();

            curX = 0;

        } else {
            curY++;
            curX = 0;
        }
    }

    var doPrompt = function () {
        if (prompt && interactive)
            print(prompt);
    }

    var print = function (text) {
        text = text.toString().replace(/\t/g, "       ");
        var startXReal = curX * 8;
        var startYReal = curY * fontHeight;
        var characterBuffer;
        for (var i = 0; i < Math.min(text.length, maxX); i++) {
            if (backgroundColor != 0 || foregroundColor != 15) {
                characterBuffer = new Uint8ClampedArray(charSet[text.charCodeAt(i)].data);
                for (var j = 0; j < characterBuffer.length; j += 4) {
                    characterBuffer[j] = characterBuffer[j] !== 255 ? ansiColors[backgroundColor][0] : ansiColors[foregroundColor][0];
                    characterBuffer[j + 1] = characterBuffer[j + 1] !== 255 ? ansiColors[backgroundColor][1] : ansiColors[foregroundColor][1];
                    characterBuffer[j + 2] = characterBuffer[j + 2] !== 255 ? ansiColors[backgroundColor][2] : ansiColors[foregroundColor][2];
                }
                var colorizedCharacter = ctx.createImageData(8, fontHeight);
                colorizedCharacter.data.set(characterBuffer);

                ctx.putImageData(colorizedCharacter, startXReal + (i * 8), startYReal);
            } else {
                ctx.putImageData(charSet[text.charCodeAt(i)], startXReal + (i * 8), startYReal);

            }

            curX++;
        }
    }

    var color = function (bg, fg) {
        backgroundColor = bg;
        foregroundColor = fg;
    }

    var println = function (text) {
        if (text)
            print(text);
        newLine();
    }

    var cursorBlink = function (forceState) {
        if (cursor) {
            var XReal = curX * 8;
            var YReal = curY * fontHeight;
            if (typeof forceState != "undefined") flipflop = forceState;

            if (flipflop) {
                ctx.strokeStyle = "rgba(255,255,255,1)";
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.moveTo(XReal, YReal + 13);
                ctx.lineTo(XReal + 8, YReal + 13);
                ctx.stroke();

                flipflop = false;

            } else {
                ctx.strokeStyle = "rgba(0,0,0,1)";
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.moveTo(XReal, YReal + 13);
                ctx.lineTo(XReal + 80, YReal + 13); // ugly hack to clear any cursor remnants
                ctx.stroke();

                flipflop = true;
            }

        }
    }

    var initInput = function (inputSource) {
        inputSource.addEventListener("keydown", function (evt) {
            if (!interactive) return;
            evt.preventDefault();

            if (evt.keyCode >= 48 && evt.keyCode <= 90) {

                // letters & numbers

                var inLetter = "";
                if (shiftState)
                    inLetter = String.fromCharCode(evt.keyCode);

                else
                    inLetter = String.fromCharCode(evt.keyCode).toLowerCase();
                print(inLetter);
                inputBuffer += inLetter;

            } else {
                switch (evt.keyCode) {
                    case 8: // backspace
                        if (curX > prompt.length) {
                            curX--;
                            print(" ");
                            curX--;
                            cursorBlink();
                            inputBuffer = inputBuffer.substring(0, inputBuffer.length - 1);
                        }
                        break;
                    case 13: //enter

                        newLine();
                        if (inputBuffer.length > 0) {
                            onCommand(inputBuffer);
                        }

                        inputBuffer = "";

                        if (shellInputHandler && !applicationInputHandler) doPrompt();
                        break;
                    case 16: // shift
                        shiftState = true;
                        break;
                    case 32: // space
                        print(" ");
                        inputBuffer += " ";
                        break;
                    case 190:
                        print(".");
                        break;
                }
            }

        });

        document.addEventListener("keyup", function (evt) {
                if (!interactive) return;
                switch (evt.keyCode) {
                    case 16:
                        shiftState = false;
                        break;
                    case 186:
                        !shiftState ? print(";") : print(":");
                        break;
                }
            }
        );
    }

    var setPrompt = function (newPrompt) {
        prompt = newPrompt;
    }

    var setCursor = function (state) {
        cursor = state;
    }

    var init = function (config) {
        if (!config.font) throw "font missing from config";
        if (!config.fontHeight) throw "fontHeight missing from config";
        if (!config.canvas) throw "canvas missing from config";

        initCanvas(config.canvas);

        initCharSet(config.font, config.fontHeight);
        fontHeight = config.fontHeight;

        (config.lines) ? maxY = config.lines : maxY = Math.floor(ctx.canvas.height / fontHeight) - 1;
        (config.columns) ? maxX = config.columns : maxX = Math.floor(ctx.canvas.width / 8) - 1;


        initInput(config.inputSource ? config.inputSourse : document);

        if (config.interactive) {

            if (config.commandHandler) shellInputHandler = config.commandHandler;

            if (config.prompt) {
                setPrompt(config.prompt);
            }

            if (config.beforeInteractive) {
                config.beforeInteractive();
            }

            doPrompt();

        } else {
            cursor = false;
        }
        interactive = config.interactive;
        window.setInterval(cursorBlink, 500);

    }

    var input = function (inputPrompt, resultHandler) {
        var oldPrompt = prompt;

        applicationInputHandler =
            function (oldPrompt) {
                return function (value) {
                    interactive = false;
                    setPrompt(oldPrompt);
                    applicationInputHandler = null;
                    resultHandler(value);
                    if (shellInputHandler)
                        interactive = true;
                }
            }(prompt);

        interactive = true;
        setPrompt(inputPrompt);

        doPrompt();

    }

    var locate = function (col, row) {
        if (col)
        curX = col < maxX ? col : 0;
        if (row)
        curY = row < maxY ? row : 0;
    }

    return {
        init: init,
        print: print,
        println: println,
        input: input,
        locate: locate,
        cls: cls,
        chr: chr,
        color: color,
        setPrompt: setPrompt,
        setCursor: setCursor
    }

}();