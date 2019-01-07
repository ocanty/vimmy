
namespace Vimmy
{
  export namespace Assembler
  {
    /**
     * Container class for an instruction generated during compilation
     */
    export class Instruction
    {
      private instructionLength: number = 0
      private opSpec: Spec.OpSpec
      private operands: Array<Operand>

      /**
       * Returns the operation specification of the instruction
       */
      getOpSpec(): Spec.OpSpec { return this.opSpec }

      /**
       * Returns the operand data of the instruction
       */
      getOperands(): Array<Operand> { return this.operands }

      /**
       *
       * @param opSpec The operation specification for the instruction
       * @param operands An array of operand data used by the instruction
       * @throws {Error} Invalid operand types near line
       * @throws {Error} Invalid number of operands for instruction near line
       */
      constructor(opSpec : Spec.OpSpec, operands : Array<Operand>)
      {
        let operandSpec = opSpec.getOperandSpec()

        if (operands.length == operandSpec.getNumOperands())
        {
          // Build general comparison array, to check operand types
          let checkArray: Array<Spec.OperandType> = []
          for (let k in operands)
          {
            let operand = operands[k]
            checkArray.push(operand.getType())
          }

          if (operandSpec.isValidOperands(checkArray))
          {
            // yay
            this.opSpec = opSpec
            this.operands = operands
          }
          else
          {
            throw new Error("    Invalid operand types near line ")
          }
        }
        else
        {
           throw new Error("    Invalid number of operands for instruction near line ")
        }

      }
    }

  }
}
