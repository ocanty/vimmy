
/// <reference path="TokenStream.ts"/>

namespace Vimmy
{
  export namespace Assembler
  {
    /**
     * A tokenizer searches for a string of tokens specified by a TokenSpec
     */
    export class Tokenizer
    {
      constructor()
      {
        this.setSpec(Spec.getTokenSpec());
      }

      private tokenTree: Object

      /**
       * Set the TokenSpec of the tokenizer
       * @param spec The TokenSpec to follow when searching for tokens in the future
       */
      setSpec(spec: TokenTree)
      {
        this.tokenTree = spec.getTree();
      }

      private static isPunctuation(character: string): boolean
      {
        return (character == " " || character == "," || character == "[" || character == "]" || character == "-" || character == "+" || character == "\n" || character == "\r")
      }

      /**
       * Tokenizes the text inputted, returning a TokenStream, newlines are processed as the token "TERMINATION"
       * @param text_input
       */
      tokenize(text_input: string): TokenStream
      {
        // Ported from javascript (vimmy-old/vimmy__)
        // Attach a newline to the input so label sequences will terminate properly (see below)
        text_input = text_input + " \n"

        // First we will build an object of tokens indexed by their line, this will be used later when showing errors
        // Example:
        // output[0] = [ "sometoken", "anothertoken"]
        var output = {}
        let cur_line_number: number = 0
        output[cur_line_number] = []

        // We plan to walk the tree matching each character until we reach .head, if we do we push its token to the output
        // If we dont get any matches we ignore special characters and assume it is a label sequence
        // The current ref to the tree position is stored in state
        // The lexeme is the buffer of characters
        var state = this.tokenTree
        var lexeme = ""
        var insideLabelSequence = false

        // Go through every character
        for (var i = 0; i < text_input.length + 1; i++)
        {
          var character = text_input.charAt(i)
          var char_code = character.charCodeAt(0)

          // Custom text handled here, if we are in a label sequence
          if (insideLabelSequence)
          {
            state = this.tokenTree // Reset root every time for future searches, this will also terminate the sequence
            // Label is terminated by punctuation, eg: " " , [ ], or newlines
            if (Tokenizer.isPunctuation(character))
            {
              insideLabelSequence = false // we left the label sequence

              // Now we process what we collected before we got here

              // See it if it is processable as a number
              var n = parseInt(lexeme)
              //console.log(lexeme)
              if (!isNaN(parseInt(lexeme)))
              {
                // console.log("NUMBER_".concat(n))
                output[cur_line_number].push("NUMBER_" + n.toString())
              }
              else // Or else declare it as a label/identifier
              {
                // console.log("LABEL_".concat(lexeme))
                output[cur_line_number].push("LABEL_".concat(lexeme))
              }

              // Reset the lexeme
              lexeme = ""
            }
          }

          // Now we check

          // Discard unprintable characters, allow newlines
          if (char_code > 31 && char_code < 127 || char_code == 10)
          {
            // If its not a space, then add to lexeme
            if (char_code > 32) lexeme += character

            // Push terminate token on new lines
            if (char_code == 10)
            {
              output[cur_line_number].push("TERMINATE")

              // Add an array for the next line number
              cur_line_number++
              output[cur_line_number] = []

              // Reset
              state = this.tokenTree
              lexeme = ""
            }

            // console.log(character,state)
            // If the current node has a child, and that child has a root element (.head)
            if (state.hasOwnProperty(character) && state[character].hasOwnProperty(".head") && !insideLabelSequence)
            {
              if (lexeme.length != 1) // We already surpassed token length of 1, see else branch below
              {
                // console.log(state[character][0])
                output[cur_line_number].push(state[character][".head"]) // Push token

                // Reset
                state = this.tokenTree
                lexeme = ""
              }
              else // Token length is 1
              {
                var next_char = text_input.charAt(i + 1)
                // console.log("Single symbol token found: nextchar" , next_char)

                // We need to figure out if this lexeme is length 1 or just the first character of another lexeme
                // Therefore check the next character
                if (state[character].hasOwnProperty(next_char)) // If a child exists with the next char then its part of another lexeme
                {
                  state = state[character]
                }
                else if (Tokenizer.isPunctuation(character) || Tokenizer.isPunctuation(next_char)) // If there are no possible children and it terminated
                {
                  // console.log(state[character][0])
                  output[cur_line_number].push(state[character][".head"]) // Push token

                  // Reset
                  state = this.tokenTree
                  lexeme = ""
                }
                else
                {
                  insideLabelSequence = true
                }

              }
            }
            // If there is no .head, set the root to the next node if a character matches
            else if (typeof (state[character]) == "object" && !insideLabelSequence)
            {
              state = state[character]
            }
            // If there are no character matches, then it must be custom text, this wil be handled above once we determine if the sequence terminates
            else if (char_code > 32) // ignore spaces
            {
              insideLabelSequence = true
            }
          }
        }

        console.log("LEXED ::", output)

        // Now lets turn our line based array object into a TokenStream
        var arr_type = []
        var arr_id = []
        var arr_ln = []

        for (var line in output)
        {
          var line_tokenstream = output[line]

          for (i = 0; i < line_tokenstream.length; i++)
          {
            var token = output[line][i]

            // lexer dumps info like INSTRUCTION_PUSH, LABEL_add_function:, etc..
            // split the _ and push the seperate info to a type and id table, make sure to only split from the first _ (!!)
            var token_deduce = token.split("_");

            // console.log(token_deduce)
            var type = token_deduce[0];
            var id = token.substring(token_deduce[0].length+1,token.length)

            // example: REGISTER_A (line 5)
            // push REGISTER, push A, push 5
            arr_type.push(type)
            arr_id.push(id)
            arr_ln.push(line)
          }
        }

        console.log(new TokenStream(arr_type, arr_id, arr_ln));
        return new TokenStream(arr_type, arr_id, arr_ln);
      }
    }
  }
}
