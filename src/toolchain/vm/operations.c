
#include "operations.h"
#include "hardware\interrupter.h"
#include "operands.h"

#define STR(s) #s

#define VM_IMPLEMENT_OPERATION_INDIRECT(mnemonic) void vm_op_##mnemonic(vm_state* vm)
// Implements an operation that has been defined
#define VM_IMPLEMENT_OPERATION(mnemonic) VM_IMPLEMENT_OPERATION_INDIRECT(mnemonic)

#define VM_DEFINE_OPERATION_INDIRECT(mnemonic,opcode) [opcode] = { .m_Func = &vm_op_##mnemonic,.m_OpName = STR(mnemonic) },
// Defines an operation that must be implemented
#define VM_DEFINE_OPERATION(mnemonic,opcode) VM_DEFINE_OPERATION_INDIRECT(mnemonic,opcode)

vm_ophandler_t vm_OpHandlers[0xFF + 1] =
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
	// get the raw memory address
	uint16_t memval = 0;

	if (vm->m_InstructionData.m_ContainsRegisters) { memval += (uint16_t)vm->m_Reg[vm->m_InstructionData.m_RegSrc]; }
	if (vm->m_InstructionData.m_ContainsDisplacement) { memval += (int16_t)vm->m_InstructionData.m_Displacement; }

	//printf("%u\n", memval);
	vm_set_dst(vm,
		vm_get_u8(vm,memval));
}

VM_IMPLEMENT_OPERATION(SETCHAR)
{
	// get the raw memory address
	uint16_t memval = 0;

	if (vm->m_InstructionData.m_ContainsRegisters) { memval += (uint16_t)vm->m_Reg[vm->m_InstructionData.m_RegDst]; }
	if (vm->m_InstructionData.m_ContainsDisplacement) { memval += (int16_t)vm->m_InstructionData.m_Displacement;  }
	vm_set_u8(vm, memval, (uint8_t)vm_get_src(vm));

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
	// push ret address


	vm_set_PC(vm, vm_get_u16(vm, vm_get_SP(vm)));
	vm_set_SP(vm, vm_get_SP(vm) + 0x2);
}


VM_IMPLEMENT_OPERATION(IRET)
{

	printf("iret: %u\n", vm_get_u16(vm, vm_get_SP(vm)));
	vm_set_PC(vm, vm_get_u16(vm, vm_get_SP(vm)));
	vm_set_SP(vm, vm_get_SP(vm) + 0x2);
}



VM_IMPLEMENT_OPERATION(ADD)
{
	vm_set_dst(vm, vm_get_dst(vm) + vm_get_src(vm));
}

VM_IMPLEMENT_OPERATION(SUB)
{
	vm_set_dst(vm, vm_get_dst(vm) - vm_get_src(vm));
}

VM_IMPLEMENT_OPERATION(MUL)
{
	vm_set_dst(vm, vm_get_dst(vm) * vm_get_src(vm));
}

VM_IMPLEMENT_OPERATION(IMUL)
{
	vm_set_dst(vm, (int8_t)vm_get_dst(vm) * (int8_t)vm_get_src(vm));
}

VM_IMPLEMENT_OPERATION(DIV)
{
	vm_set_dst(vm, vm_get_dst(vm) * vm_get_src(vm));
}

VM_IMPLEMENT_OPERATION(IDIV)
{
	vm_set_dst(vm, (int8_t)vm_get_dst(vm) / (int8_t)vm_get_src(vm));
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

}

VM_IMPLEMENT_OPERATION(JE)
{

}
VM_IMPLEMENT_OPERATION(JNE)
{

}
VM_IMPLEMENT_OPERATION(JZ)
{

}
VM_IMPLEMENT_OPERATION(JG)
{

}
VM_IMPLEMENT_OPERATION(JGE)
{

}
VM_IMPLEMENT_OPERATION(JL)
{

}
VM_IMPLEMENT_OPERATION(JLE)
{

}
