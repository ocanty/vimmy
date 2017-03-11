#pragma once

#include "vm.h"

typedef uint16_t(*vm_get_func_t)(struct vm_state*);
typedef void(*vm_set_func_t)(struct vm_state*, uint16_t);

// Operand type ids: todo export from Spec.ts
enum OperandTypeEncoded
{
	REGISTER = 0x1, //  r, Register notation: a,b,c, ...
	CONSTANT = 0x2, //  c, Any parseInt(...,10) literal except negatives: 1, 0x1, ...
	MEMORY_REGISTER = 0x3, //  [reg]
	MEMORY_REGISTER_DISPLACEMENT = 0x4, //  [reg+offset] [reg-offset]
	MEMORY_CONSTANT = 0x5  //  [number]
};

// Proxied functions (see below)
vm_get_func_t vm_get_dst;
vm_set_func_t vm_set_dst;
vm_get_func_t vm_get_src;
vm_set_func_t vm_set_src;

uint16_t vm_get_void(vm_state* vm);
void vm_set_void(vm_state* vm, uint16_t val);

// A
uint16_t vm_get_reg_dst(vm_state* vm);
void vm_set_reg_dst(vm_state* vm, uint16_t val);

// A
uint16_t vm_get_reg_src(vm_state* vm);
void vm_set_reg_src(vm_state* vm, uint16_t val);

// 0x100
uint16_t vm_get_immediate(vm_state* vm);

// [A]
uint16_t vm_get_memory_register_dst(vm_state* vm);
void vm_set_memory_register_dst(vm_state* vm, uint16_t val);

uint16_t vm_get_memory_register_src(vm_state* vm);
void vm_set_memory_register_src(vm_state* vm, uint16_t val);

// [A+0x100]
uint16_t vm_get_memory_registerdisp_dst(vm_state* vm);
void vm_set_memory_registerdisp_dst(vm_state* vm, uint16_t val);

uint16_t vm_get_memory_registerdisp_src(vm_state* vm);
void vm_set_memory_registerdisp_src(vm_state* vm, uint16_t val);

// [0x100]
uint16_t vm_get_memory_const(vm_state* vm);
void vm_set_memory_const(vm_state* vm, uint16_t val);

// Operand get/setter lookup tables which proxy to vm_get_dst/vm_set_dst & vm_get_src/vm_set_src
vm_get_func_t vm_OperandHandlersGet[6][2];
vm_set_func_t vm_OperandHandlersSet[6][2];