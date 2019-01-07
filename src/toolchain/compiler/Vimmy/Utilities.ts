
namespace Vimmy
{
  export namespace Utilities
  {
    /**
     * Prints an array into the console as a stream of hex characters
     * @param array The array
     */
    export function printHex(array: Uint8Array)
    {
      var str = ""
      for (var k in array)
      {
        var number = array[k]
        if (number < 0)
        {
          number = 0xFFFFFFFF + number + 1;
        }

        str += number.toString(16).toUpperCase() + " "
      }

      console.log(str)
    }

    export function asHex(array: Uint8Array) : string
    {
      var str = ""
      for (var k in array)
      {
        var number = array[k]
        if (number < 0)
        {
          number = 0xFFFFFFFF + number + 1;
        }

        str += number.toString(16).toUpperCase() + " "
      }

      return str
    }
  }
}
