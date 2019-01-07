
namespace Vimmy
{
	export namespace Assembler
	{
		/**
		 * Encodes a single instruction and returns binary encoded as a Uint8Array
		 * @param ins
		 */
		export function encodeInstruction(ins: Instruction) : Uint8Array
		{
			let operands = ins.getOperands()

			let bufPtr = 0
			let output = new Uint8Array(14) // the max possible instruction size is 14, we will resize this at the end so we dont return junk

			// encode opcode (AB)
			output[bufPtr] = ins.getOpSpec().getOpCode();
			bufPtr += 1

			output[1] = 0xFF;

			// encode operand types if operands exist
			if (operands.length > 0)
			{
				// encode left and right operand type (CD)
				// shift first type left (eg: 0xF << 4 = 0xF0) and add right if it exists else add 0
				output[bufPtr] = (ins.getOperands()[0].getEncode() << 4) + (ins.getOperands().length > 1 ? ins.getOperands()[1].getEncode() : 0)
				bufPtr += 1
			}
	    else
	    {
		    // no operands
	    	output[bufPtr] == 0x00
		    bufPtr += 1
	    }

			// encode data
			let registers_included = false
			let registers = []

			let displacement_included = false
			let displacement = 0

			let immediate_included = false
			let immediate = 0
  
	    // setup types 
			for (var k in operands)
			{
			  let operand = operands[k]

				switch (operand.getType())
				{
					case Spec.OperandType.Constant:
						immediate_included = true
						immediate = (<OperandConst>operand).getConstant()
					break;

					case Spec.OperandType.Register:
						registers_included = true
						registers[k] = (<OperandRegister>operand).getRegister()
					break;

					case Spec.OperandType.Memory:
						let memOperand = (<OperandMemory>operand)

						switch(memOperand.getMemType())
						{
							// eg: [0x100]
							case OperandMemoryType.Constant:
								displacement_included = true
								displacement = memOperand.getDisplacement()

								registers[k] = 0 // invalidate the register so the the base will be 0
							break;

							// eg: [a]
							case OperandMemoryType.Register:
								registers_included = true
								registers[k] = memOperand.getRegister()
							break;

							// eg: [a+0x100]
							case OperandMemoryType.RegisterDisplacement:
								registers_included = true
								registers[k] = memOperand.getRegister()

								displacement_included = true
								displacement = memOperand.getDisplacement()
							break;
						}
					break;
				}
			}

			// if dst reg is set, src reg must be set even if it is not used
			// set src to itself if it already was set before or 0
			registers[1] = registers[1] || 0

			// encode registers
			if (registers_included)
			{
				console.log("reg_included", registers[0], registers[1])
				output[bufPtr] = (registers[0] << 4) + registers[1]
				bufPtr += 1
			}

			// encode displacement
			if (displacement_included)
			{
				console.log("disp_included", displacement)
				output[bufPtr]   = displacement >> 8
				output[bufPtr+1] = displacement & 0xFF
				bufPtr += 2
			}

			// encode displacement
			if (immediate_included)
			{
				console.log("imm_included", immediate)
				output[bufPtr] = immediate >> 8
				output[bufPtr + 1] = immediate & 0xFF
				bufPtr += 2
			}

			return new Uint8Array(output.buffer,0,bufPtr)
		}
	}
}