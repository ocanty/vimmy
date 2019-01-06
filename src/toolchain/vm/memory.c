
#include "memory.h"

// register getter/setters
VM_REG_GS(A);
VM_REG_GS(B);
VM_REG_GS(C);
VM_REG_GS(D);
VM_REG_GS(AH);
VM_REG_GS(AL);
VM_REG_GS(BH);
VM_REG_GS(BL);
VM_REG_GS(PC);
VM_REG_GS(SP);
VM_REG_GS(BP);
VM_REG_GS(SF);
VM_REG_GS(CF);

void EXPORT vm_load_memory(vm_state* vm, uint16_t addr, uint8_t* buffer, uint16_t len)
{
    assert(vm != NULL && "vm_state invalid");
    assert(buffer != NULL && "invalid buffer");
    assert((addr + len) < 0xFFFF && "buffer too large");
    memcpy((vm->m_Mem + addr), buffer, len);
}

uint8_t vm_get_u8(vm_state* vm, uint16_t addr)
{
    return vm->m_Mem[addr];
}

uint16_t vm_get_u16(vm_state* vm, uint16_t addr)
{
    return (vm->m_Mem[addr] << 8) | vm->m_Mem[addr + 1];
}

void vm_set_u8(vm_state* vm, uint16_t addr, uint8_t val)
{
    vm->m_Mem[addr] = val;
}

void vm_set_u16(vm_state* vm, uint16_t addr, uint16_t val)
{
    assert(addr <= 0xFFFF);
    vm->m_Mem[addr] = val >> 8;
    vm->m_Mem[addr + 1] = val & 0x00FF;
}

uint8_t * EXPORT vm_get_mem_ptr(vm_state * vm)
{
    return vm->m_Mem;
}