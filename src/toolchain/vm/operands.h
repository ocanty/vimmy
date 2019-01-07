#pragma once

#include "vm.h"

// A function type that can get the value of a register/memory location
typedef uint16_t(*vm_get_func_t)(struct vm_state*);
// A function type that can set the value of a register/memory location
typedef void(*vm_set_func_t)(struct vm_state*, uint16_t);

// Operand type
// This
enum OperandTypeEncoded
{
    NONE = 0x0,
    REGISTER = 0x1,                     //  r, Register notation: a,b,c, ...
    CONSTANT = 0x2,                     //  c, Any parseInt(...,10) literal except negatives: 1, 0x1, ...
    MEMORY_REGISTER = 0x3,              //  [reg]
    MEMORY_REGISTER_DISPLACEMENT = 0x4, //  [reg+offset] [reg-offset]
    MEMORY_CONSTANT = 0x5               //  [number]
};

// These functions are set depending on the current instruction
// They provider getters and setters for src and dst operand types
// e.g.
// for mov a, [0x55]
// vm_get_dst -> returns value of A
// vm_set_dst -> sets value of A
// vm_get_src -> gets value at memory addr 0x55
// vm_set_src -> sets value at memory addr 0x55
vm_get_func_t vm_get_dst;
vm_set_func_t vm_set_dst;
vm_get_func_t vm_get_src;
vm_set_func_t vm_set_src;

// These are stubs, usually mapped when operands are constant values / not used
// (we can't set immediate values)
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

// Operand get/setter lookup tables#
// These are indexed by the enum above 'OperandTypeEncoded'
vm_get_func_t vm_OperandHandlersGet[6][2];
vm_set_func_t vm_OperandHandlersSet[6][2];
