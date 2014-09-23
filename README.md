dostoy
======

A silly interactive retro console library for the HTML5 canvas<br>
Make a fake DOS prompt or draw some ASCII/ANSI art.

Live: http://www.toolsley.com/dos.html

Prerequisites
-------------

### A font

Google "fntcol16.zip"<br>
One-by-one these fonts are in the public-domain.<br>
Or you can use the one supplied with the demos<br>

### A canvas

Make an HTML page with a canvas

Usage
-----

### Interactive Mode
Prompt, cursor, input, command interpreter

```js
	dostoy.init({
		font: window.atob("your font in base64"), // or Uint8Array with font data
		fontHeight: 14, // or appropriate for font
		canvas: document.getElementById("your-canvas-id"),
		interactive:true,
		beforeInteractive: function() {
			dostoy.println("Some welcome message");
		},
		prompt: "C:\\>",
		commandHandler : function(command) {
			switch(command) {
				case "ver":
					dostoy.println("Fake Dos 1.0");
				break;
				default:
					dostoy.println("Bad command or filename");
			}
		}
	});
```

### Non-Interactive Mode
Manual output without input

```js
	dostoy.init({
		font: window.atob("your font in base64"), // or Uint8Array with font data
		fontHeight: 14, // or appropriate for font
		canvas: document.getElementById("your-canvas-id"),
		interactive:false,
	});
	dostoy.println("Hello World");
```

### Reference

print(text)<br>
println(text)<br>
input(prompt,function(input))<br>
locate(col,row)<br>
chr(charcodes) - this also prints. charcodes can be a single ascii code or a comma separated list<br>
cls()<br>
setCursor(true/false)<br>
setPrompt(text)<br>
color(bg,fg) - see color code table at http://en.wikibooks.org/wiki/QBasic/Text_Output#Color_by_Number)
<br>
Etc
---

License: MIT

Known issues: Grossly incomplete input handler among other things

There's a tremendous amount of room for improvement but as a toy and simple demo it provides enough
mild entertainment as-is. Might be useful for April Fools pages or similar.

Pull requests are welcome if you make something more involved with it and improve on it in the process.
