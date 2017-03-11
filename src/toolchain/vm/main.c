#ifndef EMSCRIPTEN // deprecated, non-emscripten build not supported at the moment
#include "vm.h"
#include "memory.h"
#include "build.h"
#include "hardware\interrupter.h"

int EXPORT main(int argc, char** argv)
{
	vm_state* vm = vm_init();
	
	vm_reset(vm);

	uint8_t buf[] = { 0x4,0x20,0x10,0x3,0x3,0x12,0x10,0xFF,0xFB,0x3,0x12,0x20,0x0,0x5,0x11,0x11,0x12,0x4,0x20,0x10,0x3,0,0,0,0 };
	vm_load_memory(vm, 0xFFF, buf, sizeof(buf));

	char* a = malloc(0xFFFF);
	//vm_get_dasm_string(vm,a);
	//printf(a);
	//free(a);

	vm_set_status(vm, StepAll);
	vmhw_interrupter_queue_interrupt(0xFF);
	vm_cycle(vm);

	//vm_deinit(vm);
	system("PAUSE");
	return 0;
}
#else

#endif