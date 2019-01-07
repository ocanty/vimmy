
namespace Vimmy
{
	export namespace Assembler
	{
		/**
		 * Container class for operand data, this contains the values and information stored in an operand
		 */
		export abstract class Operand
		{
			private type: Spec.OperandType
			private data: Array<number>

			/**
			 *
			 * @param type The operand type
			 * @param specialVal The data stored in it, typically a const, register 
			 */
			constructor(type: Spec.OperandType, data: Array<number>)
			{
				this.type = type
				this.data = data
			}

			/**
			 * Returns the type of the operand
			 */
			getType() : Spec.OperandType
			{
				return this.type
			}

			/**
			 * Returns the encoded type of the operand
			 */
			abstract getEncode(): Spec.OperandTypeEncoded

			/**
			 * Returns the data array of the operand
			 */
			getData(): Array<number> { return this.data }
		}

		export class OperandRegister extends Operand
		{
			/**
			 * 
			 * @param register The register specified by the operand
			 */
			constructor(register: Spec.Register)
			{
				super(Spec.OperandType.Register, [register])
			}

			getRegister(): Spec.Register { return this.getData()[0] }

			getEncode() : Spec.OperandTypeEncoded { return Spec.OperandTypeEncoded.Register }
		}

		export class OperandConst extends Operand
		{
			/**
			 * 
			 * @param constant The constant value specified by the operand
			 */
			constructor(constant: number)
			{
				super(Spec.OperandType.Constant, [constant])
			}
			getConstant(): number { return this.getData()[0] }

			getEncode(): Spec.OperandTypeEncoded { return Spec.OperandTypeEncoded.Constant }
		}

		export enum OperandMemoryType
		{
			Register = <number>Spec.OperandTypeEncoded.Memory_Register,
			Constant = <number>Spec.OperandTypeEncoded.Memory_Constant,
			RegisterDisplacement = <number>Spec.OperandTypeEncoded.Memory_RegisterDisplacement,
		}

		export class OperandMemory extends Operand
		{
			private memType: OperandMemoryType

			private displacement: number
			private register: Spec.Register

			constructor(memType: OperandMemoryType)
			{
				super(Spec.OperandType.Memory, [])

				this.register = 0
				this.memType = memType
			}

			getMemType(): OperandMemoryType { return this.memType }

			getDisplacement() : number { return this.displacement }
			setDisplacement(displacement: number) { this.displacement = displacement }

			getRegister(): Spec.Register { return this.register }
			setRegister(register: Spec.Register) { this.register = register }


			getEncode(): Spec.OperandTypeEncoded
			{
				return <Spec.OperandTypeEncoded><number>this.memType;
			}
		}
	}
}