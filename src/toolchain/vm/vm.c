
#include "vm.h"
#include "operands.h"
#include "memory.h"
#include "operations.h"

#ifdef _WIN32
#include <Windows.h>
#else
#include <unistd.h>
#endif

#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include "hardware/gpu.h"
#include "hardware/interrupter.h"
#include "hardware/keyboard.h"

void vm_default_panic_handler(char* s)
{
    printf("%s",s);
    abort();
}

void vm_default_post_cycle_hook(void)
{

}


vm_state* EXPORT vm_init()
{
    printf("VM init\n");
    vm_state* vm = (vm_state*)malloc(sizeof(vm_state));
    memset(vm, 0, sizeof(vm_state));

    vm_register_panic_handler(vm,vm_default_panic_handler);

    vm->m_Mem = (uint8_t*)malloc(0xFFFF + 1);
    memset(vm->m_Mem, 0x00, 0xFFFF + 1);

    // Register hardware
    vmhw_interrupter_init(vm->m_IOPorts, vm->m_Mem);
    vm_register_hardware(vm, VMHW_INTERRUPTER_HWID, &vmhw_interrupter_think);

    vmhw_keyboard_init(vm->m_IOPorts, vm->m_Mem);
    vm_register_hardware(vm, VMHW_KEYBOARD_HWID, &vmhw_keyboard_think);

    vmhw_gpu_init(vm->m_IOPorts, vm->m_Mem);
    vm_register_hardware(vm, VMHW_GPU_HWID, &vmhw_gpu_think);


    srand(time(NULL));

    // Reset
    vm_reset(vm);

    return vm;
}

void vm_register_hardware(vm_state* vm, uint8_t hwid, vm_hardwarefunc_t thinkfunc)
{
    vm->m_HardwareThinkFuncs[hwid] = thinkfunc;
}

void vm_register_panic_handler(vm_state * vm, void(*panic_func)(char*))
{
    vm->m_Panic = (vm_panic_handler_t)panic_func;
    //abort();
}

void vm_register_post_cycle_hook(vm_state * vm, void(*panic_func)(void))
{
    vm->m_PostCycle = (vm_post_cycle_hook_t)panic_func;
    //abort();
}

vm_status EXPORT vm_get_status(vm_state * vm)
{
    return vm->m_Status;
}

void EXPORT vm_set_status(vm_state * vm, vm_status status)
{
    vm->m_Status = status;
}

// Determines if the VM should execute the next instruction
// We use this to do step/step, pauses & restarts
static bool vm_should_cycle(vm_state* vm)
{
    switch (vm->m_Status)
    {
    case Paused:
        return FALSE;
        break;

    case StepOne:
        // Return to run 1 instruction and leave the vm paused
        vm->m_Status = Paused;
        return TRUE;
        break;

    case StepAll:
        // Run until interrupted
        return TRUE;
        break;
    }

    // Dont run the vm for invalid statuses
    return FALSE;
}

void EXPORT vm_reset(vm_state* vm)
{
    printf("Resetting vm...\n");

    // Clear memory
    memset(vm->m_Mem, 0x00, 0xFFFF + 1);

    // Clear registers
    for (int i = 0; i < 17; i++)
    {
        vm->m_Reg[i] = 0;
    }

    // Clear I/O ports
    for (int i = 0; i < 0xFF; i++)
    {
        vm->m_IOPorts[i] = 0;
    }

    // Set PC to default ROM location
    vm_set_SP(vm, 0xFFFF); // start the stack
    vm_set_PC(vm, 0x4000);

#ifdef __EMSCRIPTEN__
        // cancel a previous loop (this is a rest)
        emscripten_cancel_main_loop();
#endif

    // Pause the vm
    vm_set_status(vm, Paused);
}

static void vm_cycle_actual(vm_state* vm)
{
    if (vm_should_cycle(vm) == TRUE)
    {
        vm->m_Timer++;

        // save pc before instruction
        static uint16_t saved_pc = 0;
        saved_pc = vm_get_PC(vm);

        /**
         * Instruction layout explained
         * Instructions are variable sizes
         * 0xABCD 0xEFGH 0xIJ
         *
         * 0xAB   -> specifies operation (AB is the opcode)
         *
         * 0xCD   -> specifies operand types (see operands.c)
         *           where C is the type of destination
         *           and D is type of src
         *
         * 0xEF   -> if a register is in the instruction,
         *           E will be the dest register
         *           F will be the source register
         *           If the immediate value uses a register offset, (either in src or dst)
         *           that register will be in their respective slot
         *
         * 0xGHIJ -> Constant value / immediate value
         *           OR
         *           Two's complement signed value for reg-offset i.e. [a+0x100],
         *
         * Example encoding:
         * 03  12  10  00  01   ::::::::::    mov a, 1
         * ^   ^   ^        ^---> constant value
         * |   |   |---> register 1 (reg), 0 (not used)
         * |   |---> operand types, 1 (reg), 2 (immediate value)
         * |---> opcode
         **/

        // Operation decoding
        uint8_t opcode = vm_get_u8(vm, vm_get_PC(vm));
        uint8_t operand_type = vm_get_u8(vm, vm_get_PC(vm) + 1);

        // Operand discrimination
        uint8_t op_dst = operand_type >> 4;
        uint8_t op_src = operand_type & 0x0F;

        // True if either operand type may contain a register
        // (a src or dst type)
        BOOL contains_registers =
            (op_dst == REGISTER                      ||
             op_dst == MEMORY_REGISTER               ||
             op_dst == MEMORY_REGISTER_DISPLACEMENT)
            ||
            (op_src == REGISTER ||
             op_src == MEMORY_REGISTER ||
             op_src == MEMORY_REGISTER_DISPLACEMENT);

        // True if either operand type may contain a displacement value
        BOOL contains_displacement =
            ((op_dst) == MEMORY_REGISTER_DISPLACEMENT ||
             (op_dst) == MEMORY_CONSTANT)
            ||
            ((op_src) == MEMORY_REGISTER_DISPLACEMENT ||
             (op_src) == MEMORY_CONSTANT);

        // Returns true if either operand type may contain an immediate value
        BOOL contains_immediate = ((op_dst) == CONSTANT) || ((op_src) == CONSTANT);

        // Data position determination
        uint16_t pos_registers;
        uint16_t pos_displacement;
        uint16_t pos_immediate;

        // Position of next instruction
        uint16_t pos_nextelement;

        // Set each pos to default no-offset start value (directly after operand types)
        pos_registers = pos_displacement = pos_immediate = pos_nextelement = vm_get_PC(vm) + 2;

        if (contains_registers == TRUE)
        {
            // If registers, they're 1 byte from start
            pos_registers = pos_nextelement;
            pos_nextelement += 1;
        }

        if (contains_displacement == TRUE)
        {
            // If displacement, they're 2 bytes from start
            pos_displacement = pos_nextelement;
            pos_nextelement += 2;
        }

        if (contains_immediate == TRUE)
        {
            // Immediate is 2 bytes, like displacement
            pos_immediate = pos_nextelement;
            pos_nextelement += 2;
        }

        // Get register byte
        uint8_t regpair = vm_get_u8(vm, pos_registers);

        // 0xDS, where D is dest, and S is src register number
        vm->m_InstructionData.m_RegDst = regpair >> 4;
        vm->m_InstructionData.m_RegSrc = regpair & 0x0F;

        vm->m_InstructionData.m_Displacement = vm_get_u16(vm, pos_displacement);
        vm->m_InstructionData.m_Immediate    = vm_get_u16(vm, pos_immediate);

        vm->m_InstructionData.m_NextInstruction = pos_nextelement;

        vm->m_InstructionData.m_ContainsDisplacement = contains_displacement;
        vm->m_InstructionData.m_ContainsImmediate    = contains_immediate;
        vm->m_InstructionData.m_ContainsRegisters    = contains_registers;

        // Make sure operand types are in range of operand handler matrix
        // see operands.c
        if (op_dst <= 6 && op_src <= 6)
        {
            vm_get_dst = vm_OperandHandlersGet[op_dst][0];
            vm_get_src = vm_OperandHandlersGet[op_src][1];
            vm_set_dst = vm_OperandHandlersSet[op_dst][0];
            vm_set_src = vm_OperandHandlersSet[op_src][1];
        }

        // Execute operation if value
        if (vm_OpHandlers[opcode].m_Func != NULL)
        {
            vm_OpHandlers[opcode].m_Func(vm);
        }
        else
        {
            vm->m_Panic("The VM attempted to execute an illegal operation. The VM cannot recover.");
        }

        // if the operation did not modify the PC value (aka didnt jump somewhere)
        if (vm_get_PC(vm) == saved_pc)
        {
            // Go onto the next instruction
            vm_set_PC(vm, vm->m_InstructionData.m_NextInstruction);
        }

        // Simulate registered hardware by executing their "think" cycle,
        // hardware gets access to I/O ports & memory via a DMA ptr
        for (uint8_t i = 0; i < 0xFF; i++)
        {
            if (vm->m_HardwareThinkFuncs[i] != NULL)
            {
                vm->m_HardwareThinkFuncs[i](vm->m_IOPorts, vm->m_Mem);
            }
        }

        // Interrupts over I/O bus
        // PORT -> VALUE
        // 0x0  -> 0xABCD
        //
        // A =    0 - no interrupt
        //        1 - interrupt set by interrupter, waiting for cpu acknowledge
        //        2 - interrupt waiting for cpu to process
        //        3 - interrupt processed by cpu, waiting for interrupter to reset to 0
        // B =    0 - unused/reserved
        // C,D = 0x00-0xff - interupt handler

        // if an interrupt has been set by the interrupter
        if ((vm->m_IOPorts[VMHW_INTERRUPTER_IOPORT_BEGIN] & 0xF000) >> 12 == 0x1)
        {
            // printf("PC @ 0x%02x nextinstr 0x%02x ... Recieved interrupt, handler @ %u\n",
            //   vm_get_PC(vm),
            //    vm->m_InstructionData.m_NextInstruction,
            //    vm->m_IOPorts[VMHW_INTERRUPTER_IOPORT_BEGIN] & 0x00FF
            // );

            // acknowledge it, set A = 2
            vm->m_IOPorts[VMHW_INTERRUPTER_IOPORT_BEGIN] = 0x2000 + (vm->m_IOPorts[VMHW_INTERRUPTER_IOPORT_BEGIN] & 0x0FFF);
            // preserve state, let the user do it

            // get the value of the address at the interrupt table and jump to it
            uint16_t handler = vm_get_u16(vm, vm->m_IOPorts[VMHW_INTERRUPTER_IOPORT_BEGIN] & 0x00FF);

            if (handler != 0)
            {
                // push the return address onto the stack for the IRET instruction
                // push ret address
                vm_set_SP(vm, vm_get_SP(vm) - 0x2);
                vm_set_u16(vm, vm_get_SP(vm), vm_get_PC(vm));

                // push flags
                vm_set_SP(vm, vm_get_SP(vm) - 0x2);
                vm_set_u16(vm, vm_get_SP(vm), vm_get_SF(vm));

                // jump to handler
                vm_set_PC(vm, handler);
            }

            // see VM_IMPLEMENT_OPERATION(IRET) for state restoration done by user
        }

        // call the post-cycle hook
        vm->m_PostCycle();
    }


}

// Cycles 100
static void vm_cycle_multi(vm_state* vm)
{
    for (uint32_t i = 0; i < 100; i++)
    {
        vm_cycle_actual(vm);
    }
}

void EXPORT vm_cycle(vm_state* vm)
{
    #ifdef __EMSCRIPTEN__
        // void emscripten_set_main_loop(em_callback_func func, int fps, int simulate_infinite_loop);
        emscripten_set_main_loop_arg((void(*)(void*))vm_cycle_multi, (void*)vm, 60, 1);
    #else
        while (1)
        {
            vm_cycle_multi(vm);

#ifdef _WIN32
            Sleep(1000/1);
#else
            usleep((1000 / 1) * 1000);
#endif
        }
    #endif
}

void EXPORT vm_deinit(vm_state* vm)
{
    free(vm->m_Mem);
    free(vm);
}

// needs rewrite and data sanitation
// returns a disassembly of the entire memory
// each instruction is appended as address\ndecodedinstruction\n
// op_dst_or_src - false if dst, true if src
static void vm_get_type_mask(vm_state* vm, char* out, uint8_t op_type, bool op_dst_or_src, uint8_t reg_dst, uint8_t reg_src, uint16_t displacement, uint16_t immediate)
{
    switch (op_type)
    {
    case REGISTER:
        sprintf(out, "%s", RegSpecMap[(op_dst_or_src == FALSE ? reg_dst : reg_src)]);
        break;

    case CONSTANT:
        sprintf(out, "%i", (int16_t)immediate);
        break;

    case MEMORY_REGISTER:
        sprintf(out, "[%s]", RegSpecMap[(op_dst_or_src == FALSE ? reg_dst : reg_src)]);
        break;

    case MEMORY_REGISTER_DISPLACEMENT:
        if (displacement > 0)
        {
            sprintf(out, "[%s+%i]", RegSpecMap[(op_dst_or_src == FALSE ? reg_dst : reg_src)], (int16_t)displacement);
        }
        else
        {
            sprintf(out, "[%s%i]", RegSpecMap[(op_dst_or_src == FALSE ? reg_dst : reg_src)], (int16_t)displacement);
        }
        break;

    case MEMORY_CONSTANT:
        sprintf(out, "[%u]", displacement);
        break;
    }
}

void EXPORT vm_get_dasm_string(vm_state* vm, char* dasm)
{
    printf("Disassembly requested\n");
    //char* dasm = malloc(0xFFFF); // its going to be a pretty big string
    memset(dasm, 0x0, 0xFFFF);
    uint16_t PC = 0;

    while (PC < 0xFFFF)
    {
        // Operation decoding
        uint8_t opcode = vm_get_u8(vm, PC);

        if (vm_OpHandlers[opcode].m_Func != NULL)
        {
            const char* opcode_name = vm_OpHandlers[opcode].m_OpName;

            uint8_t operand_type = vm_get_u8(vm, PC + 1);

            // Operand discrimination
            uint8_t op_dst = operand_type >> 4;
            uint8_t op_src = operand_type & 0x0F;

            // True if either operand type may contain a register
            // (a src or dst type)
            BOOL contains_registers =
                (op_dst == REGISTER                     ||
                op_dst == MEMORY_REGISTER               ||
                op_dst == MEMORY_REGISTER_DISPLACEMENT)
                ||
                (op_src == REGISTER                     ||
                op_src == MEMORY_REGISTER               ||
                op_src == MEMORY_REGISTER_DISPLACEMENT);

            // True if either operand type may contain a displacement value
            BOOL contains_displacement =
                ((op_dst) == MEMORY_REGISTER_DISPLACEMENT ||
                (op_dst) == MEMORY_CONSTANT)
                ||
                ((op_src) == MEMORY_REGISTER_DISPLACEMENT ||
                (op_src) == MEMORY_CONSTANT);

            // Returns true if either operand type may contain an immediate value
            BOOL contains_immediate = ((op_dst) == CONSTANT) || ((op_src) == CONSTANT);

            // Data position determination
            uint16_t pos_registers;
            uint16_t pos_displacement;
            uint16_t pos_immediate;

            // Position of next instruction
            uint16_t pos_nextelement;

            // Set each pos to default no-offset start value (directly after operand types)
            pos_registers = pos_displacement = pos_immediate = pos_nextelement = PC + 2;

            if (contains_registers == TRUE)
            {
                // If registers, they're 1 byte from start
                pos_registers = pos_nextelement;
                pos_nextelement += 1;
            }

            if (contains_displacement == TRUE)
            {
                // If displacement, they're 2 bytes from start
                pos_displacement = pos_nextelement;
                pos_nextelement += 2;
            }

            if (contains_immediate == TRUE)
            {
                // Immediate is 2 bytes, like displacement
                pos_immediate = pos_nextelement;
                pos_nextelement += 2;
            }

            // Get register byte
            uint8_t regpair = vm_get_u8(vm, pos_registers);

            // 0xDS, where D is dest, and S is src register number
            uint8_t v_RegDst = regpair >> 4;
            uint8_t v_RegSrc = regpair & 0x0F;

            uint16_t v_Displacement = vm_get_u16(vm, pos_displacement);
            uint16_t v_Immediate    = vm_get_u16(vm, pos_immediate);

            uint16_t v_NextInstruction = pos_nextelement;

            // build instruction data
            char* mask = malloc(0xFF);
            memset(mask, 0, 0xFF);

            vm_get_type_mask(vm, mask, op_dst, FALSE, v_RegDst, v_RegSrc, v_Displacement, v_Immediate);

            sprintf(dasm, "%s0x%02X\n%s %s", dasm, PC, opcode_name, mask);
            memset(mask, 0, 0xFF);


            vm_get_type_mask(vm, mask, op_src, TRUE, v_RegDst, v_RegSrc, v_Displacement, v_Immediate);

            if (strlen(mask) > 0)
            {
                sprintf(dasm, "%s, %s\n", dasm, mask);
            }
            else
            {
                sprintf(dasm, "%s\n", dasm);
            }

            PC = v_NextInstruction;

        }
        else
        {
            // Not a valid operation, increment PC and move on
            PC += 1;
        }
    }
}
