
#include "operands.h"
#include "memory.h"

vm_get_func_t vm_OperandHandlersGet[6][2] = {
/* NONE */							{ &vm_get_void, &vm_get_void },
/* REGISTER */						{ &vm_get_reg_dst, &vm_get_reg_src },
/* CONSTANT */						{ &vm_get_immediate, &vm_get_immediate }, // Only one immediate per instruction so it doesnt matter about dst/src
/* MEMORY_REGISTER */				{ &vm_get_memory_register_dst, &vm_get_memory_register_src },
/* MEMORY_REGISTER_DISPLACEMENT */	{ &vm_get_memory_registerdisp_dst, &vm_get_memory_registerdisp_src },
/* MEMORY_CONSTANT */				{ &vm_get_memory_const, &vm_get_memory_const } // Only one displacement per instruction
}; // indexed by operand type then by dst(0) & src (1)

vm_set_func_t vm_OperandHandlersSet[6][2] = {
/* NONE */							{ &vm_set_void, &vm_set_void },
/* REGISTER */						{ &vm_set_reg_dst, &vm_set_reg_src },
/* CONSTANT */						{ &vm_set_void, &vm_set_void }, // Cant set constants
/* MEMORY_REGISTER */				{ &vm_set_memory_register_dst, &vm_set_memory_register_src },
/* MEMORY_REGISTER_DISPLACEMENT */	{ &vm_set_memory_registerdisp_dst, &vm_set_memory_registerdisp_src },
/* MEMORY_CONSTANT */				{ &vm_set_memory_const, &vm_set_memory_const }
}; // indexed by operand type then by src/dest


uint16_t vm_get_void(vm_state* vm) { return 0; }
void vm_set_void(vm_state* vm, uint16_t val) { }

// A
uint16_t vm_get_reg_dst(vm_state* vm) { return vm->m_Reg[vm->m_InstructionData.m_RegDst]; }
void vm_set_reg_dst(vm_state* vm, uint16_t val) { vm->m_Reg[vm->m_InstructionData.m_RegDst] = val; }

// A
uint16_t vm_get_reg_src(vm_state* vm) { return vm->m_Reg[vm->m_InstructionData.m_RegSrc]; }
void vm_set_reg_src(vm_state* vm, uint16_t val) { vm->m_Reg[vm->m_InstructionData.m_RegSrc] = val; }

// 0x100
uint16_t vm_get_immediate(vm_state* vm) { return vm->m_InstructionData.m_Immediate; }

// [A]
uint16_t vm_get_memory_register_dst(vm_state* vm) { return vm_get_u16(vm, vm->m_Reg[vm->m_InstructionData.m_RegDst]); }
void vm_set_memory_register_dst(vm_state* vm, uint16_t val) { vm_set_u16(vm, vm->m_Reg[vm->m_InstructionData.m_RegDst], val); }

uint16_t vm_get_memory_register_src(vm_state* vm) { return vm_get_u16(vm, vm->m_Reg[vm->m_InstructionData.m_RegSrc]); }
void vm_set_memory_register_src(vm_state* vm, uint16_t val) { vm_set_u16(vm, vm->m_Reg[vm->m_InstructionData.m_RegSrc], val); }

// [A+0x100]
uint16_t vm_get_memory_registerdisp_dst(vm_state* vm) { return vm_get_u16(vm, (uint16_t)vm->m_Reg[vm->m_InstructionData.m_RegDst] + (int16_t)vm->m_InstructionData.m_Displacement); }
void vm_set_memory_registerdisp_dst(vm_state* vm, uint16_t val) { vm_set_u16(vm, (uint16_t)vm->m_Reg[vm->m_InstructionData.m_RegDst] + (int16_t)vm->m_InstructionData.m_Displacement, val); }

uint16_t vm_get_memory_registerdisp_src(vm_state* vm) { return vm_get_u16(vm, (uint16_t)vm->m_Reg[vm->m_InstructionData.m_RegSrc] + (int16_t)vm->m_InstructionData.m_Displacement); }
void vm_set_memory_registerdisp_src(vm_state* vm, uint16_t val) { vm_set_u16(vm, (uint16_t)vm->m_Reg[vm->m_InstructionData.m_RegSrc] + (int16_t)vm->m_InstructionData.m_Displacement, val); }

// [0x100]
uint16_t vm_get_memory_const(vm_state* vm) { return vm_get_u16(vm, vm->m_InstructionData.m_Displacement); }
void vm_set_memory_const(vm_state* vm, uint16_t val) { vm_set_u16(vm, vm->m_InstructionData.m_Displacement, val); }