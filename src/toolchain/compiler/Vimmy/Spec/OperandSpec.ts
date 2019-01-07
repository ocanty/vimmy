
namespace Vimmy
{
  export namespace Spec
  {
    /**
     * Operand types
     */
    export enum OperandType
    {
      Register = 0x1, //  r, Register notation: a,b,c, ...
      Constant = 0x2, //  c, Any parseInt(...,10) literal except negatives: 1, 0x1, ...
      Memory   = 0x3, //  m, [literal], [0x100], ...
    }

    /**
     * Operand types which are encoded into binary
     */
    export enum OperandTypeEncoded
    {
      Register                    = 0x1, //  r, Register notation: a,b,c, ...
      Constant                    = 0x2, //  c, Any parseInt(...,10) literal except negatives: 1, 0x1, ...
      Memory_Register             = 0x3, //  [reg]
      Memory_RegisterDisplacement = 0x4, //  [reg+offset] [reg-offset]
      Memory_Constant             = 0x5  //  [number]
    }

    /**
     * Generates an operand support array from a set of shorthand operand strings
     * Example: "rr", "rm"
     * @param strings The inputted strings
     */
    export function OperandTypeSH(...strings: string[]): Array< Array < OperandType > >
    {
      let sh = strings
      let ret = [ ]

      for (var k in sh)
      {
        let str = sh[k]

        let tt = [ ]

        for (let i = 0; i < str.length; i++)
        {
          switch (str.charAt(i))
          {
            case "r": tt.push(OperandType.Register); break;
            case "c": tt.push(OperandType.Constant); break;
            case "m": tt.push(OperandType.Memory); break;
          }
        }

        ret.push(tt)
      }

      return ret;
    }

    /**
     * Specification class for the types supported by an operation, OpSpec uses these to verify that instruction operand types are correct.
     */
    export class OperandSpec
    {
      private numOperands: number
      private supportArray: Array<Array<OperandType>>

      /**
       *
       * @param numOperands The number of operands, typically 1 or 2
       * @param array An array of OperandTypeGeneral arrays containing the operand pairs, r = reg, m = mem, c = const,
       *              Example (for a two operand instruction): [ ["r", "r"], ["r", "m"], ["r","c"] ]
       *
       */
      constructor(numOperands: number, array: Array<Array<OperandType>>)
      {
        this.numOperands = numOperands;
        this.supportArray = array;
      }

      /**
       * Returns the number of operands
       */
      getNumOperands(): number { return this.numOperands }

      /**
       * Compares against an operand type array and returns true if the operand specification allows these types
       * @param checkPair The operand type array
       */
      isValidOperands(checkPair: Array<OperandType>): boolean
      {
        if(this.numOperands == 0) return true;
        for (var k in this.supportArray)
        {
          //console.log(this.supportArray[k], checkPair)
          if (this.supportArray[k].toString() == checkPair.toString()) return true
        }
        return false
      }
    }
  }
}
