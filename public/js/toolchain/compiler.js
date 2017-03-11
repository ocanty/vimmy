(function () {
    "use strict";
})();
var Vimmy;
(function (Vimmy) {
    var Assembler;
    (function (Assembler) {
        /**
         * A stream of tokens
         */
        var TokenStream = (function () {
            /**
             * @param type An array of types, eg: "REGISTER"
             * @param id An array of ids that match the previous location, eg: "A"
             * @param line An array of numbers that match the previous location, eg: 5
             */
            function TokenStream(type, id, line) {
                this.type = type;
                this.id = id;
                this.line = line;
                this.numTokens = this.type.length;
            }
            /**
             * Returns the number of tokens in the stream
             */
            TokenStream.prototype.getNumTokens = function () { return this.numTokens; };
            /**
             * Returns the type of a token at the specified location
             * @param pos The location of the token
             */
            TokenStream.prototype.getType = function (pos) {
                if (this.type.hasOwnProperty(pos.toString())) {
                    return this.type[pos];
                }
                throw new Error("TokenStream: Attempted to get a token type at invalid position " + pos + " at last assumed line " + this.getLine(this.line.length - 1));
            };
            /**
             * Returns the id of a token at the specified location
             * @param pos The location of the token
             */
            TokenStream.prototype.getID = function (pos) {
                if (this.id.hasOwnProperty(pos.toString())) {
                    return this.id[pos];
                }
                throw new Error("TokenStream: Attempted to get a token id at invalid position " + pos + " at last assumed line " + this.getLine(this.line.length - 1));
            };
            /**
             * Returns the line number of a token at the specified location
             * @param pos The location of the token
             */
            TokenStream.prototype.getLine = function (pos) {
                // account for editor drift, editor starts at line 1 rather than 0
                if (this.line.hasOwnProperty(pos.toString())) {
                    return this.line[pos];
                }
                throw new Error("TokenStream: Attempted to get line at invalid position " + pos);
            };
            /**
             * Returns a concatenated string of the type array at the specified locations
             * @param start Start token
             * @param end End token
             */
            TokenStream.prototype.getTypeSegment = function (start, end) {
                return this.type.slice(start, end).join("");
            };
            return TokenStream;
        }());
        Assembler.TokenStream = TokenStream;
    })(Assembler = Vimmy.Assembler || (Vimmy.Assembler = {}));
})(Vimmy || (Vimmy = {}));
/// <reference path="TokenStream.ts"/>
var Vimmy;
(function (Vimmy) {
    var Assembler;
    (function (Assembler) {
        /**
         * A tokenizer searches for a string of tokens specified by a TokenSpec
         */
        var Tokenizer = (function () {
            function Tokenizer() {
                this.setSpec(Vimmy.Spec.getTokenSpec());
            }
            /**
             * Set the TokenSpec of the tokenizer
             * @param spec The TokenSpec to follow when searching for tokens in the future
             */
            Tokenizer.prototype.setSpec = function (spec) {
                this.tokenTree = spec.getTree();
            };
            Tokenizer.isPunctuation = function (character) {
                return (character == " " || character == "," || character == "[" || character == "]" || character == "-" || character == "+" || character == "\n" || character == "\r");
            };
            /**
             * Tokenizes the text inputted, returning a TokenStream, newlines are processed as the token "TERMINATION"
             * @param text_input
             */
            Tokenizer.prototype.tokenize = function (text_input) {
                // Ported from javascript (vimmy-old/vimmy__)
                // Attach a newline to the input so label sequences will terminate properly (see below)
                text_input = text_input + " \n";
                // First we will build an object of tokens indexed by their line, this will be used later when showing errors
                // Example:
                // output[0] = [ "sometoken", "anothertoken"]
                var output = {};
                var cur_line_number = 0;
                output[cur_line_number] = [];
                // We plan to walk the tree matching each character until we reach .head, if we do we push its token to the output
                // If we dont get any matches we ignore special characters and assume it is a label sequence
                // The current ref to the tree position is stored in state
                // The lexeme is the buffer of characters
                var state = this.tokenTree;
                var lexeme = "";
                var insideLabelSequence = false;
                // Go through every character
                for (var i = 0; i < text_input.length + 1; i++) {
                    var character = text_input.charAt(i);
                    var char_code = character.charCodeAt(0);
                    // Custom text handled here, if we are in a label sequence
                    if (insideLabelSequence) {
                        state = this.tokenTree; // Reset root every time for future searches, this will also terminate the sequence
                        // Label is terminated by punctuation, eg: " " , [ ], or newlines 
                        if (Tokenizer.isPunctuation(character)) {
                            insideLabelSequence = false; // turn it off
                            // Now we process what we collected before we got here
                            // See it if it is processable as a number
                            var n = parseInt(lexeme);
                            //console.log(lexeme)
                            if (!isNaN(parseInt(lexeme))) {
                                // console.log("NUMBER_".concat(n))
                                output[cur_line_number].push("NUMBER_" + n.toString());
                            }
                            else {
                                // console.log("LABEL_".concat(lexeme))
                                output[cur_line_number].push("LABEL_".concat(lexeme));
                            }
                            // Reset the lexeme
                            lexeme = "";
                        }
                    }
                    // Now we check 
                    // Discard unprintable characters, allow newlines
                    if (char_code > 31 && char_code < 127 || char_code == 10) {
                        // If its not a space, then add to lexeme
                        if (char_code > 32)
                            lexeme += character;
                        // Push terminate token on new lines
                        if (char_code == 10) {
                            output[cur_line_number].push("TERMINATE");
                            // Add an array for the next line number
                            cur_line_number++;
                            output[cur_line_number] = [];
                            // Reset
                            state = this.tokenTree;
                            lexeme = "";
                        }
                        // console.log(character,state)
                        // If the current node has a child, and that child has a root element (.head)
                        if (state.hasOwnProperty(character) && state[character].hasOwnProperty(".head") && !insideLabelSequence) {
                            if (lexeme.length != 1) {
                                // console.log(state[character][0])
                                output[cur_line_number].push(state[character][".head"]); // Push token
                                // Reset
                                state = this.tokenTree;
                                lexeme = "";
                            }
                            else {
                                var next_char = text_input.charAt(i + 1);
                                // console.log("Single symbol token found: nextchar" , next_char)
                                // We need to figure out if this lexeme is length 1 or just the first character of another lexeme
                                // Therefore check the next character
                                if (state[character].hasOwnProperty(next_char)) {
                                    state = state[character];
                                }
                                else if (Tokenizer.isPunctuation(character) || Tokenizer.isPunctuation(next_char)) {
                                    // console.log(state[character][0])
                                    output[cur_line_number].push(state[character][".head"]); // Push token
                                    // Reset
                                    state = this.tokenTree;
                                    lexeme = "";
                                }
                                else {
                                    insideLabelSequence = true;
                                }
                            }
                        }
                        else if (typeof (state[character]) == "object" && !insideLabelSequence) {
                            state = state[character];
                        }
                        else if (char_code > 32) {
                            insideLabelSequence = true;
                        }
                    }
                }
                console.log("LEXED ::", output);
                // Now lets turn our line based array object into a TokenStream
                var arr_type = [];
                var arr_id = [];
                var arr_ln = [];
                for (var line in output) {
                    var line_tokenstream = output[line];
                    for (i = 0; i < line_tokenstream.length; i++) {
                        var token = output[line][i];
                        // lexer dumps info like INSTRUCTION_PUSH, LABEL_add_function:, etc..
                        // split the _ and push the seperate info to a type and id table, make sure to only split from the first _ (!!)
                        var token_deduce = token.split("_");
                        // console.log(token_deduce)
                        var type = token_deduce[0];
                        var id = token.substring(token_deduce[0].length + 1, token.length);
                        // example: REGISTER_A (line 5)
                        // push REGISTER, push A, push 5
                        arr_type.push(type);
                        arr_id.push(id);
                        arr_ln.push(line);
                    }
                }
                console.log(new Assembler.TokenStream(arr_type, arr_id, arr_ln));
                return new Assembler.TokenStream(arr_type, arr_id, arr_ln);
            };
            return Tokenizer;
        }());
        Assembler.Tokenizer = Tokenizer;
    })(Assembler = Vimmy.Assembler || (Vimmy.Assembler = {}));
})(Vimmy || (Vimmy = {}));
var Vimmy;
(function (Vimmy) {
    var Spec;
    (function (Spec) {
        /**
         * Operand types
         */
        var OperandType;
        (function (OperandType) {
            OperandType[OperandType["Register"] = 1] = "Register";
            OperandType[OperandType["Constant"] = 2] = "Constant";
            OperandType[OperandType["Memory"] = 3] = "Memory";
        })(OperandType = Spec.OperandType || (Spec.OperandType = {}));
        /**
         * Operand types which are encoded into binary
         */
        var OperandTypeEncoded;
        (function (OperandTypeEncoded) {
            OperandTypeEncoded[OperandTypeEncoded["Register"] = 1] = "Register";
            OperandTypeEncoded[OperandTypeEncoded["Constant"] = 2] = "Constant";
            OperandTypeEncoded[OperandTypeEncoded["Memory_Register"] = 3] = "Memory_Register";
            OperandTypeEncoded[OperandTypeEncoded["Memory_RegisterDisplacement"] = 4] = "Memory_RegisterDisplacement";
            OperandTypeEncoded[OperandTypeEncoded["Memory_Constant"] = 5] = "Memory_Constant"; //  [number]
        })(OperandTypeEncoded = Spec.OperandTypeEncoded || (Spec.OperandTypeEncoded = {}));
        /**
         * Generates an operand support array from a set of shorthand operand strings
         * Example: "rr", "rm"
         * @param strings The inputted strings
         */
        function OperandTypeSH() {
            var strings = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                strings[_i] = arguments[_i];
            }
            var sh = strings;
            var ret = [];
            for (var k in sh) {
                var str = sh[k];
                var tt = [];
                for (var i = 0; i < str.length; i++) {
                    switch (str.charAt(i)) {
                        case "r":
                            tt.push(OperandType.Register);
                            break;
                        case "c":
                            tt.push(OperandType.Constant);
                            break;
                        case "m":
                            tt.push(OperandType.Memory);
                            break;
                    }
                }
                ret.push(tt);
            }
            return ret;
        }
        Spec.OperandTypeSH = OperandTypeSH;
        /**
         * Specification class for the types supported by an operation, OpSpec uses these to verify that instruction operand types are correct.
         */
        var OperandSpec = (function () {
            /**
             *
             * @param numOperands The number of operands, typically 1 or 2
             * @param array An array of OperandTypeGeneral arrays containing the operand pairs, r = reg, m = mem, c = const,
             *              Example (for a two operand instruction): [ ["r", "r"], ["r", "m"], ["r","c"] ]
             *
             */
            function OperandSpec(numOperands, array) {
                this.numOperands = numOperands;
                this.supportArray = array;
            }
            /**
             * Returns the number of operands
             */
            OperandSpec.prototype.getNumOperands = function () { return this.numOperands; };
            /**
             * Compares against an operand type array and returns true if the operand specification allows these types
             * @param checkPair The operand type array
             */
            OperandSpec.prototype.isValidOperands = function (checkPair) {
                if (this.numOperands == 0)
                    return true;
                for (var k in this.supportArray) {
                    //console.log(this.supportArray[k], checkPair)
                    if (this.supportArray[k].toString() == checkPair.toString())
                        return true;
                }
                return false;
            };
            return OperandSpec;
        }());
        Spec.OperandSpec = OperandSpec;
    })(Spec = Vimmy.Spec || (Vimmy.Spec = {}));
})(Vimmy || (Vimmy = {}));
var Vimmy;
(function (Vimmy) {
    var Spec;
    (function (Spec) {
        /**
         * Specification class that contains information about an operation
         */
        var OpSpec = (function () {
            /**
             *
             * @param mneomic The mneomic used in the assembler
             * @param encode The 2-byte encoded opcode value,
             * @param operand_support An OperandSpec containing the operands that the instruction will support
             */
            function OpSpec(mneomic, encode, operand_support) {
                this.mnemonic = mneomic;
                this.encode = encode;
                this.operandSpec = operand_support;
            }
            /**
             * Returns the mneomic used by the assembler for this instruction
             */
            OpSpec.prototype.getMneomic = function () { return this.mnemonic; };
            /**
             * Returns the encoded value used for this instruction when assembled
             */
            OpSpec.prototype.getOpCode = function () { return this.encode; };
            /**
             * Returns the OperandSpec containing the operands supported by this instruction
             */
            OpSpec.prototype.getOperandSpec = function () { return this.operandSpec; };
            return OpSpec;
        }());
        Spec.OpSpec = OpSpec;
    })(Spec = Vimmy.Spec || (Vimmy.Spec = {}));
})(Vimmy || (Vimmy = {}));
var Vimmy;
(function (Vimmy) {
    var Assembler;
    (function (Assembler) {
        // deepmerge by Zachary Murray (dremelofdeath) CC-BY-SA 3.0,
        // TODO: rewrite to tell CC-BY-SA to fuck off
        function deepmerge(foo, bar) {
            var merged = {};
            for (var each in bar) {
                if (foo.hasOwnProperty(each) && bar.hasOwnProperty(each)) {
                    if (typeof (foo[each]) == "object" && typeof (bar[each]) == "object") {
                        merged[each] = deepmerge(foo[each], bar[each]);
                    }
                    else {
                        merged[each] = [foo[each], bar[each]];
                    }
                }
                else if (bar.hasOwnProperty(each)) {
                    merged[each] = bar[each];
                }
            }
            for (var each in foo) {
                if (!(each in bar) && foo.hasOwnProperty(each)) {
                    merged[each] = foo[each];
                }
            }
            return merged;
        }
        /**
        * A TokenSpec is a ruleset taken by a Tokenizer to determine what it considers as tokens
        */
        var TokenTree = (function () {
            function TokenTree() {
                this.tree = new Object;
            }
            /**
            * Adds a keyword rule to the token specification
            * @param keyword Keyword that triggers the token to be found, eg: "mov "
            * @param token Token to be returned when the keyword is found, eg: "INSTRUCTION"
            */
            TokenTree.prototype.addKeyword = function (keyword, token) {
                // the root branch
                var obj = {};
                // current branch
                var ref = obj;
                for (var i = 1; i < keyword.length; i++) {
                    var s = keyword.charAt(i);
                    // add a new branch with this character
                    ref[s] = {};
                    // set pointer to the new branch
                    ref = ref[s];
                }
                // set the deepest point to our token
                ref[".head"] = token;
                // Add an object to the base of the tree if it doesnt exist
                if (!this.tree.hasOwnProperty(keyword.charAt(0))) {
                    this.tree[keyword.charAt(0)] = {};
                }
                this.tree[keyword.charAt(0)] = deepmerge(obj, this.tree[keyword.charAt(0)]);
            };
            /**
             * Returns the TokenSpec tree, to be used by a tokenizer
             */
            TokenTree.prototype.getTree = function () { return this.tree; };
            return TokenTree;
        }());
        Assembler.TokenTree = TokenTree;
    })(Assembler = Vimmy.Assembler || (Vimmy.Assembler = {}));
})(Vimmy || (Vimmy = {}));
/// <reference path="OperandSpec.ts"/>
/// <reference path="OpSpec.ts"/>
/// <reference path="../Assembler/TokenTree.ts"/>
var Vimmy;
(function (Vimmy) {
    var Spec;
    (function (Spec) {
        function getRegDictionary() {
            /*
                Map register enum to assembly strings
                We do this because typically casting the javascript output may not work every time as it is implementation detail
            */
            this.regDictionary = this.regDictionary ||
                {
                    /* 16-bit */
                    "A": Register.REGISTER_A,
                    "B": Register.REGISTER_B,
                    "C": Register.REGISTER_C,
                    "D": Register.REGISTER_D,
                    /* 8-bit, hi, lo of 16-bit */
                    "AH": Register.REGISTER_AH,
                    "AL": Register.REGISTER_AL,
                    "BH": Register.REGISTER_BH,
                    "BL": Register.REGISTER_BL,
                    /* Status/Internal*/
                    "PC": Register.REGISTER_PC,
                    "SP": Register.REGISTER_SP,
                    "BP": Register.REGISTER_BP,
                    "SF": Register.REGISTER_SF,
                    "CF": Register.REGISTER_CF
                };
            return this.regDictionary;
        }
        function getOpDictionary() {
            this.opDictionary = this.opDictionary ||
                {
                    "PUSH": new Spec.OpSpec("PUSH", 0x01, new Spec.OperandSpec(1, Spec.OperandTypeSH("r", "m", "c"))),
                    "POP": new Spec.OpSpec("POP", 0x02, new Spec.OperandSpec(1, Spec.OperandTypeSH("r", "m"))),
                    "MOV": new Spec.OpSpec("MOV", 0x03, new Spec.OperandSpec(2, Spec.OperandTypeSH("rr", "rm", "mr", "rc", "mc"))),
                    "JMP": new Spec.OpSpec("JMP", 0x04, new Spec.OperandSpec(1, Spec.OperandTypeSH("r", "m", "c"))),
                    "XCHG": new Spec.OpSpec("XCHG", 0x05, new Spec.OperandSpec(2, Spec.OperandTypeSH("rr", "rm", "mr"))),
                    "LEA": new Spec.OpSpec("XCHG", 0x06, new Spec.OperandSpec(2, Spec.OperandTypeSH("rm", "rc", "rr"))),
                    "ADD": new Spec.OpSpec("ADD", 0x07, new Spec.OperandSpec(2, Spec.OperandTypeSH("rm", "rr", "rc", "mr", "mc"))),
                    "SUB": new Spec.OpSpec("SUB", 0x08, new Spec.OperandSpec(2, Spec.OperandTypeSH("rm", "rr", "rc", "mr", "mc"))),
                    "MUL": new Spec.OpSpec("MUL", 0x09, new Spec.OperandSpec(2, Spec.OperandTypeSH("rm", "rr", "rc", "mr", "mc"))),
                    "DIV": new Spec.OpSpec("DIV", 0x10, new Spec.OperandSpec(2, Spec.OperandTypeSH("rm", "rr", "rc", "mr", "mc"))),
                    "IMUL": new Spec.OpSpec("IMUL", 0x11, new Spec.OperandSpec(2, Spec.OperandTypeSH("rm", "rr", "rc", "mr", "mc"))),
                    "IDIV": new Spec.OpSpec("IDIV", 0x12, new Spec.OperandSpec(2, Spec.OperandTypeSH("rm", "rr", "rc", "mr", "mc"))),
                    "IN": new Spec.OpSpec("IN", 0x13, new Spec.OperandSpec(2, Spec.OperandTypeSH("rr", "rc"))),
                    "OUT": new Spec.OpSpec("OUT", 0x14, new Spec.OperandSpec(2, Spec.OperandTypeSH("rr", "cr"))),
                    "CALL": new Spec.OpSpec("CALL", 0x15, new Spec.OperandSpec(1, Spec.OperandTypeSH("r", "m", "c"))),
                    "RET": new Spec.OpSpec("RET", 0x16, new Spec.OperandSpec(0, Spec.OperandTypeSH())),
                    "JE": new Spec.OpSpec("JE", 0x17, new Spec.OperandSpec(1, Spec.OperandTypeSH("r", "m", "c"))),
                    "JNE": new Spec.OpSpec("JNE", 0x18, new Spec.OperandSpec(1, Spec.OperandTypeSH("r", "m", "c"))),
                    "JZ": new Spec.OpSpec("JZ", 0x19, new Spec.OperandSpec(1, Spec.OperandTypeSH("r", "m", "c"))),
                    "JG": new Spec.OpSpec("JG", 0x20, new Spec.OperandSpec(1, Spec.OperandTypeSH("r", "m", "c"))),
                    "JGE": new Spec.OpSpec("JGE", 0x21, new Spec.OperandSpec(1, Spec.OperandTypeSH("r", "m", "c"))),
                    "JL": new Spec.OpSpec("JL", 0x22, new Spec.OperandSpec(1, Spec.OperandTypeSH("r", "m", "c"))),
                    "JLE": new Spec.OpSpec("JLE", 0x23, new Spec.OperandSpec(1, Spec.OperandTypeSH("r", "m", "c")))
                };
            return this.opDictionary;
        }
        /*
            Encoded register values
            When adding new registers, you MUST prefix with REGISTER_
        */
        var Register;
        (function (Register) {
            /* 16-bit */
            Register[Register["REGISTER_A"] = 1] = "REGISTER_A";
            Register[Register["REGISTER_B"] = 2] = "REGISTER_B";
            Register[Register["REGISTER_C"] = 3] = "REGISTER_C";
            Register[Register["REGISTER_D"] = 4] = "REGISTER_D";
            /* 8-bit, hi, lo of 16-bit */
            Register[Register["REGISTER_AH"] = 5] = "REGISTER_AH";
            Register[Register["REGISTER_AL"] = 6] = "REGISTER_AL";
            Register[Register["REGISTER_BH"] = 7] = "REGISTER_BH";
            Register[Register["REGISTER_BL"] = 8] = "REGISTER_BL";
            /* Status/Internal*/
            Register[Register["REGISTER_PC"] = 15] = "REGISTER_PC";
            Register[Register["REGISTER_SP"] = 14] = "REGISTER_SP";
            Register[Register["REGISTER_BP"] = 13] = "REGISTER_BP";
            Register[Register["REGISTER_SF"] = 12] = "REGISTER_SF";
            Register[Register["REGISTER_CF"] = 11] = "REGISTER_CF";
        })(Register = Spec.Register || (Spec.Register = {}));
        /**
         * Returns the base address that the BIOS rom is loaded into
         */
        function getBIOSBase() { return 0x100; }
        Spec.getBIOSBase = getBIOSBase;
        /**
         * Returns base address that the rom is loaded into
         */
        function getROMBase() { return 0xFFF; }
        Spec.getROMBase = getROMBase;
        function getTokenSpec() {
            this.tokenSpec = this.tokenSpec || (function () {
                this.tokenSpec = new Vimmy.Assembler.TokenTree;
                // Add registers
                for (var reg in getRegDictionary()) {
                    this.tokenSpec.addKeyword(reg.toLowerCase(), "REGISTER_" + reg.toUpperCase());
                }
                // Add operations
                for (var k in getOpDictionary()) {
                    var op = getOpDictionary()[k];
                    if (op.getOperandSpec().getNumOperands() == 0) {
                        this.tokenSpec.addKeyword(op.getMneomic().toLowerCase(), "INSTRUCTION_" + op.getMneomic().toUpperCase());
                    }
                    else {
                        this.tokenSpec.addKeyword(op.getMneomic().toLowerCase() + " ", "INSTRUCTION_" + op.getMneomic().toUpperCase());
                    }
                }
                // Procedures
                //this.tokenSpec.addKeyword("proc ", "START_PROCEDURE")
                //this.tokenSpec.addKeyword("endp ", "END_PROCEDURE")
                // COMMENTS
                this.tokenSpec.addKeyword(";", "SEMICOLON");
                // Operators & punctuation
                this.tokenSpec.addKeyword(",", "COMMA");
                this.tokenSpec.addKeyword("[", "LEFTBRACKET");
                this.tokenSpec.addKeyword("]", "RIGHTBRACKET");
                this.tokenSpec.addKeyword("+", "PLUS");
                this.tokenSpec.addKeyword("-", "MINUS");
                return this.tokenSpec;
            })();
            console.log(this.tokenSpec);
            return this.tokenSpec;
        }
        Spec.getTokenSpec = getTokenSpec;
        /**
         * Returns the OpSpec object for the selected op
         * @param mneomic The mneomic of the op
         */
        function getOpSpec(mneomic) {
            if (getOpDictionary().hasOwnProperty(mneomic))
                return getOpDictionary()[mneomic];
            return null;
        }
        Spec.getOpSpec = getOpSpec;
        /**
         * Returns the code of the inputted register
         * @param name The name of the register
         */
        function getRegister(name) {
            if (getRegDictionary().hasOwnProperty(name))
                return getRegDictionary()[name];
            return -1;
        }
        Spec.getRegister = getRegister;
    })(Spec = Vimmy.Spec || (Vimmy.Spec = {}));
})(Vimmy || (Vimmy = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Vimmy;
(function (Vimmy) {
    var Assembler;
    (function (Assembler) {
        /**
         * Container class for operand data, this contains the values and information stored in an operand
         */
        var Operand = (function () {
            /**
             *
             * @param type The operand type
             * @param specialVal The data stored in it, typically a const, register
             */
            function Operand(type, data) {
                this.type = type;
                this.data = data;
            }
            /**
             * Returns the type of the operand
             */
            Operand.prototype.getType = function () {
                return this.type;
            };
            /**
             * Returns the data array of the operand
             */
            Operand.prototype.getData = function () { return this.data; };
            return Operand;
        }());
        Assembler.Operand = Operand;
        var OperandRegister = (function (_super) {
            __extends(OperandRegister, _super);
            /**
             *
             * @param register The register specified by the operand
             */
            function OperandRegister(register) {
                return _super.call(this, Vimmy.Spec.OperandType.Register, [register]) || this;
            }
            OperandRegister.prototype.getRegister = function () { return this.getData()[0]; };
            OperandRegister.prototype.getEncode = function () { return Vimmy.Spec.OperandTypeEncoded.Register; };
            return OperandRegister;
        }(Operand));
        Assembler.OperandRegister = OperandRegister;
        var OperandConst = (function (_super) {
            __extends(OperandConst, _super);
            /**
             *
             * @param constant The constant value specified by the operand
             */
            function OperandConst(constant) {
                return _super.call(this, Vimmy.Spec.OperandType.Constant, [constant]) || this;
            }
            OperandConst.prototype.getConstant = function () { return this.getData()[0]; };
            OperandConst.prototype.getEncode = function () { return Vimmy.Spec.OperandTypeEncoded.Constant; };
            return OperandConst;
        }(Operand));
        Assembler.OperandConst = OperandConst;
        var OperandMemoryType;
        (function (OperandMemoryType) {
            OperandMemoryType[OperandMemoryType["Register"] = Vimmy.Spec.OperandTypeEncoded.Memory_Register] = "Register";
            OperandMemoryType[OperandMemoryType["Constant"] = Vimmy.Spec.OperandTypeEncoded.Memory_Constant] = "Constant";
            OperandMemoryType[OperandMemoryType["RegisterDisplacement"] = Vimmy.Spec.OperandTypeEncoded.Memory_RegisterDisplacement] = "RegisterDisplacement";
        })(OperandMemoryType = Assembler.OperandMemoryType || (Assembler.OperandMemoryType = {}));
        var OperandMemory = (function (_super) {
            __extends(OperandMemory, _super);
            function OperandMemory(memType) {
                var _this = _super.call(this, Vimmy.Spec.OperandType.Memory, []) || this;
                _this.register = 0;
                _this.memType = memType;
                return _this;
            }
            OperandMemory.prototype.getMemType = function () { return this.memType; };
            OperandMemory.prototype.getDisplacement = function () { return this.displacement; };
            OperandMemory.prototype.setDisplacement = function (displacement) { this.displacement = displacement; };
            OperandMemory.prototype.getRegister = function () { return this.register; };
            OperandMemory.prototype.setRegister = function (register) { this.register = register; };
            OperandMemory.prototype.getEncode = function () {
                return this.memType;
            };
            return OperandMemory;
        }(Operand));
        Assembler.OperandMemory = OperandMemory;
    })(Assembler = Vimmy.Assembler || (Vimmy.Assembler = {}));
})(Vimmy || (Vimmy = {}));
var Vimmy;
(function (Vimmy) {
    var Assembler;
    (function (Assembler) {
        /**
         * Container class for an instruction generated during compilation
         */
        var Instruction = (function () {
            /**
             *
             * @param opSpec The operation specification for the instruction
             * @param operands An array of operand data used by the instruction
             * @throws {Error} Invalid operand types near line
             * @throws {Error} Invalid number of operands for instruction near line
             */
            function Instruction(opSpec, operands) {
                this.instructionLength = 0;
                var operandSpec = opSpec.getOperandSpec();
                if (operands.length == operandSpec.getNumOperands()) {
                    // Build general comparison array, to check operand types
                    var checkArray = [];
                    for (var k in operands) {
                        var operand = operands[k];
                        checkArray.push(operand.getType());
                    }
                    if (operandSpec.isValidOperands(checkArray)) {
                        // yay
                        this.opSpec = opSpec;
                        this.operands = operands;
                    }
                    else {
                        throw new Error("    Invalid operand types near line ");
                    }
                }
                else {
                    throw new Error("    Invalid number of operands for instruction near line ");
                }
            }
            /**
             * Returns the operation specification of the instruction
             */
            Instruction.prototype.getOpSpec = function () { return this.opSpec; };
            /**
             * Returns the operand data of the instruction
             */
            Instruction.prototype.getOperands = function () { return this.operands; };
            return Instruction;
        }());
        Assembler.Instruction = Instruction;
    })(Assembler = Vimmy.Assembler || (Vimmy.Assembler = {}));
})(Vimmy || (Vimmy = {}));
var Vimmy;
(function (Vimmy) {
    var Assembler;
    (function (Assembler) {
        /**
         * Encodes a single instruction and returns binary encoded as a Uint8Array
         * @param ins
         */
        function encodeInstruction(ins) {
            var operands = ins.getOperands();
            var bufPtr = 0;
            var output = new Uint8Array(14); // the max possible instruction size is 14, we will resize this at the end so we dont return junk
            // encode opcode (AB)
            output[bufPtr] = ins.getOpSpec().getOpCode();
            bufPtr += 1;
            output[1] = 0xFF;
            // encode operand types if operands exist
            if (operands.length > 0) {
                // encode left and right operand type (CD)
                // shift first type left (eg: 0xF << 4 = 0xF0) and add right if it exists else add 0
                output[bufPtr] = (ins.getOperands()[0].getEncode() << 4) + (ins.getOperands().length > 1 ? ins.getOperands()[1].getEncode() : 0);
                bufPtr += 1;
            }
            else {
                // no operands
                output[bufPtr] == 0x00;
                bufPtr += 1;
            }
            // encode data
            var registers_included = false;
            var registers = [];
            var displacement_included = false;
            var displacement = 0;
            var immediate_included = false;
            var immediate = 0;
            for (var k in operands) {
                var operand = operands[k];
                switch (operand.getType()) {
                    case Vimmy.Spec.OperandType.Constant:
                        immediate_included = true;
                        immediate = operand.getConstant();
                        break;
                    case Vimmy.Spec.OperandType.Register:
                        registers_included = true;
                        registers[k] = operand.getRegister();
                        break;
                    case Vimmy.Spec.OperandType.Memory:
                        var memOperand = operand;
                        switch (memOperand.getMemType()) {
                            // eg: [0x100]
                            case Assembler.OperandMemoryType.Constant:
                                displacement_included = true;
                                displacement = memOperand.getDisplacement();
                                registers[k] = 0; // invalidate the register so the the base will be 0
                                break;
                            // eg: [a]
                            case Assembler.OperandMemoryType.Register:
                                registers_included = true;
                                registers[k] = memOperand.getRegister();
                                break;
                            // eg: [a+0x100]
                            case Assembler.OperandMemoryType.RegisterDisplacement:
                                registers_included = true;
                                registers[k] = memOperand.getRegister();
                                displacement_included = true;
                                displacement = memOperand.getDisplacement();
                                break;
                        }
                        break;
                }
            }
            // if dst reg is set, src reg must be set even if it is not used
            // set src to itself if it already was set before or 0
            registers[1] = registers[1] || 0;
            // encode registers
            if (registers_included) {
                console.log("reg_included", registers[0], registers[1]);
                output[bufPtr] = (registers[0] << 4) + registers[1];
                bufPtr += 1;
            }
            // encode displacement
            if (displacement_included) {
                console.log("disp_included", displacement);
                output[bufPtr] = displacement >> 8;
                output[bufPtr + 1] = displacement & 0xFF;
                bufPtr += 2;
            }
            // encode displacement
            if (immediate_included) {
                console.log("imm_included", immediate);
                output[bufPtr] = immediate >> 8;
                output[bufPtr + 1] = immediate & 0xFF;
                bufPtr += 2;
            }
            return new Uint8Array(output.buffer, 0, bufPtr);
        }
        Assembler.encodeInstruction = encodeInstruction;
    })(Assembler = Vimmy.Assembler || (Vimmy.Assembler = {}));
})(Vimmy || (Vimmy = {}));
var Vimmy;
(function (Vimmy) {
    /**
     * Container class for binary data loaded into the virtual machine
     */
    var ROM = (function () {
        /**
         *
         * @param moduleBase The default address that the ROM should be loaded into
         * @param binary The binary data
         */
        function ROM(moduleBase, binary) {
            this.moduleBase = moduleBase;
            this.binary = binary;
        }
        /**
         * Get the stored binary data
         */
        ROM.prototype.getBinary = function () { return this.binary; };
        /**
         * Get the default address that the ROM would typically be loaded into
         */
        ROM.prototype.getModuleBase = function () { return this.moduleBase; };
        return ROM;
    }());
    Vimmy.ROM = ROM;
})(Vimmy || (Vimmy = {}));
var Vimmy;
(function (Vimmy) {
    var Utilities;
    (function (Utilities) {
        /**
         * Prints an array into the console as a stream of hex characters
         * @param array The array
         */
        function printHex(array) {
            var str = "";
            for (var k in array) {
                var number = array[k];
                if (number < 0) {
                    number = 0xFFFFFFFF + number + 1;
                }
                str += number.toString(16).toUpperCase() + " ";
            }
            console.log(str);
        }
        Utilities.printHex = printHex;
        function asHex(array) {
            var str = "";
            for (var k in array) {
                var number = array[k];
                if (number < 0) {
                    number = 0xFFFFFFFF + number + 1;
                }
                str += number.toString(16).toUpperCase() + " ";
            }
            return str;
        }
        Utilities.asHex = asHex;
    })(Utilities = Vimmy.Utilities || (Vimmy.Utilities = {}));
})(Vimmy || (Vimmy = {}));
/// <reference path="../Spec/Spec.ts"/>
/// <reference path="Operand.ts"/>
/// <reference path="Instruction.ts"/>
/// <reference path="Codec.ts"/>
/// <reference path="../ROM.ts"/>
/// <reference path="../Utilities.ts"/>
var Vimmy;
(function (Vimmy) {
    var Assembler;
    (function (Assembler) {
        /**
         * The type of a compiler message
         */
        var CompileMessageType;
        (function (CompileMessageType) {
            CompileMessageType[CompileMessageType["Info"] = 0] = "Info";
            CompileMessageType[CompileMessageType["Warning"] = 1] = "Warning";
            CompileMessageType[CompileMessageType["Error"] = 2] = "Error";
        })(CompileMessageType || (CompileMessageType = {}));
        ;
        /**
         * Compiler message structure
         */
        var CompileMessage = (function () {
            /**
             *
             * @param type The type of message
             * @param msg The message text
             */
            function CompileMessage(type, msg) {
                this.type = type;
                this.message = msg;
            }
            return CompileMessage;
        }());
        /**
         * The result of a compilation
         */
        var CompileResult = (function () {
            /**
             *
             * @param error Error status, set to true if an error occured during compilation
             * @param compileMessages An array of CompileMessages which were pushed during compilation
             * @param rom The ROM generated by the compiler
             */
            function CompileResult(error, compileMessages, rom) {
                this.error = error;
                this.compileMessages = compileMessages;
                this.ROM = rom;
            }
            /**
             * Returns true if the compilation was successful
             */
            CompileResult.prototype.successful = function () { return !this.error; };
            /**
             * Returns an array of messages pushed during compilation
             */
            CompileResult.prototype.getConsoleOutput = function () { return this.compileMessages; };
            /**
             * Returns the ROM created during compilation, this could be invalid or incomplete if the compilation failed
             */
            CompileResult.prototype.getROM = function () { return this.ROM; };
            return CompileResult;
        }());
        Assembler.CompileResult = CompileResult;
        /**
         * The Vimmy compiler
         */
        var Compiler = (function () {
            function Compiler() {
                this.compileMessages = [];
                this.error = false;
                this.tokenPtr = 0;
                /* ---- ROM Output ---- */
                this.romSize = 0;
                this.rom = new Uint8Array(0xFFFF - 0xFFF);
                this.romPtr = 0;
                // The address the module is loaded into the VM, defaults to ROM base
                this.moduleBase = Vimmy.Spec.getROMBase();
                /* ---- Label Support ---- */
                // label compilation is done to determine the positions of sections when labels are referred to before they are found by the compiler
                this.isLabelCompile = false;
                this.labels = {};
            }
            Compiler.prototype.pushMessage = function (msg) { this.compileMessages.push(msg); };
            Compiler.prototype.pushInfo = function (msg) {
                console.log(msg);
                this.pushMessage(new CompileMessage(CompileMessageType.Info, msg));
            };
            Compiler.prototype.pushWarning = function (msg) {
                console.log(msg);
                this.pushMessage(new CompileMessage(CompileMessageType.Warning, msg));
            };
            /**
             * Pushes an error message and stops compilation
             * @param msg Message text
             */
            Compiler.prototype.haltError = function (msg) {
                console.log(msg);
                this.pushMessage(new CompileMessage(CompileMessageType.Error, msg));
                throw new Error(msg);
            };
            /**
             * BROKEN Sets an 16-bit value in the rom
             * @param location Address in ROM
             * @param value 16-bit value
             */
            Compiler.prototype.setRom16 = function (location, value) {
                if (this.rom.length > (location + 1)) {
                    this.rom[location] = value >> 8;
                    this.rom[location + 1] = value & 0x00FF;
                }
            };
            /**
            * Sets an 8-bit value in the rom
            * @param location Address in ROM
            * @param value 8-bit value
            */
            Compiler.prototype.setRom8 = function (location, value) {
                if (this.rom.length > location) {
                    this.rom[location] = value;
                }
            };
            /**
             * Adds a label addr reference to be used during compilation. This may be a location such as "start" or a variable
             * @param labelName The name of the label used in the assembler
             * @param labelAddr The address the label points to in the ROM
             */
            Compiler.prototype.addLabel = function (labelName, labelAddr) {
                if (this.labels.hasOwnProperty(labelName)) {
                    // Overwrite and warn
                    this.pushWarning("Label overwrite on " + labelName + " near line " + (this.tokens.getLine(this.tokenPtr)));
                }
                this.labels[labelName] = labelAddr;
            };
            /**
             * Returns the full address (not relative) of the label
             * @param labelName The name of the label used in the assembler
             */
            Compiler.prototype.getLabel = function (labelName) {
                if (this.isLabelCompile) {
                    return 0x0000;
                }
                if (this.labels.hasOwnProperty(labelName)) {
                    // set addr + load base
                    return this.moduleBase + this.labels[labelName];
                }
                else {
                    this.haltError("Missing label " + labelName);
                    return 0;
                }
            };
            /**
             * Compiles vASM and returns a CompileResult structure
             * @param tokens A token-stream structure
             */
            Compiler.prototype.compile = function (tokens, isLabelCompile, additionalLabels) {
                try {
                    this.tokens = tokens;
                    this.compileMessages = [];
                    this.isLabelCompile = isLabelCompile;
                    if (this.isLabelCompile) {
                        this.romSize = 0;
                        this.labels = additionalLabels || {};
                    }
                    this.tokenPtr = 0;
                    this.error = false;
                    this.pushInfo("Beginning compilation...");
                    this.rom = new Uint8Array(this.romSize || (0xFFFF - 0xFFF));
                    this.romPtr = 4; // Preserve space for jmp <code> at start of rom
                    this.moduleBase = 0xFFF;
                    // if this is true, ignore all code and act as if its a comment
                    var is_in_comment = false;
                    var lasttoken = "";
                    for (this.tokenPtr = this.tokenPtr; this.tokenPtr < this.tokens.getNumTokens(); this.tokenPtr++) {
                        var skip_token = false;
                        console.log(this.tokens.getType(this.tokenPtr));
                        // allow repeated new lines
                        if (lasttoken == "TERMINATE" && this.tokens.getType(this.tokenPtr) == "TERMINATE") {
                            console.log("repeat");
                            lasttoken = this.tokens.getType(this.tokenPtr);
                            this.tokenPtr++;
                            continue;
                        }
                        if (is_in_comment && this.tokens.getType(this.tokenPtr) == "TERMINATE") {
                            is_in_comment = false;
                            console.log("out of comment");
                            this.tokenPtr++;
                        }
                        if (this.tokens.getType(this.tokenPtr) == "SEMICOLON") {
                            console.log("got comment");
                            is_in_comment = true;
                        }
                        if (!is_in_comment && this.tokens.getType(this.tokenPtr) != "TERMINATE") {
                            // Catch section labels, "main:"
                            if (this.tokens.getType(this.tokenPtr) == "LABEL") {
                                var id = this.tokens.getID(this.tokenPtr);
                                if (id.charAt(id.length - 1) == ":") {
                                    // Remove semicolon
                                    var no_semi = id.substring(0, id.length - 1);
                                    // Push to labels
                                    this.addLabel(no_semi, this.romPtr);
                                    this.pushInfo("NEW SECTION: " + no_semi + " in binary near line " + (this.tokens.getLine(this.tokenPtr)));
                                    skip_token = true; // Dont compile this token as we already processed it
                                }
                            }
                            if (!skip_token) {
                                var encodedInstruction = this.compileInstruction();
                                //console.log(encodedInstruction)
                                //Vimmy.Utilities.printHex(encodedInstruction)
                                this.pushInfo(Vimmy.Utilities.asHex(encodedInstruction));
                                for (var k in encodedInstruction) {
                                    var encode = encodedInstruction[k];
                                    this.rom[this.romPtr] = encode;
                                    this.romPtr += 1;
                                }
                            }
                        }
                    }
                    // put in trampoline to user code to skip their data
                    var userCode = this.getLabel("start");
                    //console.log(userCode)
                    this.setRom8(0, Vimmy.Spec.getOpSpec("JMP").getOpCode()); // JMP
                    this.setRom8(1, 0x20); // Operand types
                    this.setRom8(2, userCode >> 8); // Entrypoint Address
                    this.setRom8(3, userCode & 0x00FF);
                }
                catch (err) {
                    this.error = true;
                    this.pushMessage(new CompileMessage(CompileMessageType.Error, err));
                }
                if (this.isLabelCompile) {
                    this.isLabelCompile = false;
                    this.romSize = this.romPtr;
                    return this.compile(tokens, this.isLabelCompile);
                }
                else {
                    return new CompileResult(this.error, this.compileMessages, new Vimmy.ROM(this.moduleBase, this.rom));
                }
            };
            /**
             * Compiles the instruction at tokenPtr, increments tokenPtr on return
             */
            Compiler.prototype.compileInstruction = function () {
                var initial_type = this.tokens.getType(this.tokenPtr);
                var initial_id = this.tokens.getID(this.tokenPtr);
                if (initial_type != "INSTRUCTION") {
                    this.haltError("No instruction, instead: " + initial_type + " " + initial_id + " found near line " + (this.tokens.getLine(this.tokenPtr)));
                }
                // Processed INSTRUCTION
                this.tokenPtr += 1;
                // See if there is operation specification for this instruction, else its not a valid instruction
                var opSpec = Vimmy.Spec.getOpSpec(initial_id);
                //console.log(opSpec)
                // If its valid
                if (opSpec) {
                    this.pushInfo("Compiling instruction " + initial_id + " near line " + (this.tokens.getLine(this.tokenPtr)));
                    // Get the operand specification and number of operands required
                    var numOperands = opSpec.getOperandSpec().getNumOperands();
                    this.pushInfo("    Expected number of operands: " + numOperands.toString());
                    // Dump each operand into an array
                    var operands = [];
                    for (var i = 0; i < numOperands; i++) {
                        // check for comma in subsequent operands
                        if (i > 0) {
                            if (this.tokens.getType(this.tokenPtr) != "COMMA") {
                                this.haltError("    No comma seperating operands near line " + (this.tokens.getLine(this.tokenPtr)));
                            }
                            this.tokenPtr += 1;
                        }
                        // Get and check if this operand is valid
                        var operandData = this.getOperand();
                        operands.push(operandData);
                    }
                    // Check if the instruction was terminated by a newline or a comment
                    // see above comment checking in compile for information
                    try {
                        var instruction = new Assembler.Instruction(opSpec, operands);
                        this.pushInfo("    Instruction was valid, encoding into binary!");
                        return Assembler.encodeInstruction(instruction);
                    }
                    catch (err) {
                        this.haltError(err + (this.tokens.getLine(this.tokenPtr)));
                    }
                }
                this.haltError("Invalid instruction " + initial_type + " " + initial_id + " found near line " + (this.tokens.getLine(this.tokenPtr)));
            };
            /**
             * Gets OperandData for operand at tokenPtr, increments tokenPtr on return
             */
            Compiler.prototype.getOperand = function () {
                var operand_pos = this.tokenPtr;
                var initial_type = this.tokens.getType(this.tokenPtr);
                var initial_id = this.tokens.getID(this.tokenPtr);
                switch (initial_type) {
                    case "REGISTER":
                        this.tokenPtr += 1;
                        return new Assembler.OperandRegister(Vimmy.Spec.getRegister(initial_id));
                    case "NUMBER":
                        this.tokenPtr += 1;
                        return new Assembler.OperandConst(parseInt(initial_id, 10));
                    case "LABEL":
                        this.tokenPtr += 1;
                        //console.log("label ", this.getLabel(initial_id))
                        return new Assembler.OperandConst(this.getLabel(initial_id));
                    case "MINUS":
                        this.tokenPtr += 1;
                        if (this.tokens.getType(this.tokenPtr) == "NUMBER") {
                            this.tokenPtr += 1;
                            return new Assembler.OperandConst(-parseInt(this.tokens.getID(this.tokenPtr - 1), 10));
                        }
                    // Memory addressing, eg [ ]
                    case "LEFTBRACKET":
                        this.tokenPtr += 1;
                        /*
                            Check bracket length
                            tokenPtr offsets

                            -1      0      +1
                             [ <something> ]

                            -1      0          +1          +2      +3
                             [ <something> <something> <something> ]
                        */
                        // [ <something> ]
                        if (this.tokens.getType(this.tokenPtr + 1) == "RIGHTBRACKET") {
                            var centerToken = this.tokens.getType(this.tokenPtr);
                            var centerTokenID = this.tokens.getID(this.tokenPtr);
                            this.tokenPtr += 2;
                            var ret = null;
                            switch (centerToken) {
                                case "NUMBER":
                                    ret = new Assembler.OperandMemory(Assembler.OperandMemoryType.Constant);
                                    ret.setDisplacement(parseInt(centerTokenID, 10));
                                    return ret;
                                case "REGISTER":
                                    ret = new Assembler.OperandMemory(Assembler.OperandMemoryType.Register);
                                    ret.setRegister(Vimmy.Spec.getRegister(centerTokenID));
                                    return ret;
                                case "LABEL":
                                    ret = new Assembler.OperandMemory(Assembler.OperandMemoryType.Constant);
                                    ret.setDisplacement(this.getLabel(centerTokenID));
                                    return ret;
                            }
                        }
                        else if (this.tokens.getType(this.tokenPtr + 3) == "RIGHTBRACKET") {
                            var checkStr = this.tokens.getTypeSegment(this.tokenPtr, this.tokenPtr + 3);
                            var firstID = this.tokens.getID(this.tokenPtr);
                            var number = this.tokens.getID(this.tokenPtr + 2);
                            this.tokenPtr += 4;
                            var ret = null;
                            //console.log(checkStr)
                            switch (checkStr) {
                                case "REGISTERPLUSNUMBER":
                                    if (parseInt(firstID, 10) > 0xFFF) {
                                        this.haltError("    Register memory offset greater than 0xFFF (4095) at line " + (this.tokens.getLine(this.tokenPtr)));
                                    }
                                    ret = new Assembler.OperandMemory(Assembler.OperandMemoryType.RegisterDisplacement);
                                    ret.setRegister(Vimmy.Spec.getRegister(firstID));
                                    ret.setDisplacement(parseInt(number, 10));
                                    return ret;
                                case "REGISTERMINUSNUMBER":
                                    if (parseInt(firstID, 10) > 0xFFF) {
                                        this.haltError("    Register memory offset greater than 0xFFF (4095) at line " + (this.tokens.getLine(this.tokenPtr)));
                                    }
                                    ret = new Assembler.OperandMemory(Assembler.OperandMemoryType.RegisterDisplacement);
                                    ret.setRegister(Vimmy.Spec.getRegister(firstID));
                                    ret.setDisplacement(-parseInt(number, 10));
                                    return ret;
                            }
                        }
                        else {
                            this.haltError("    Invalid bracket sequence near line " + (this.tokens.getLine(operand_pos)));
                        }
                        break;
                }
                this.haltError("    Invalid operand near line " + (this.tokens.getLine(operand_pos)));
                return null;
            };
            return Compiler;
        }());
        Assembler.Compiler = Compiler;
    })(Assembler = Vimmy.Assembler || (Vimmy.Assembler = {}));
})(Vimmy || (Vimmy = {}));
/// <reference path="./Vimmy/Assembler/Tokenizer.ts"/>
/// <reference path="./Vimmy/Assembler/Compiler.ts"/>
/* namespace Vimmy
{
    export class AssemblerSimple
    {
        private compiler: Assembler.Compiler
        private tokenizer: Assembler.Tokenizer

        constructor()
        {
            this.compiler = new Assembler.Compiler
            this.tokenizer = new Assembler.Tokenizer
        }

        Assemble(_string: string, labels: any): Assembler.CompileResult
        {
            return this.compiler.compile(this.tokenizer.tokenize(_string.toLowerCase()));
        }
    }
} */ 
