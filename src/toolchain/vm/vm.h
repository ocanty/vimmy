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
	BOOL m_ContainsRegisters;
	BOOL m_ContainsImmediate;
	BOOL m_ContainsDisplacement;
	uint8_t m_RegDst;			// The encoded register id of the destination reg
	uint8_t m_RegSrc;			// The encoded register id of the source reg
	uint16_t m_Displacement;	// Displacement value
	uint16_t m_Immediate;		// Immediate value
	uint16_t m_NextInstruction; // The address of the next instruction
} vm_instruction_data;

typedef enum
{
	Paused = 0,
	StepOne = 1, // Execute one instruction then set status = Paused
	StepAll = 2, // Run continously until status changed

} vm_status;

typedef void(*vm_panic_handler_t)(char*);
typedef void(*vm_post_cycle_hook_t)(void);
typedef void(*vm_hardwarefunc_t)(uint16_t* io, uint8_t* dma);

// vm_state
typedef struct vm_state
{
	vm_panic_handler_t m_Panic;
	vm_post_cycle_hook_t m_PostCycle; // called at the end of every cycle

	vm_status m_Status;

	uint8_t* m_Mem;
	uint16_t m_Reg[17]; // 0 index is a skip register

	vm_hardwarefunc_t m_HardwareThinkFuncs[256];
	uint16_t m_IOPorts[16];

	uint16_t m_Timer; // Number of cycles since start

	/*
		These function pointers are pointed to functions which get/set the operand data based off types
		We do this because operation handlers would be inefficient to discriminate the correct function to get/set operand data
	*/

	vm_instruction_data m_InstructionData;
} vm_state;

// vm_hardware
typedef struct vm_hardware
{
	uint8_t m_HWID;
	// Called every cycle, DO NOT USE FOR SYNCHRONIZATION!
	vm_hardwarefunc_t vmhw_init;
	vm_hardwarefunc_t vmhw_think;

	// Called every time the I/O bus is written to
	// vm_hardwarefunc_t m_OnBusWrite;
} vm_hardware;


typedef void(*vm_ophandlerfunc_t)(vm_state*);
typedef void(*vm_operandhandler_t)(vm_state*);

typedef struct vm_ophandler_t
{
	vm_ophandlerfunc_t m_Func;
	const char* m_OpName;
} vm_ophandler_t;

// if these functions arent all static it causeas a multiply defined symbol error, we need to fix this later

// external error handler
void EXPORT vm_register_panic_handler(vm_state * vm, void(*panic_func)(char*));
void EXPORT vm_register_post_cycle_hook(vm_state * vm, void(*func)(void));


static vm_state* EXPORT vm_init();
static void vm_register_hardware(vm_state* vm, uint8_t hwid, vm_hardwarefunc_t thinkfunc);

static void EXPORT vm_reset(vm_state* vm);

static vm_status EXPORT vm_get_status(vm_state* vm);
static void EXPORT vm_set_status(vm_state* vm, vm_status status);

static void EXPORT vm_cycle(vm_state* vm);
static void EXPORT vm_deinit(vm_state* vm);


static void EXPORT vm_get_dasm_string(vm_state* vm, char* dasm);