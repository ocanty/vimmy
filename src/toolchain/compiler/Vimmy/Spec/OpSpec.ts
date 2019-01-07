
namespace Vimmy
{
	export namespace Spec
	{
		/**
		 * Specification class that contains information about an operation
		 */
		export class OpSpec
		{
			private mnemonic: string
			private encode: number
			private operandSpec: OperandSpec

			/**
			 * 
			 * @param mneomic The mneomic used in the assembler
			 * @param encode The 2-byte encoded opcode value, 
			 * @param operand_support An OperandSpec containing the operands that the instruction will support
			 */
			constructor(mneomic: string, encode: number, operand_support: OperandSpec)
			{
				this.mnemonic = mneomic
				this.encode = encode
				this.operandSpec = operand_support
			}

			/**
			 * Returns the mneomic used by the assembler for this instruction
			 */
			getMneomic(): string { return this.mnemonic }

			/**
			 * Returns the encoded value used for this instruction when assembled
			 */
			getOpCode(): number { return this.encode }

			/**
			 * Returns the OperandSpec containing the operands supported by this instruction
			 */
			getOperandSpec(): OperandSpec { return this.operandSpec }
		}
	}
}