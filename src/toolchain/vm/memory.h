#pragma once

#include "build.h"

#include "vm.h"
#include "RegSpec.h"

// Register GET/SET shorthand
#define VM_REG_GS(reg) uint16_t EXPORT vm_get_##reg(vm_state* vm) { return vm->m_Reg[reg]; };  void vm_set_##reg(vm_state* vm, uint16_t val) { vm->m_Reg[reg] = val; };
#define VM_REG_GS_H(reg) uint16_t EXPORT vm_get_##reg(vm_state* vm); void vm_set_##reg(vm_state* vm, uint16_t val);

// Register shorthand
VM_REG_GS_H(A);
VM_REG_GS_H(B);
VM_REG_GS_H(C);
VM_REG_GS_H(D);
VM_REG_GS_H(AH);
VM_REG_GS_H(AL);
VM_REG_GS_H(BH);
VM_REG_GS_H(BL);
VM_REG_GS_H(PC);
VM_REG_GS_H(SP);
VM_REG_GS_H(BP);
VM_REG_GS_H(SF);
VM_REG_GS_H(CF);

#define CF_BIT 0 // Carry flag
#define ZF_BIT 1 // Zero flag
#define SF_BIT 2 // Sign flag
#define OF_BIT 3 // Overflow flag

void EXPORT vm_load_memory(vm_state* vm, uint16_t addr, uint8_t* buffer, uint16_t len);
uint8_t vm_get_u8(vm_state* vm, uint16_t addr);
uint16_t vm_get_u16(vm_state* vm, uint16_t addr);
void vm_set_u8(vm_state* vm, uint16_t addr, uint8_t val);
void vm_set_u16(vm_state* vm, uint16_t addr, uint16_t val);

uint8_t * EXPORT vm_get_mem_ptr(vm_state * vm);
