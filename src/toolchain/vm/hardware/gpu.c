
#include "gpu.h"
#include <string.h>
#include <stdlib.h>
#include <assert.h>
#include <stdio.h>

#include "../lodepng.h"

vmhw_gpu* g_vmGpuDvc;
vmhw_gpu_operation_t g_vmGpuOperations[0x1000];

#define VMHW_GPU_DEFAULT_TRANSPARENCY_MASK 0xF8

#define SCREEN_WIDTH 256

void vmhw_gpu_init(uint16_t* io,uint8_t* dma)
{
	printf("GPU init\n");
	g_vmGpuDvc = (vmhw_gpu*)malloc(sizeof(vmhw_gpu));

	g_vmGpuDvc->vm_dma = dma;

	g_vmGpuDvc->m_Screen = (uint16_t*)malloc(SCREEN_WIDTH*SCREEN_WIDTH*sizeof(uint16_t));
	memset((g_vmGpuDvc->m_Screen), VMHW_GPU_DEFAULT_TRANSPARENCY_MASK, SCREEN_WIDTH*SCREEN_WIDTH * sizeof(uint16_t));

	g_vmGpuDvc->m_Framebuffer = (uint16_t*)malloc(SCREEN_WIDTH*SCREEN_WIDTH * sizeof(uint16_t));
	memset((g_vmGpuDvc->m_Framebuffer), VMHW_GPU_DEFAULT_TRANSPARENCY_MASK, SCREEN_WIDTH*SCREEN_WIDTH * sizeof(uint16_t));

	g_vmGpuDvc->m_Font = (uint16_t*)malloc(128 * 128 * sizeof(uint16_t));
	memset((g_vmGpuDvc->m_Font), 0x0008, 128 * 128 * sizeof(uint16_t));

	//g_vmGpuDvc->m_Terminal = (uint8_t*)malloc(128 * 128 * sizeof(uint16_t));
	//memset(g_vmGpuDvc->m_Terminal, 0x0000, 128 * 128 * sizeof(uint16_t));
	//g_vmGpuDvc->m_TerminalColor = 0xEFEF;
	g_vmGpuDvc->m_TerminalEnabled = TRUE;

	// enable and set default transparency mask
	g_vmGpuDvc->m_TransparencyMaskEnabled = TRUE;
	g_vmGpuDvc->m_TransparencyMask = VMHW_GPU_DEFAULT_TRANSPARENCY_MASK;



	//memset(g_vmGpuOperations, 0x0000, sizeof(vmhw_gpu_operation_t)*0xFFF);

	//uint16_t* temp = (uint16_t*)g_vmGpuDvc->m_Screen;
	//for (uint16_t i = 0; i < 128 * 128; i++)
	//{
	//	temp[i] = i;
	//}

	// load font, currently emscripten only
	// todo do for regular build
	unsigned error;
	unsigned char* image;
	unsigned width, height;

	error = lodepng_decode32_file(&image, &width, &height, "/toolchain/vm/data/gpufont8x8.png");
	if (error) printf("gpu couldn't load font !!! error %u: %s\n", error, lodepng_error_text(error));
	else
	{
		/*
			Fontfile Conversion
			sandbox.js:92
			var compat_ptr = 0
			var vm_compat_data = new Uint16Array(img.width*img.height)

			var count = 0
			for(var i = 0; i < data.length; i++)
			{
				if(count == 4)
				{
					// rgb888 to rgb565
					var b = data[i-3]
					var g = data[i-2]
					var r = data[i-1]
					vm_compat_data[compat_ptr] = ((((r>>3)<<11) | ((g>>2)<<5) | (b>>3)))

					compat_ptr++
					count = 0
				}
				count++
			}
		*/
		uint16_t compat_ptr = 0;
		uint8_t count = 0;
		for (uint32_t i = 0; i < (128*128*4); i++)
		{
			if (count == 4)
			{
				// rgb888 to rgb565 
				int g = image[i - 3];
				int b = image[i - 2];
				int r = image[i - 1];
				g_vmGpuDvc->m_Font[compat_ptr] = ((((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3)));

				compat_ptr++;
				count = 0;
			}
			count++;
		}

		//g_vmGpuDvc->m_Screen = g_vmGpuDvc->m_Font;
	}

}

void vmhw_gpu_think(uint16_t* io,uint8_t* dma)
{
	uint16_t* msg  = (io + VMHW_GPU_IOPORT_BEGIN);
	uint16_t* args = (io + VMHW_GPU_IOPORT_BEGIN + 1);
	// 0xABCD
	if (((*msg) & 0xF000) == 0x1000) // A=1 -> if we have been told to process a message
	{
		// process the message
		g_vmGpuOperations[(*msg) & 0x0FFF](g_vmGpuDvc, args);

		printf("Dispatched gpu msg %u\n", *msg);
		// tell the cpu to fuck off
		// clear all gpu ports
		memset((io+VMHW_GPU_IOPORT_BEGIN), 0x0000, sizeof(uint16_t) * 7);
	}

	// draw terminal on top of the screen, not the framebuffer (!!!)
	// render terminal texture
	
}

inline void vmhw_gpu_put_pixel(vmhw_gpu* gpu, uint16_t xcoord,uint16_t ycoord,uint16_t color)
{
	//assert(xcoord < 128);
	//assert(ycoord < 128);
	if (gpu->m_TransparencyMaskEnabled == TRUE && color == gpu->m_TransparencyMask) return;

	gpu->m_Framebuffer[SCREEN_WIDTH * (ycoord) + (xcoord)] = color;
}


// BEGIN GPU MESSAGE HANDLERS
// SEE END OF FILE FOR DOCUMENTATION

void vmhw_gpu_clear_framebuffer(vmhw_gpu* gpu, uint16_t* args)
{
	memset((gpu->m_Framebuffer), 0x0000, SCREEN_WIDTH*SCREEN_WIDTH * sizeof(uint16_t));
}

void vmhw_gpu_flip_framebuffer(vmhw_gpu* gpu, uint16_t* args)
{
	uint16_t* temp = gpu->m_Screen;
	gpu->m_Screen = gpu->m_Framebuffer;
	gpu->m_Framebuffer = temp;
}

void vmhw_gpu_enable_transmask(vmhw_gpu* gpu, uint16_t* args)
{
	gpu->m_TransparencyMaskEnabled = TRUE;
}

void vmhw_gpu_disable_transmask(vmhw_gpu* gpu, uint16_t* args)
{
	gpu->m_TransparencyMaskEnabled = FALSE;
}

void vmhw_gpu_set_transmask(vmhw_gpu* gpu, uint16_t* args)
{
	gpu->m_TransparencyMask = args[5];
}

void vmhw_gpu_enable_terminal(vmhw_gpu* gpu, uint16_t* args)
{
	gpu->m_TerminalEnabled = TRUE;
}

void vmhw_gpu_disable_terminal(vmhw_gpu* gpu, uint16_t* args)
{
	gpu->m_TerminalEnabled = FALSE;
}

void vmhw_gpu_set_color_terminal(vmhw_gpu* gpu, uint16_t* args)
{
	gpu->m_TerminalColor = args[5];
}


void vmhw_gpu_set_text_terminal(vmhw_gpu* gpu, uint16_t* args)
{
	uint16_t preserve_mask = gpu->m_TransparencyMask;
	BOOL preserve_mask_enabled = gpu->m_TransparencyMaskEnabled;


	gpu->m_TransparencyMaskEnabled = TRUE;
	gpu->m_TransparencyMask = VMHW_GPU_DEFAULT_TRANSPARENCY_MASK;
	uint8_t console_x = 1;
	uint8_t console_y = 1;
	for (uint8_t* i = (gpu->vm_dma + args[4]);
		i < (gpu->vm_dma + args[4])+strlen(gpu->vm_dma + args[4]);
		i++)
	{
		uint8_t c = *i;
		//printf("%u\n", c);
		
		if (console_x > 31)
		{
			console_x = 0;
			console_y++;
		}

		if (console_y > 31)
		{
			console_y = 0;
			console_x = 0;
		}
		
		

		for (uint8_t _y = 0; _y < 8; _y++)
		{
			for (uint8_t _x = 0; _x < 8; _x++)
			{
				uint8_t file_x = ((c * 8) % 128)        + _x;
				uint8_t file_y = (((c * 8) - ((c * 8) % 128)) / 16) +_y;
				//printf("%u %u", file_x,file_y)
				vmhw_gpu_put_pixel(gpu,
					(console_x * 8) + _x,
					(console_y * 8) + _y,
					gpu->m_Font[128 * (file_y)+(file_x)]);
			}
		}

		console_x++;
	
	}

	gpu->m_TransparencyMaskEnabled = preserve_mask_enabled;
	gpu->m_TransparencyMask = preserve_mask;
}





void vmhw_gpu_draw_rect(vmhw_gpu* gpu, uint16_t* args)
{
	for (uint16_t x = args[0]; x < args[2]; x++)
	{
		for (uint16_t y = args[1]; y < args[3]; y++)
		{
			vmhw_gpu_put_pixel(gpu, x, y, args[5]);
		}
	}
}

// https://en.wikipedia.org/wiki/Midpoint_circle_algorithm
// alt (fast): http://stackoverflow.com/a/24453110/1924602
void vmhw_gpu_draw_circle(vmhw_gpu* gpu, uint16_t* args)
{
	int r2 = args[4] * args[4];
	int area = r2 << 2;
	int rr = args[4] << 1;

	for (int i = 0; i < area; i++)
	{
		int tx = (i % rr) - args[4];
		int ty = (i / rr) - args[4];

		if (tx * tx + ty * ty <= r2)
			vmhw_gpu_put_pixel(gpu, args[0] + tx, args[1] + ty, args[5]);
	}
}

// https://rosettacode.org/wiki/Bitmap/Bresenham%27s_line_algorithm#C
void vmhw_gpu_draw_line(vmhw_gpu* gpu, uint16_t* args)
{
	int x0 = args[0]; int y0 = args[1];
	int x1 = args[2]; int y1 = args[3];

	int dx = abs(x1 - x0), sx = x0<x1 ? 1 : -1;
	int dy = abs(y1 - y0), sy = y0<y1 ? 1 : -1;
	int err = (dx>dy ? dx : -dy) / 2, e2;

	for (;;) {
		vmhw_gpu_put_pixel(gpu,x0, y0, args[5]);
		if (x0 == x1 && y0 == y1) break;
		e2 = err;
		if (e2 >-dx) { err -= dy; x0 += sx; }
		if (e2 < dy) { err += dx; y0 += sy; }
	}
}

/*
	GPUv1 Messaging Protocol

	The GPU also supports a 16*16 console, draws over all shapes by default.
	

	Each GPU coordinate is a 16-bit value. 0xXXXX 0xYYYY
	All GPU colors are in the RGB565 format.
	http://www.rinkydinkelectronics.com/calc_rgb565.php

	future thoughts ->
	0xXXYY ??
	will make user adding subtracting coordinates very difficult

	I/O port offset			Format		Example Value		Description
	0x9	0					0xAXYZ		0x0000, 0x1000		When A = 0, gpu is ready for new message, when A is set to 1, the GPU will process the current message.
	When the GPU is finished processing a message, it will clear all GPU ports, including this one
	XYZ = Message id (0x000-0xFFF)

	0xA	1					0xABCD		-					Message Argument 1 (value specified by message type)
	0xB	2					0xABCD		-					Message Argument 2 (value specified by message type)
	0xC	3					0xABCD		-					Message Argument 3 (value specified by message type)
	0xD	4					0xABCD		-					Message Argument 4 (value specified by message type)
	0xE	5					0xABCD		-					Message Argument 5 (value specified by message type)
	0xF	6					0xABCD		-					Message Argument 6 (value specified by message type)

	GPU Messages
*/








vmhw_gpu_operation_t g_vmGpuOperations[0x1000] = {
	// Message ID									//	Description						ARG0		ARG1		ARG2		ARG3		ARG4		ARG5
	[0x001] = &vmhw_gpu_clear_framebuffer,			//	Clears the framebuffer			-			-			-			-			-			Color
	[0x002] = &vmhw_gpu_flip_framebuffer,			//	Flip framebuffer				-			-			-			-			-			-
													//
													//
	//[0x050] = &vmhw_gpu_set_drawtexture,			//	Set draw texture				Addr		-			X-size		Y-size		-			-
	[0x051] = &vmhw_gpu_enable_transmask,			//	Enable transparency mask		-			-			-			-			-			-
	[0x052] = &vmhw_gpu_disable_transmask,			//	Disable transparency mask		-			-			-			-			-			-
	[0x053] = &vmhw_gpu_set_transmask,				//	Set transparency mask			-			-			-			-			-			Color

	[0x060] = &vmhw_gpu_enable_terminal,			//	Enable terminal
	[0x061] = &vmhw_gpu_disable_terminal,			//	Disable terminal
	[0x062] = &vmhw_gpu_set_color_terminal,			//  Set terminal text color			-			-			-			-			-			Color
	[0x063] = &vmhw_gpu_set_text_terminal,			//  Set text on terminal			X-coord		Y-coord		-			-			Addr-DMA	-

	[0x100] = &vmhw_gpu_draw_rect,					//	Draw rectangle					X-coord		Y-coord		X2-coord	Y2-coord	-			Color
	[0x101] = &vmhw_gpu_draw_circle,				//	Draw circle						X-coord		Y-coord		-			-			Radius		Color
	[0x102] = &vmhw_gpu_draw_line,					//	Draw line						X1-coord	Y1-coord	X2-coord	Y2-coord	Thickness	Color

};












#ifdef EMSCRIPTEN
uint16_t * EXPORT vmhw_gpu_get_screen_ptr()
{
	return g_vmGpuDvc->m_Screen;
}
#endif