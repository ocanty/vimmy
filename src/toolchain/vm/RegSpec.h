#pragma once 

enum RegSpec {
        /* 16-bit */
        A = 0x1,
        B = 0x2,
        C = 0x3,
        D = 0x4,

        /* 8-bit, hi, lo of 16-bit */
        AH = 0x5,
        AL = 0x6,
        BH = 0x7,
        BL = 0x8,

        /* Status/Internal*/
        PC = 0xF,
        SP = 0xE,
        BP = 0xD,
        SF = 0xC,
        CF = 0xB
};

static const char* RegSpecMap[] = {
	[0x1] = "A",
	[0x2] = "B",
	[0x3] = "C",
	[0x4] = "D",
	[0x5] = "AH",
	[0x6] = "AL",
	[0x7] = "BH",
	[0x8] = "BL",
	[0xF] = "PC",
	[0xE] = "SP",
	[0xD] = "BP",
	[0xC] = "SF",
	[0xB] = "CF"
};