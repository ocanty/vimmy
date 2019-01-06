#pragma once

#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <stdio.h>
#include <assert.h>

#include "build.h"

// vm_instruction_data
typedef struct vm_instruction_data
{
    BOOL m_ContainsRegisters;	 // True if the current instruction contains registers
    BOOL m_ContainsImmediate;	 // True if the current instruction contains an immediate value
    BOOL m_ContainsDisplacement; // True if the current instruction contains a displacement
    uint8_t m_RegDst;			 // The register number of the destination reg
    uint8_t m_RegSrc;			 // The register number of the source reg
    uint16_t m_Displacement;	 // Displacement value
    uint16_t m_Immediate;		 // Immediate value
    uint16_t m_NextInstruction;  // The address of the next instruction
} vm_instruction_data;

typedef enum
{
    Paused = 0,
    StepOne = 1, // Execute one instruction then set status = Paused
    StepAll = 2, // Run continously until status changed
} vm_status;

// Function type for a function called when the vm encounters an unrecoverable error
typedef void(*vm_panic_handler_t)(char*);
// Function type for a function called when the vm finishes a cycle
typedef void(*vm_post_cycle_hook_t)(void);
// Function type for a function called when the vm
// wants to process an emulated hardware module (see /hardware)
typedef void(*vm_hardwarefunc_t)(uint16_t* io, uint8_t* dma);

// vm_state
typedef struct vm_state
{
    // Called when cannot recover
    vm_panic_handler_t m_Panic;

    // Called at the end of every cycle
    vm_post_cycle_hook_t m_PostCycle;

    // vm_status
    vm_status m_Status;

    // 0xFFFF + 1 of mem
    uint8_t* m_Mem;

    // 0 index is a skip register
    uint16_t m_Reg[17];

    // Functions that could be registered by hardware that require emulation
    vm_hardwarefunc_t m_HardwareThinkFuncs[256];

    // I/O communication ports, (shared between cpu / hardware)
    uint16_t m_IOPorts[16];

    // Modulo'd time in seconds since start
    uint16_t m_Timer;

    // Information about the current instruction
    vm_instruction_data m_InstructionData;
} vm_state;

// vm_hardware
typedef struct vm_hardware
{
    uint8_t m_HWID;

    // Called every cycle
    vm_hardwarefunc_t vmhw_init;
    vm_hardwarefunc_t vmhw_think;

    // Called every time the I/O bus is written to
    // vm_hardwarefunc_t m_OnBusWrite;
} vm_hardware;

// Function type for operation handlers
typedef void(*vm_ophandlerfunc_t)(vm_state*);
// Function type for operand handlers (i.e read memory at dst/read reg/write mem/etc...)
typedef void(*vm_operandhandler_t)(vm_state*);

// Operation handler type
typedef struct vm_ophandler_t
{
    vm_ophandlerfunc_t m_Func;
    const char* m_OpName;
} vm_ophandler_t;

static vm_state* EXPORT vm_init();

// Set the panic handler
void EXPORT vm_register_panic_handler(vm_state * vm, void(*panic_func)(char*));

// Set the post-cycle callback
void EXPORT vm_register_post_cycle_hook(vm_state * vm, void(*func)(void));

// Register hardware (with its hwid, and hardware 'time-to-emulate' callback)
static void vm_register_hardware(vm_state* vm, uint8_t hwid, vm_hardwarefunc_t thinkfunc);

// Reset vm
static void EXPORT vm_reset(vm_state* vm);

static vm_status EXPORT vm_get_status(vm_state* vm);
static void EXPORT vm_set_status(vm_state* vm, vm_status status);

// Process one cycle
static void EXPORT vm_cycle(vm_state* vm);

// Die
static void EXPORT vm_deinit(vm_state* vm);

// Get a disassembly string of memory
static void EXPORT vm_get_dasm_string(vm_state* vm, char* dasm);