#pragma once

#include <stdio.h>
#include <stdint.h>
#include "../build.h"
#define VMHW_KEYBOARD_HWID 0x02
#define VMHW_KEYBOARD_IR_HANDLER 0x32
#define VMHW_KEYBOARD_IOPORT_BEGIN 0x01


// vm_state
typedef struct vmhw_keyboard
{
	uint16_t* m_iobridge;
	uint8_t* m_dma;
} vmhw_keyboard;

extern vmhw_keyboard* g_vmKeyboardDvc;

void vmhw_keyboard_init(uint16_t* io, uint8_t* dma);
void vmhw_keyboard_think(uint16_t* io, uint8_t* dma);

void EXPORT vmhw_keyboard_keypress(uint8_t scancode);