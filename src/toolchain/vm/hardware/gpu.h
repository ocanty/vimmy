#pragma once

#include <stdio.h>
#include <stdint.h>
#include "../build.h"
#define VMHW_GPU_HWID 0x03
#define VMHW_GPU_IOPORT_BEGIN 0x9

// A,B,C,D,E,F

// vm_state
typedef struct vmhw_gpu
{
	uint8_t* vm_dma;

	uint16_t* m_Screen;
	uint16_t* m_Framebuffer; // all operations write to this, on fb flip m_Screen = m_Framebuffer, and vice versa
	uint16_t* m_Font;

	uint8_t* m_Terminal;
	uint16_t m_TerminalColor; // color used by the future terminal insertions
	BOOL m_TerminalEnabled;

	BOOL m_TransparencyMaskEnabled;
	uint16_t m_TransparencyMask; // the vm will not do a draw operation with this color
} vmhw_gpu;

//extern vmhw_gpu* g_vmGpuDvc;
typedef void(*vmhw_gpu_operation_t)(vmhw_gpu* dvc, uint16_t* args);

extern vmhw_gpu_operation_t g_vmGpuOperations[0x1000]; // 0x0-0xFFF

void vmhw_gpu_init(uint16_t* io,uint8_t* dma);
void vmhw_gpu_think(uint16_t* io, uint8_t* dma);

#ifdef EMSCRIPTEN

uint16_t* EXPORT vmhw_gpu_get_screen_ptr();

#endif