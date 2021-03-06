
/// <reference path="../Spec/Spec.ts"/>
/// <reference path="Operand.ts"/>
/// <reference path="Instruction.ts"/>
/// <reference path="Codec.ts"/>
/// <reference path="../ROM.ts"/>
/// <reference path="../Utilities.ts"/>

namespace Vimmy
{
  export namespace Assembler
  {
    /**
     * The type of a compiler message
     */
    enum CompileMessageType { Info, Warning, Error };

    /**
     * Compiler message structure
     */
    class CompileMessage
    {
      /**
       *
       * @param type The type of message
       * @param msg The message text
       */
      constructor(type: CompileMessageType, msg: string)
      {
        this.type = type
        this.message = msg
      }

      type: CompileMessageType
      message: string
    }

    /**
     * The result of a compilation
     */
    export class CompileResult
    {
      /**
       *
       * @param error Error status, set to true if an error occured during compilation
       * @param compileMessages An array of CompileMessages which were pushed during compilation
       * @param rom The ROM generated by the compiler
       */
      constructor(error: boolean, compileMessages: Array<CompileMessage>, rom: Vimmy.ROM)
      {
        this.error = error
        this.compileMessages = compileMessages
        this.ROM = rom
      }

      private error: boolean
      private compileMessages: Array<CompileMessage>
      private ROM: Vimmy.ROM

      /**
       * Returns true if the compilation was successful
       */
      successful(): boolean { return !this.error }

      /**
       * Returns an array of messages pushed during compilation
       */
      getConsoleOutput(): Array<CompileMessage> { return this.compileMessages }

      /**
       * Returns the ROM created during compilation, this could be invalid or incomplete if the compilation failed
       */
      getROM(): Vimmy.ROM { return this.ROM }
    }


    /**
     * The Vimmy compiler
     */
    export class Compiler
    {
      constructor() { }

      private compileMessages: Array<CompileMessage> = []
      private pushMessage(msg: CompileMessage) { this.compileMessages.push(msg) }
      private pushInfo(msg: string)
      {
        console.log(msg)
        this.pushMessage(new CompileMessage(CompileMessageType.Info, msg))
      }

      private pushWarning(msg: string)
      {
        console.log(msg)
        this.pushMessage(new CompileMessage(CompileMessageType.Warning, msg))
      }

      /**
       * Pushes an error message and stops compilation
       * @param msg Message text
       */
      private haltError(msg: string)
      {
        console.log(msg)
        this.pushMessage(new CompileMessage(CompileMessageType.Error, msg))

        throw new Error(msg);
      }

      private error: boolean = false

      /* ---- Token Input ---- */

      private tokens: TokenStream
      private tokenPtr: number = 0

      /* ---- ROM Output ---- */
      private romSize: number = 0
      private rom: Uint8Array = new Uint8Array(0xFFFF-0xFFF)
      private romPtr: number = 0

      // The address the module is loaded into the VM, defaults to ROM base
      private moduleBase: number = Spec.getROMBase();

      /**
       * BROKEN Sets an 16-bit value in the rom
       * @param location Address in ROM
       * @param value 16-bit value
       */
      private setRom16(location: number, value: number)
      {
        if (this.rom.length > (location + 1))
        {
          this.rom[location] = value >> 8
          this.rom[location + 1] = value & 0x00FF
        }
      }

      /**
      * Sets an 8-bit value in the rom
      * @param location Address in ROM
      * @param value 8-bit value
      */
      private setRom8(location: number, value: number)
      {
        if (this.rom.length > location) { this.rom[location] = value }
      }

      /* ---- Label Support ---- */

      // label compilation is done to determine the positions of sections
      // when labels are referred to before they are found by the compiler
      // this is done by running a compile with all blank labels, to find their locations
      // we then redo the compile and add their values
      private isLabelCompile: boolean = false
      private labels: { [labelName: string]: number; } = {}

      /**
       * Adds a label addr reference to be used during compilation. This may be a location such as "start" or a variable
       * @param labelName The name of the label used in the assembler
       * @param labelAddr The address the label points to in the ROM
       */
      private addLabel(labelName: string, labelAddr: number)
      {
        if (this.labels.hasOwnProperty(labelName))
        {
          // Overwrite and warn
          this.pushWarning("Label overwrite on " + labelName + " near line " + (this.tokens.getLine(this.tokenPtr)))
        }

        this.labels[labelName] = labelAddr
      }

      /**
       * Returns the full address (not relative) of the label
       * @param labelName The name of the label used in the assembler
       */
      private getLabel(labelName: string): number
      {
        if(this.isLabelCompile){ return 0x0000 }

        if (this.labels.hasOwnProperty(labelName))
        {
          // ret addr
          return this.labels[labelName]
        }
        else
        {
          this.haltError("Missing label " + labelName);
          return 0;
        }
      }

      private compileTime: Date
      /**
       * Compiles vASM and returns a CompileResult structure
       * @param tokens A token-stream structure
       */
      compile(tokens : TokenStream, isLabelCompile? : boolean, additionalLabels?: { [labelName: string]: number; } ) : CompileResult
      {
        try
        {
          this.tokens = tokens
          this.compileMessages = [ ]

          this.isLabelCompile = isLabelCompile
          if(this.isLabelCompile)
          {
             this.compileTime = new Date();
             this.romSize = 0
             this.labels = additionalLabels || { }
          }

          this.tokenPtr = 0
          this.error = false
          this.pushInfo("Beginning compilation...")
          this.rom = new Uint8Array(this.romSize || (0xFFFF-0xFFF))
          this.romPtr = 4 // Preserve space for jmp <code> at start of rom
          this.moduleBase = 0x4000

          // if this is true, ignore all code and act as if its a comment
          let is_in_comment = false
          let lasttoken = ""
          for (this.tokenPtr = this.tokenPtr; this.tokenPtr < this.tokens.getNumTokens(); this.tokenPtr++)
          {
            let skip_token = false
            console.log(this.tokens.getType(this.tokenPtr))

            // allow repeated new lines
            if(lasttoken == "TERMINATE" && this.tokens.getType(this.tokenPtr) == "TERMINATE")
            {
              console.log("repeat")
              lasttoken = this.tokens.getType(this.tokenPtr)
              this.tokenPtr++
              continue;
            }

            if(is_in_comment && this.tokens.getType(this.tokenPtr) == "TERMINATE")
            {
              is_in_comment = false
              console.log("out of comment")
              this.tokenPtr++
            }

            if(this.tokens.getType(this.tokenPtr) == "COLON")
            {
              console.log("got comment")
              is_in_comment = true
            }

            if(!is_in_comment &&  this.tokens.getType(this.tokenPtr) !="TERMINATE")
            {
              // Catch section labels, "main:"
              if (this.tokens.getType(this.tokenPtr) == "LABEL")
              {
                var id = this.tokens.getID(this.tokenPtr)

                if (id.charAt(id.length - 1) == ":") // check if its actually a section label, ending with :
                {
                  // Remove COLON
                  var no_semi = id.substring(0, id.length - 1)

                  // Push to labels, + module base
                  this.addLabel(no_semi, this.moduleBase +this.romPtr)
                  this.pushInfo("Entered section " + no_semi + " near line " + (this.tokens.getLine(this.tokenPtr)))
                  skip_token = true // Dont compile this token as we already processed it
                }
              }

              if (!skip_token)
              {
                let encodedInstruction = this.compileInstruction()
                //console.log(encodedInstruction)
                //Vimmy.Utilities.printHex(encodedInstruction)
                // this.pushInfo(Vimmy.Utilities.asHex(encodedInstruction))

                for (var k in encodedInstruction)
                {
                  var encode = encodedInstruction[k]

                  this.rom[this.romPtr] = encode
                  this.romPtr+=1
                }
              }
            }
          }

          // put in trampoline to user code to skip their data
          let userCode = this.getLabel("start")
          //console.log(userCode)
          this.setRom8(0, Spec.getOpSpec("JMP").getOpCode()) // JMP
          this.setRom8(1, 0x20) // Operand types
          this.setRom8(2, userCode >> 8) // Entrypoint Address
          this.setRom8(3, userCode & 0x00FF)
          //Vimmy.Utilities.printHex(this.rom)
        }
        catch (err)
        {
          this.error = true
          this.pushMessage(new CompileMessage(CompileMessageType.Error, err));
        }

        if(this.isLabelCompile)
        {
          this.isLabelCompile = false
          this.romSize = this.romPtr
          return this.compile(tokens,this.isLabelCompile)
        }
        else
        {
          if(!this.error)
          {
            this.pushInfo("Compilation successful...\n(" + ((new Date().getTime()-this.compileTime.getTime())/1000) + "s)")

          }
          else
          {
            // cant use haltError as it throws exception
            this.pushMessage(new CompileMessage(CompileMessageType.Error, "Compilation failed!"));
          }

          return new CompileResult(
            this.error,
            this.compileMessages,
            new Vimmy.ROM(this.moduleBase,this.rom)
          )
        }
      }

      /**
       * Compiles the instruction at tokenPtr, increments tokenPtr on return
       */
      private compileInstruction() : Uint8Array
      {
        let initial_type = this.tokens.getType(this.tokenPtr)
        let initial_id = this.tokens.getID(this.tokenPtr)

        if (initial_type != "INSTRUCTION")
        {
          this.haltError("No instruction, instead: " + initial_type + " " + initial_id + " found near line " + (this.tokens.getLine(this.tokenPtr)))
        }

        // Processed INSTRUCTION
        this.tokenPtr += 1

        // See if there is operation specification for this instruction, else its not a valid instruction
        let opSpec = Spec.getOpSpec(initial_id)

        //console.log(opSpec)

        // If its valid
        if (opSpec)
        {
          // this.pushInfo("Compiling instruction " + initial_id + " near line " + (this.tokens.getLine(this.tokenPtr)))


          // Get the operand specification and number of operands required
          let numOperands = opSpec.getOperandSpec().getNumOperands()

          //this.pushInfo("    Expected number of operands: " + numOperands.toString())

          // Dump each operand into an array
          let operands : Array<Operand> = [ ]

          for (let i = 0; i < numOperands; i++)
          {
            // check for comma in subsequent operands
            if (i > 0)
            {
              if (this.tokens.getType(this.tokenPtr) != "COMMA")
              {
                this.haltError("    No comma seperating operands near line " + (this.tokens.getLine(this.tokenPtr)))
              }

              this.tokenPtr += 1
            }

            // Get and check if this operand is valid
            let operandData = this.getOperand()

            operands.push(operandData)
          }

          // Check if the instruction was terminated by a newline or a comment
          // see above comment checking in compile for information

          try
          {
            let instruction = new Instruction(opSpec, operands)
            //this.pushInfo("    Instruction was valid, encoding into binary!")
            return encodeInstruction(instruction);

          }
          catch (err)
          {
            this.haltError(err + (this.tokens.getLine(this.tokenPtr)))
          }

        }

        this.haltError("Invalid instruction " + initial_type + " " + initial_id + " found near line " + (this.tokens.getLine(this.tokenPtr)))
      }

      /**
       * Gets OperandData for operand at tokenPtr, increments tokenPtr on return
       */
      private getOperand(): Operand
      {
        let operand_pos = this.tokenPtr

        let initial_type = this.tokens.getType(this.tokenPtr)
        let initial_id = this.tokens.getID(this.tokenPtr)

        switch (initial_type)
        {
          case "REGISTER":
            this.tokenPtr += 1

            return new OperandRegister(Spec.getRegister(initial_id));

          case "NUMBER":
            this.tokenPtr += 1

            return new OperandConst(parseInt(initial_id, 10));

          case "LABEL":
            this.tokenPtr += 1
            //console.log("label ", this.getLabel(initial_id))
            return new OperandConst(this.getLabel(initial_id));

          case "MINUS":
            this.tokenPtr += 1
            if (this.tokens.getType(this.tokenPtr) == "NUMBER")
            {
              this.tokenPtr += 1
              return new OperandConst(-parseInt(this.tokens.getID(this.tokenPtr-1), 10));
            }


          // Memory addressing, eg [ ]
          case "LEFTBRACKET":
            this.tokenPtr += 1

            /*
              Check bracket length
              tokenPtr offsets

              -1      0      +1
               [ <something> ]

              -1      0          +1          +2      +3
               [ <something> <something> <something> ]
            */

            // [ <something> ]
            if (this.tokens.getType(this.tokenPtr + 1) == "RIGHTBRACKET")
            {
              let centerToken = this.tokens.getType(this.tokenPtr)
              let centerTokenID = this.tokens.getID(this.tokenPtr)

              this.tokenPtr += 2

              var ret = null

              switch (centerToken)
              {
                case "NUMBER":
                  ret = new OperandMemory(OperandMemoryType.Constant)
                  ret.setDisplacement(parseInt(centerTokenID,10))
                  return ret

                case "REGISTER":
                  ret = new OperandMemory(OperandMemoryType.Register)
                  ret.setRegister(Spec.getRegister(centerTokenID))
                  return ret

                case "LABEL":
                  ret = new OperandMemory(OperandMemoryType.Constant)
                  ret.setDisplacement(this.getLabel(centerTokenID))
                  return ret
              }

            }
            // [ <something> <something> <something> ]
            else if (this.tokens.getType(this.tokenPtr + 3) == "RIGHTBRACKET")
            {
              let checkStr = this.tokens.getTypeSegment(this.tokenPtr, this.tokenPtr + 3)
              let firstID = this.tokens.getID(this.tokenPtr)
              let number = this.tokens.getID(this.tokenPtr+2)
              this.tokenPtr += 4

              var ret = null

              //console.log(checkStr)
              switch (checkStr)
              {
                case "REGISTERPLUSNUMBER":
                  if (parseInt(number, 10) > 0xFFF) { this.haltError("    Register memory offset greater than 0xFFF (4095) at line " + (this.tokens.getLine(this.tokenPtr))) }
                  ret = new OperandMemory(OperandMemoryType.RegisterDisplacement)
                  ret.setRegister(Spec.getRegister(firstID))
                  ret.setDisplacement(parseInt(number, 10))
                  return ret

                case "REGISTERMINUSNUMBER":
                  if (parseInt(number, 10) > 0xFFF) { this.haltError("    Register memory offset greater than 0xFFF (4095) at line " + (this.tokens.getLine(this.tokenPtr))) }
                  ret = new OperandMemory(OperandMemoryType.RegisterDisplacement)
                  ret.setRegister(Spec.getRegister(firstID))
                  ret.setDisplacement(-parseInt(number, 10))
                  return ret

                case "LABELPLUSNUMBER":
                  ret = new OperandMemory(OperandMemoryType.Constant)
                  ret.setDisplacement(this.getLabel(firstID) + parseInt(number, 10))
                  return ret

                case "LABELMINUSNUMBER":
                  ret = new OperandMemory(OperandMemoryType.Constant)
                  ret.setDisplacement(this.getLabel(firstID) - parseInt(number, 10))
                  return ret

                case "NUMBERPLUSNUMBER":
                  ret = new OperandMemory(OperandMemoryType.Constant)
                  ret.setDisplacement(parseInt(firstID,10) + parseInt(number, 10))
                  return ret


                case "NUMBERMINUSNUMBER":
                  ret = new OperandMemory(OperandMemoryType.Constant)
                  ret.setDisplacement(parseInt(firstID,10) - parseInt(number, 10))
                  return ret
              }
            }
            else
            {
              this.haltError("    Invalid bracket sequence near line " + (this.tokens.getLine(operand_pos)))
            }

          break;
        }

        this.haltError("    Invalid operand near line " + (this.tokens.getLine(operand_pos)))
        return null
      }
    }
  }
}
