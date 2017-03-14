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


// http://c-faq.com/misc/bitsets.html
#include <limits.h>		/* for CHAR_BIT */

#define BITMASK(b) (1 << ((b) % CHAR_BIT))
#define BITSLOT(b) ((b) / CHAR_BIT)
#define BITSET(a, b) ((a)[BITSLOT(b)] |= BITMASK(b))
#define BITCLEAR(a, b) ((a)[BITSLOT(b)] &= ~BITMASK(b))
#define BITTEST(a, b) ((a)[BITSLOT(b)] & BITMASK(b))
#define BITNSLOTS(nb) ((nb + CHAR_BIT - 1) / CHAR_BIT)

#define ISSIGNED(x) ((uint16_t)x) >> 15

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