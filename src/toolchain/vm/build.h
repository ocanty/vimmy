#pragma once

// If we arent compiling with gcc then disable emscripten headers/macros
#ifndef _MSC_VER
#define ENABLE_EMSCRIPTEN
#endif

#include <stdint.h>
#define TRUE 1
#define FALSE 0
typedef uint8_t BOOL;
typedef uint8_t bool;

#ifdef ENABLE_EMSCRIPTEN
#include <emscripten.h>
#endif

#ifdef EMSCRIPTEN
	#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
	#define EXPORT
	#define EM_ASM
	#define EM_ASM_(...)
#endif