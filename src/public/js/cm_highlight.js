/* CodeMirror syntax highlignting for vimmy ASM based on x86 "gas" highlighter */

CodeMirror.defineMode("gas", function(_config, parserConfig) {
	'use strict';

	// If an architecture is specified, its initialization function may
	// populate this array with custom parsing functions which will be
	// tried in the event that the standard functions do not find a match.
	var custom = [];

	// The symbol used to start a line comment changes based on the target
	// architecture.
	// If no architecture is pased in "parserConfig" then only multiline
	// comments will have syntax support.
	var lineCommentStartSymbol = ";";

	// These directives are architecture independent.
	// Machine specific directives should go in their respective
	// architecture initialization function.
	// Reference:
	// http://sourceware.org/binutils/docs/as/Pseudo-Ops.html#Pseudo-Ops
	var directives = {
		"out": "builtin"
	};

	var registers = {};
	var op_dict = { }

	
	function x86(_parserConfig) {
		lineCommentStartSymbol = ";";
		
		registers.a = "variable";
		registers.b = "variable";
		registers.c = "variable";
		registers.d = "variable";
		
		registers.bp = "variable";
		registers.sp = "variable";
		registers.pc = "variable";
		registers.sf = "variable";
	}



	x86(parserConfig);


	function nextUntilUnescaped(stream, end) {
		var escaped = false,
			next;
		while ((next = stream.next()) != null) {
			if (next === end && !escaped) {
				return false;
			}
			escaped = !escaped && next === "\\";
		}
		return escaped;
	}

	function clikeComment(stream, state) {
		var maybeEnd = false,
			ch;
		while ((ch = stream.next()) != null) {
			if (ch === "/" && maybeEnd) {
				state.tokenize = null;
				break;
			}
			maybeEnd = (ch === "*");
		}
		return "comment";
	}

	return {
		startState: function() {
			return {
				tokenize: null
			};
		},

		token: function(stream, state) {
			if (state.tokenize) {
				return state.tokenize(stream, state);
			}

			if (stream.eatSpace()) {
				return null;
			}

			var style, cur, ch = stream.next();
 
			if (ch === "/") {
				if (stream.eat("*")) {
					state.tokenize = clikeComment;
					return clikeComment(stream, state);
				}
			}

			if (ch === lineCommentStartSymbol) {
				stream.skipToEnd();
				return "comment";
			}

			if (ch === '"') {
				nextUntilUnescaped(stream, '"');
				return "string";
			}


			if (ch === '[') {
				return "bracket";
			}

			if (ch === ']') {
				return "bracket";
			}

			if (/\d/.test(ch)) {
				if (ch === "0" && stream.eat("x")) {
					stream.eatWhile(/[0-9a-fA-F]/);
					return "number";
				}
				stream.eatWhile(/\d/);
				return "number";
			}

			if (/\w/.test(ch)) {
				stream.eatWhile(/\w/);
				if (stream.eat(":")) {
					return 'tag';
				}
				cur = stream.current().toLowerCase();
				
				if(Vimmy && Vimmy.Spec && Vimmy.Spec.getOpDictionary)
				{
					op_dict = Object.keys(Vimmy.Spec.getOpDictionary())
					if(op_dict.indexOf(cur.toUpperCase())>-1)
					{
						return "variable-2"
					}
				}
				
				style = registers[cur];
				return style || null;
			}

			for (var i = 0; i < custom.length; i++) {
				style = custom[i](ch, stream, state);
				if (style) {
					return style;
				}
			}
		},

		lineComment: lineCommentStartSymbol,
		blockCommentStart: "",
		blockCommentEnd: ""
	};
});