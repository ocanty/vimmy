#pragma once

#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include "../build.h"
#define VMHW_INTERRUPTER_HWID 0x01

#define VMHW_INTERRUPTER_IOPORT_BEGIN 0x00

// vm_state
typedef struct vmhw_interrupter
{
    uint8_t m_InterruptQueue[0xFF];
    uint8_t m_InterruptQueuePtr;
} vmhw_interrupter;

extern vmhw_interrupter* g_vmInterrupterDvc;

void vmhw_interrupter_init(uint16_t* io, uint8_t* dma);
void vmhw_interrupter_think(uint16_t* io, uint8_t* dma);
void EXPORT vmhw_interrupter_queue_interrupt(uint8_t handler);