#include "interrupter.h"

vmhw_interrupter* g_vmInterrupterDvc;

void vmhw_interrupter_init(uint16_t * io, uint8_t * dma)
{
	printf("Interrupter init\n");
	g_vmInterrupterDvc = (vmhw_interrupter*)malloc(sizeof(vmhw_interrupter));
	g_vmInterrupterDvc->m_InterruptQueuePtr = 0xFF;
}

// Interrupts over I/O bus
// PORT -> VALUE
// 0x0  -> 0xABCD
//
// A =	0 - no interrupt
//		1 - interrupt set by interrupter, waiting for cpu acknowledge
//		2 - interrupt waiting for cpu to process
//		3 - interrupt processed by cpu, waiting for interrupter to reset to 0
// B =  0 - unused/reserved
// C,D = 0x00-0xff - interupt handler
void vmhw_interrupter_think(uint16_t * io, uint8_t * dma)
{
	switch ((io[VMHW_INTERRUPTER_IOPORT_BEGIN] & 0xF000) >> 12)
	{
	case 0: // no interrupt, lets do our stuff

		if (g_vmInterrupterDvc->m_InterruptQueuePtr != 0xFF)
		{
			printf("Interrupter dispatching interrupt %u\n", g_vmInterrupterDvc->m_InterruptQueue[g_vmInterrupterDvc->m_InterruptQueuePtr]);
			io[VMHW_INTERRUPTER_IOPORT_BEGIN] = 0x1000 + g_vmInterrupterDvc->m_InterruptQueue[g_vmInterrupterDvc->m_InterruptQueuePtr];
			g_vmInterrupterDvc->m_InterruptQueuePtr++;
		}
	break;

	case 3: // interrupt is done being processed by cpu, lets reset it and do our stuff next cycle
		io[VMHW_INTERRUPTER_IOPORT_BEGIN] = 0x0000;
		break;
	}
}

void vmhw_interrupter_queue_interrupt(uint8_t handler)
{
	// TODO: error check size

	printf("Queuing interrupt: %u, interrupt queue is now %u elements long\n", handler,0xFF-g_vmInterrupterDvc->m_InterruptQueuePtr);
	g_vmInterrupterDvc->m_InterruptQueuePtr--;
	g_vmInterrupterDvc->m_InterruptQueue[g_vmInterrupterDvc->m_InterruptQueuePtr] = handler;

}
