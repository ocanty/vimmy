

namespace Vimmy
{
    /**
     * Container class for binary data loaded into the virtual machine
     */
    export class ROM
    {
        /**
         * 
         * @param moduleBase The default address that the ROM should be loaded into
         * @param binary The binary data
         */
        constructor(moduleBase: number, binary: Uint8Array)
        {
            this.moduleBase = moduleBase
            this.binary = binary
        }

        private moduleBase: number
        private binary: Uint8Array

        /**
         * Get the stored binary data
         */
        getBinary(): Uint8Array { return this.binary }

        /**
         * Get the default address that the ROM would typically be loaded into
         */
        getModuleBase(): number { return this.moduleBase }
    }
}