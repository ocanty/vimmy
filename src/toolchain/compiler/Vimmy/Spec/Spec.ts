
/// <reference path="OperandSpec.ts"/>
/// <reference path="OpSpec.ts"/>
/// <reference path="../Assembler/TokenTree.ts"/>

namespace Vimmy
{
	export namespace Spec
	{
		function getRegDictionary() : any
		{
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
			}

			return this.regDictionary
		}

		export function getOpDictionary() : any
		{
			this.opDictionary = this.opDictionary ||
			{
				"PUSH": new OpSpec("PUSH", 0x01, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),
				"POP":  new OpSpec("POP", 0x02, new OperandSpec(1, OperandTypeSH("r", "m"))),
				"MOV":  new OpSpec("MOV", 0x03, new OperandSpec(2, OperandTypeSH("rr", "rm", "mr", "rc", "mc"))),
				"JMP": new OpSpec("JMP", 0x04, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),

				"XCHG": new OpSpec("XCHG", 0x05, new OperandSpec(2, OperandTypeSH("rr", "rm", "mr"))),

				"LEA": new OpSpec("XCHG", 0x06, new OperandSpec(2, OperandTypeSH("rm", "rc", "rr"))),
				"ADD": new OpSpec("ADD", 0x07, new OperandSpec(2, OperandTypeSH("rm", "rr", "rc", "mr", "mc"))),
				"SUB": new OpSpec("SUB", 0x08, new OperandSpec(2, OperandTypeSH("rm", "rr", "rc", "mr", "mc"))),
				
				"MUL": new OpSpec("MUL", 0x09, new OperandSpec(2, OperandTypeSH("rm", "rr", "rc", "mr", "mc"))),
				"DIV": new OpSpec("DIV", 0x10, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),
				
				"IMUL": new OpSpec("IMUL", 0x11, new OperandSpec(2, OperandTypeSH("rm", "rr", "rc", "mr", "mc"))),
				"IDIV": new OpSpec("IDIV", 0x12, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),
				
				"IN":  new OpSpec("IN", 0x13, new OperandSpec(2, OperandTypeSH("rr","rc"))),
				"OUT":  new OpSpec("OUT", 0x14, new OperandSpec(2, OperandTypeSH("rr","cr"))),
				
				"CALL": new OpSpec("CALL", 0x15, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),
				"RET":  new OpSpec("RET", 0x16, new OperandSpec(0, OperandTypeSH())),

				
				"JE":  new OpSpec("JE", 0x17, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),
				"JNE": new OpSpec("JNE", 0x18, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),
				"JZ":  new OpSpec("JZ", 0x19, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),
				"JG":  new OpSpec("JG", 0x20, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),
				"JGE": new OpSpec("JGE", 0x21, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),
				"JL":  new OpSpec("JL", 0x22, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),
				"JLE": new OpSpec("JLE", 0x23, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),
				"CMP": new OpSpec("CMP", 0x24, new OperandSpec(2, OperandTypeSH("rr", "rm", "mr","rc","mc"))),
				"IRET":  new OpSpec("IRET", 0x25, new OperandSpec(0, OperandTypeSH())),
				"DBGHALT":  new OpSpec("DBGHALT", 0x26, new OperandSpec(0, OperandTypeSH())),
				"SETCHAR":  new OpSpec("SETCHAR", 0x27, new OperandSpec(2, OperandTypeSH("rr","rc", "cr"))),
				"GETCHAR":  new OpSpec("GETCHAR", 0x28, new OperandSpec(2, OperandTypeSH("rc","rr", "cr"))),
				
				"MOD":   new OpSpec("MOD", 0x29, new OperandSpec(2, OperandTypeSH("rm","mr","rr","mc","rc"))),
				"TIMER":   new OpSpec("TIMER", 0x30, new OperandSpec(1, OperandTypeSH("r"))),
				 
				"AND":   new OpSpec("AND", 0x31, new OperandSpec(2, OperandTypeSH("rm","mr","rr","mc","rc"))),
				"XOR":   new OpSpec("XOR", 0x32, new OperandSpec(2, OperandTypeSH("rm","mr","rr","mc","rc"))),
				"OR":   new OpSpec("OR", 0x33, new OperandSpec(2, OperandTypeSH("rm","mr","rr","mc","rc"))),
				"NOT":   new OpSpec("NOT", 0x34, new OperandSpec(2, OperandTypeSH("rm","mr","rr","mc","rc"))),
				"TEST":   new OpSpec("TEST", 0x35, new OperandSpec(2, OperandTypeSH("rm","mr","rr","mc","rc"))),
				"LOOP":  new OpSpec("LOOP", 0x36, new OperandSpec(1, OperandTypeSH("r", "m", "c"))),
				"RAND":  new OpSpec("RAND", 0x37, new OperandSpec(2, OperandTypeSH("rc","rm","rr"))),
				"STRCAT":  new OpSpec("STRCAT", 0x38, new OperandSpec(2, OperandTypeSH("rr","cr","rc"))),
				"STRLEN":  new OpSpec("STRLEN", 0x39, new OperandSpec(2, OperandTypeSH("rr","rc"))),
				"STRCPY":  new OpSpec("STRCPY", 0x40, new OperandSpec(2, OperandTypeSH("rr","cr","rc"))),
				"STRCMP":  new OpSpec("STRCMP", 0x41, new OperandSpec(2, OperandTypeSH("rr","cr","rc")))
				
				
				
			}

			return this.opDictionary
		}

		/*
			Encoded register values
			When adding new registers, you MUST prefix with REGISTER_
		*/
		export enum Register
		{
			/* 16-bit */
			REGISTER_A = 0x1,
			REGISTER_B = 0x2,
			REGISTER_C = 0x3,
			REGISTER_D = 0x4,

			/* 8-bit, hi, lo of 16-bit */
			REGISTER_AH = 0x5,
			REGISTER_AL = 0x6,
			REGISTER_BH = 0x7,
			REGISTER_BL = 0x8,

			/* Status/Internal*/
			REGISTER_PC = 0xF,
			REGISTER_SP = 0xE,
			REGISTER_BP = 0xD,
			REGISTER_SF = 0xC,
			REGISTER_CF = 0xB
		}

		/**
		 * Returns the base address that the BIOS rom is loaded into
		 */
		export function getBIOSBase(): number { return 0x100 }

		/**
		 * Returns base address that the rom is loaded into
		 */
		export function getROMBase(): number { return 0xFFF }

		export function getTokenSpec(): Assembler.TokenTree
		{
			this.tokenSpec = this.tokenSpec || (function ()
			{
				this.tokenSpec = new Assembler.TokenTree;

				// Add registers
				for (var reg in getRegDictionary())
				{
					this.tokenSpec.addKeyword(reg.toLowerCase(), "REGISTER_" + reg.toUpperCase())
				}

				// Add operations
				for (var k in getOpDictionary())
				{
					var op = getOpDictionary()[k]
					
					if(op.getOperandSpec().getNumOperands() == 0)
					{
						this.tokenSpec.addKeyword(op.getMneomic().toLowerCase(), "INSTRUCTION_" + op.getMneomic().toUpperCase())
					}
					else
					{
						 this.tokenSpec.addKeyword(op.getMneomic().toLowerCase() + " ", "INSTRUCTION_" + op.getMneomic().toUpperCase())
					}
					

				}

				// Procedures
				//this.tokenSpec.addKeyword("proc ", "START_PROCEDURE")
				//this.tokenSpec.addKeyword("endp ", "END_PROCEDURE")
				
				// COMMENTS
				this.tokenSpec.addKeyword(";", "COLON")

				// Operators & punctuation
				this.tokenSpec.addKeyword(",", "COMMA")
				this.tokenSpec.addKeyword("[", "LEFTBRACKET")
				this.tokenSpec.addKeyword("]", "RIGHTBRACKET")
				this.tokenSpec.addKeyword("+", "PLUS")
				this.tokenSpec.addKeyword("-", "MINUS")
				
				return this.tokenSpec
			})()
			console.log(this.tokenSpec)
			return this.tokenSpec
		}

		/**
		 * Returns the OpSpec object for the selected op
		 * @param mneomic The mneomic of the op
		 */
		export function getOpSpec(mneomic: string): OpSpec
		{
			if (getOpDictionary().hasOwnProperty(mneomic)) return getOpDictionary()[mneomic]

			return null;
		}

		/**
		 * Returns the code of the inputted register
		 * @param name The name of the register
		 */
		export function getRegister(name: string): Register
		{
			if (getRegDictionary().hasOwnProperty(name)) return getRegDictionary()[name]

			return -1;
		}
	}
}