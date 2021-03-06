
#include "operations.h"
#include "hardware/interrupter.h"
#include "operands.h"

#include <string.h>
#define STR(s) #s

#define VM_IMPLEMENT_OPERATION_INDIRECT(mnemonic) void vm_op_##mnemonic(vm_state* vm)

// Implements an operation that has been defined
#define VM_IMPLEMENT_OPERATION(mnemonic) VM_IMPLEMENT_OPERATION_INDIRECT(mnemonic)

// Structure initializer that points to a function defined by the IMPLEMENT_OPERATION_MACRO
#define VM_DEFINE_OPERATION_INDIRECT(mnemonic,opcode) [opcode] = { .m_Func = &vm_op_##mnemonic,.m_OpName = STR(mnemonic) },

// Defines an operation that must be implemented
#define VM_DEFINE_OPERATION(mnemonic,opcode) VM_DEFINE_OPERATION_INDIRECT(mnemonic,opcode)

// excellent flag resource:
// http://teaching.idallen.com/dat2343/10f/notes/040_overflow.txt

// amazing include hack below
vm_ophandler_t vm_OpHandlers[256] =
{
    #include "OpSpec.h"
    [255] = { 0 }
};

VM_IMPLEMENT_OPERATION(DBGHALT)
{
    vm->m_Status = Paused;
}

VM_IMPLEMENT_OPERATION(NOP)
{

}

VM_IMPLEMENT_OPERATION(MOV)
{
    vm_set_dst(vm, vm_get_src(vm));
}


VM_IMPLEMENT_OPERATION(GETCHAR)
{
    //printf("%u\n", memval);
    vm_set_dst(vm, vm_get_u8(vm, vm_get_src(vm)));
}

VM_IMPLEMENT_OPERATION(SETCHAR)
{
    
    vm_set_u8(vm, vm_get_dst(vm), vm_get_src(vm)&0xFF);

}


VM_IMPLEMENT_OPERATION(PUSH)
{
    //printf("PUSH 0x%02x \n", vm_get_dst(vm));
    // writing a 16bit value, take 1 from SP
    
    vm_set_SP(vm, vm_get_SP(vm) - 0x2);
    vm_set_u16(vm, vm_get_SP(vm), vm_get_dst(vm));
}

VM_IMPLEMENT_OPERATION(POP)
{
    vm_set_dst(vm, vm_get_u16(vm, vm_get_SP(vm)));
    vm_set_SP(vm, vm_get_SP(vm) + 0x2);
}

VM_IMPLEMENT_OPERATION(XCHG)
{
    static uint16_t a, b;
    a = b = 0;
    a = vm_get_dst(vm);
    b = vm_get_src(vm);

    vm_set_src(vm, a);
    vm_set_dst(vm, b);
}

VM_IMPLEMENT_OPERATION(LEA)
{
    //vm->m_InstructionData.m_Displacement
}

VM_IMPLEMENT_OPERATION(SCRSWP)
{

}

VM_IMPLEMENT_OPERATION(IN)
{
    vm_set_dst(vm, vm->m_IOPorts[vm_get_src(vm)]);
}

VM_IMPLEMENT_OPERATION(OUT)
{
    vm->m_IOPorts[vm_get_src(vm)] = vm_get_dst(vm);
}

VM_IMPLEMENT_OPERATION(JMP)
{
    vm_set_PC(vm, vm_get_dst(vm));
}

VM_IMPLEMENT_OPERATION(CALL)
{
    // push ret address

    vm_set_SP(vm, vm_get_SP(vm) - 0x2);
    vm_set_u16(vm, vm_get_SP(vm), vm->m_InstructionData.m_NextInstruction);
    vm_set_PC(vm, vm_get_dst(vm));
}

VM_IMPLEMENT_OPERATION(RET)
{
    // pop ret address


    vm_set_PC(vm, vm_get_u16(vm, vm_get_SP(vm)));
    vm_set_SP(vm, vm_get_SP(vm) + 0x2);
}


VM_IMPLEMENT_OPERATION(IRET)
{

    printf("iret: %u\n", vm_get_u16(vm, vm_get_SP(vm)));


    // pop flags
    vm_set_SF(vm, vm_get_u16(vm, vm_get_SP(vm)));
    vm_set_SP(vm, vm_get_SP(vm) + 0x2);

    // pop ret address
    vm_set_PC(vm, vm_get_u16(vm, vm_get_SP(vm)));
    vm_set_SP(vm, vm_get_SP(vm) + 0x2);

}

// http://teaching.idallen.com/dat2343/10f/notes/040_overflow.txt

VM_IMPLEMENT_OPERATION(ADD)
{
    uint32_t val = (uint32_t)vm_get_dst(vm) + (uint32_t)vm_get_src(vm);
    uint16_t flags = vm_get_SF(vm);

    // test zero flag
    if (val == 0) { BITSET(&flags, ZF_BIT); }
    else { BITCLEAR(&flags, ZF_BIT); }

    // test carry flag
    if (val > 0xFFFF){ BITSET(&flags, CF_BIT);  }
    else { BITCLEAR(&flags, CF_BIT); }

    // test overflow flag
    if (ISSIGNED(vm_get_dst(vm) + vm_get_src(vm)) ||  (ISSIGNED(vm_get_dst(vm)) && ISSIGNED(vm_get_src(vm)) && !ISSIGNED(vm_get_dst(vm) + vm_get_src(vm)))) 
    {
        BITSET(&flags, OF_BIT);
    }
    else { BITCLEAR(&flags, OF_BIT); }

    // test sign flag
    if (ISSIGNED(val))
    {
        BITSET(&flags, SF_BIT); 
    }
    else { BITCLEAR(&flags, SF_BIT); }

    vm_set_SF(vm, flags);
    vm_set_dst(vm, vm_get_dst(vm) + vm_get_src(vm));
}

VM_IMPLEMENT_OPERATION(SUB)
{
    uint32_t val = (uint32_t)vm_get_dst(vm) - (uint32_t)vm_get_src(vm);
    uint16_t flags = vm_get_SF(vm);

    // test zero flag
    if (val == 0) { BITSET(&flags, ZF_BIT); }
    else { BITCLEAR(&flags, ZF_BIT); }

    // test carry flag
    if (val > 0xFFFF) { BITSET(&flags, CF_BIT); }
    else { BITCLEAR(&flags, CF_BIT); }

    // test overflow flag
    if (ISSIGNED(vm_get_dst(vm) + vm_get_src(vm)) || (ISSIGNED(vm_get_dst(vm)) && ISSIGNED(vm_get_src(vm)) && !ISSIGNED(vm_get_dst(vm) + vm_get_src(vm))))
    {
        BITSET(&flags, OF_BIT);
    }
    else { BITCLEAR(&flags, OF_BIT); }

    // test sign flag
    if (ISSIGNED(val))
    {
        BITSET(&flags, SF_BIT);
    }
    else { BITCLEAR(&flags, SF_BIT); }

    vm_set_SF(vm, flags);
    vm_set_dst(vm,val);
}

VM_IMPLEMENT_OPERATION(MUL)
{
    uint32_t val = (uint32_t)vm_get_dst(vm) * (uint32_t)vm_get_src(vm);
    uint16_t flags = vm_get_SF(vm);
    // test overflow flag
    if (val > 0xFFFF)
    {
        BITSET(&flags, OF_BIT);
    }
    else { BITCLEAR(&flags, OF_BIT); }

    BITCLEAR(&flags, CF_BIT);
    vm_set_SF(vm, flags);
    vm_set_dst(vm, vm_get_dst(vm) * vm_get_src(vm));
}

VM_IMPLEMENT_OPERATION(IMUL)
{
    int32_t temp = (int16_t)vm_get_dst(vm) * (int16_t)vm_get_src(vm); //signed multiplication; Temporary is twice twice the Destination size
    vm_set_dst(vm,(int16_t)temp);

    uint16_t flags = vm_get_SF(vm);

    if (temp == vm_get_dst(vm)) {
        BITCLEAR(&flags, CF_BIT);
        BITCLEAR(&flags, OF_BIT);
    }
    else {
        BITSET(&flags, CF_BIT);
        BITSET(&flags, OF_BIT);
    }

    vm_set_SF(vm, flags);
    vm_set_dst(vm, (int16_t)vm_get_dst(vm) * (int16_t)vm_get_src(vm));
}

VM_IMPLEMENT_OPERATION(DIV)
{
    uint16_t a = vm_get_A(vm);
    vm_set_A(vm, a / vm_get_dst(vm));
    vm_set_D(vm, a % vm_get_dst(vm));
}

VM_IMPLEMENT_OPERATION(IDIV)
{
    int16_t a = (int16_t)vm_get_A(vm);
    vm_set_A(vm, a / (int16_t)vm_get_dst(vm));
    vm_set_D(vm, a % (int16_t)vm_get_dst(vm));
}

VM_IMPLEMENT_OPERATION(INC)
{
    vm_set_dst(vm, vm_get_dst(vm) + 1);
}

VM_IMPLEMENT_OPERATION(DEC)
{
    vm_set_dst(vm, vm_get_dst(vm) - 1);
}

VM_IMPLEMENT_OPERATION(CMP)
{
    uint32_t val = (uint32_t)vm_get_dst(vm) - (uint32_t)vm_get_src(vm);
    uint16_t flags = vm_get_SF(vm);

    // test zero flag
    if (val == 0) { BITSET(&flags, ZF_BIT); }
    else { BITCLEAR(&flags, ZF_BIT); }

    // test carry flag
    if (val > 0xFFFF) { BITSET(&flags, CF_BIT); }
    else { BITCLEAR(&flags, CF_BIT); }

    // test overflow flag
    if (ISSIGNED(vm_get_dst(vm) + vm_get_src(vm)) || (ISSIGNED(vm_get_dst(vm)) && ISSIGNED(vm_get_src(vm)) && !ISSIGNED(vm_get_dst(vm) + vm_get_src(vm))))
    {
        BITSET(&flags, OF_BIT);
    }
    else { BITCLEAR(&flags, OF_BIT); }

    // test sign flag
    if (ISSIGNED(val))
    {
        BITSET(&flags, SF_BIT);
    }
    else { BITCLEAR(&flags, SF_BIT); }

    vm_set_SF(vm, flags);
}

VM_IMPLEMENT_OPERATION(JE)
{
    uint16_t flags = vm_get_SF(vm);
    if (BITTEST(&flags, ZF_BIT))
    {
        vm_set_PC(vm, vm_get_dst(vm));
    }
}

VM_IMPLEMENT_OPERATION(JNE)
{
    uint16_t flags = vm_get_SF(vm);
    if (BITTEST(&flags, ZF_BIT)==0)
    {
        vm_set_PC(vm, vm_get_dst(vm));
    }
}

VM_IMPLEMENT_OPERATION(JZ)
{
    uint16_t flags = vm_get_SF(vm);
    if (BITTEST(&flags, ZF_BIT))
    {
        vm_set_PC(vm, vm_get_dst(vm));
    }
}

VM_IMPLEMENT_OPERATION(JG)
{
    uint16_t flags = vm_get_SF(vm);
    if (BITTEST(&flags, ZF_BIT) == 0 && (BITTEST(&flags, SF_BIT)== BITTEST(&flags, OF_BIT)))
    {
        vm_set_PC(vm, vm_get_dst(vm));
    }
}

VM_IMPLEMENT_OPERATION(JGE)
{
    uint16_t flags = vm_get_SF(vm);
    if (BITTEST(&flags, SF_BIT) == BITTEST(&flags, OF_BIT))
    {
        vm_set_PC(vm, vm_get_dst(vm));
    }
}
VM_IMPLEMENT_OPERATION(JL)
{
    uint16_t flags = vm_get_SF(vm);
    if (BITTEST(&flags, SF_BIT) > BITTEST(&flags,OF_BIT) || BITTEST(&flags,OF_BIT) > BITTEST(&flags,SF_BIT))
    {
        vm_set_PC(vm, vm_get_dst(vm));
    }
}
VM_IMPLEMENT_OPERATION(JLE)
{
    uint16_t flags = vm_get_SF(vm);
    if( BITTEST(&flags,ZF_BIT) || (BITTEST(&flags, SF_BIT) > BITTEST(&flags, OF_BIT) || BITTEST(&flags, OF_BIT) > BITTEST(&flags, SF_BIT)))
    {
        vm_set_PC(vm, vm_get_dst(vm));
    }
}


VM_IMPLEMENT_OPERATION(MOD)
{
    vm_set_dst(vm, vm_get_dst(vm) % vm_get_src(vm));
}

VM_IMPLEMENT_OPERATION(TIMER)
{
    vm_set_dst(vm, vm->m_Timer);
}

VM_IMPLEMENT_OPERATION(AND)
{
    uint16_t flags = vm_get_SF(vm);
    uint16_t val = vm_get_dst(vm) & vm_get_src(vm);

    BITCLEAR(&flags, OF_BIT);
    BITCLEAR(&flags, CF_BIT);

    // test zero flag
    if (val == 0) { BITSET(&flags, ZF_BIT); }
    else { BITCLEAR(&flags, ZF_BIT); }

    // test sign flag
    if (ISSIGNED(val))
    {
        BITSET(&flags, SF_BIT);
    }
    else { BITCLEAR(&flags, SF_BIT); }

    vm_set_SF(vm, flags);
    vm_set_dst(vm, val);
}

VM_IMPLEMENT_OPERATION(XOR)
{
    uint16_t flags = vm_get_SF(vm);
    uint16_t val = vm_get_dst(vm) ^ vm_get_src(vm);

    BITCLEAR(&flags, OF_BIT);
    BITCLEAR(&flags, CF_BIT);

    // test zero flag
    if (val == 0) { BITSET(&flags, ZF_BIT); }
    else { BITCLEAR(&flags, ZF_BIT); }

    // test sign flag
    if (ISSIGNED(val))
    {
        BITSET(&flags, SF_BIT);
    }
    else { BITCLEAR(&flags, SF_BIT); }

    vm_set_SF(vm, flags);
    vm_set_dst(vm, val);
}

VM_IMPLEMENT_OPERATION(OR)
{
    uint16_t flags = vm_get_SF(vm);
    uint16_t val = vm_get_dst(vm) | vm_get_src(vm);

    BITCLEAR(&flags, OF_BIT);
    BITCLEAR(&flags, CF_BIT);

    // test zero flag
    if (val == 0) { BITSET(&flags, ZF_BIT); }
    else { BITCLEAR(&flags, ZF_BIT); }

    // test sign flag
    if (ISSIGNED(val))
    {
        BITSET(&flags, SF_BIT);
    }
    else { BITCLEAR(&flags, SF_BIT); }

    vm_set_SF(vm, flags);
    vm_set_dst(vm, val);
}

VM_IMPLEMENT_OPERATION(NOT)
{
    uint16_t flags = vm_get_SF(vm);
    uint16_t val = ~vm_get_dst(vm);

    vm_set_SF(vm, flags);
    vm_set_dst(vm, val);
}

VM_IMPLEMENT_OPERATION(TEST)
{
    uint16_t flags = vm_get_SF(vm);
    uint16_t val = vm_get_dst(vm) & vm_get_src(vm);

    BITCLEAR(&flags, OF_BIT);
    BITCLEAR(&flags, CF_BIT);

    // test zero flag
    if (val == 0) { BITSET(&flags, ZF_BIT); }
    else { BITCLEAR(&flags, ZF_BIT); }

    // test sign flag
    if (ISSIGNED(val))
    {
        BITSET(&flags, SF_BIT);
    }
    else { BITCLEAR(&flags, SF_BIT); }

    vm_set_SF(vm, flags);
    //vm_set_dst(vm, val);
}

VM_IMPLEMENT_OPERATION(LOOP)
{
    if (vm_get_C(vm) > 0)
    {
        vm_set_C(vm, vm_get_C(vm) - 1);
        vm_set_PC(vm, vm_get_dst(vm));
    }
}


VM_IMPLEMENT_OPERATION(RAND)
{
    uint16_t randind = vm_get_src(vm);
    vm_set_dst(vm, (rand() % randind));
}


VM_IMPLEMENT_OPERATION(STRCAT)
{
    vm_set_dst(vm, strcat((vm->m_Mem + vm_get_dst(vm)), (vm->m_Mem + vm_get_src(vm))));
}

VM_IMPLEMENT_OPERATION(STRLEN)
{
    vm_set_dst(vm, strlen((vm->m_Mem + vm_get_src(vm))));
}

VM_IMPLEMENT_OPERATION(STRCPY)
{
    vm_set_dst(vm, strcpy((vm->m_Mem + vm_get_dst(vm)), (vm->m_Mem + vm_get_src(vm))));
}

VM_IMPLEMENT_OPERATION(STRCMP)
{
    vm_set_dst(vm, strcmp((vm->m_Mem + vm_get_src(vm)), (vm->m_Mem + vm_get_src(vm))));
}