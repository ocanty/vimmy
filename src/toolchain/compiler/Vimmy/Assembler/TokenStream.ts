
(function () { "use strict"; })();

namespace Vimmy
{
	export namespace Assembler
	{
		/**
		 * A stream of tokens
		 */
		export class TokenStream
		{
			private type: Array<string>
			private id: Array<string>
			private line: Array<number>

			private numTokens: number

			/**
			 * @param type An array of types, eg: "REGISTER"
			 * @param id An array of ids that match the previous location, eg: "A"
			 * @param line An array of numbers that match the previous location, eg: 5
			 */
			constructor(type: Array<string>, id: Array<string>, line: Array<number>)
			{
				this.type = type;
				this.id = id;
				this.line = line;

				this.numTokens = this.type.length
			}

			/**
			 * Returns the number of tokens in the stream
			 */
			getNumTokens(): number { return this.numTokens }

			/**
			 * Returns the type of a token at the specified location
			 * @param pos The location of the token
			 */
			getType(pos: number): string
			{
				if (this.type.hasOwnProperty(pos.toString()))
				{
					return this.type[pos]
				}

				throw new Error("TokenStream: Attempted to get a token type at invalid position " + pos + " at last assumed line " + this.getLine(this.line.length - 1));
			}

			/**
			 * Returns the id of a token at the specified location
			 * @param pos The location of the token
			 */
			getID(pos: number): string
			{
				if (this.id.hasOwnProperty(pos.toString()))
				{
					return this.id[pos]
				}

				throw new Error("TokenStream: Attempted to get a token id at invalid position " + pos + " at last assumed line " + this.getLine(this.line.length - 1));
			}

			/**
			 * Returns the line number of a token at the specified location
			 * @param pos The location of the token
			 */
			getLine(pos: number): number
			{
				// account for editor drift, editor starts at line 1 rather than 0
				if (this.line.hasOwnProperty(pos.toString()))
				{
					return this.line[pos]
				}

				throw new Error("TokenStream: Attempted to get line at invalid position " + pos);
			}

			/**
			 * Returns a concatenated string of the type array at the specified locations
			 * @param start Start token
			 * @param end End token
			 */
			getTypeSegment(start: number, end: number): string
			{
				return this.type.slice(start, end).join("")
			}
		}
	}
}